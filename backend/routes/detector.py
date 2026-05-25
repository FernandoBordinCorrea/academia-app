import asyncio
import base64
import os
import pickle
import tempfile

import cv2
import mediapipe as mp
import numpy as np
from fastapi import APIRouter, File, Query, UploadFile, WebSocket, WebSocketDisconnect

# ── Carregar modelos ──────────────────────────────────────────────────────────
def _load_model(filename):
    path = os.path.join(os.path.dirname(__file__), '..', '..', 'model', filename)
    with open(path, 'rb') as f:
        return pickle.load(f)

_fr = _load_model('modelo_frontraise.pkl')
_bc = _load_model('modelo_biceps.pkl')

# ── Índices MediaPipe Pose ────────────────────────────────────────────────────
MP_OMBRO_E    = 11; MP_OMBRO_D    = 12
MP_COTOVELO_E = 13; MP_COTOVELO_D = 14
MP_PUNHO_E    = 15; MP_PUNHO_D    = 16
MP_QUADRIL_E  = 23; MP_QUADRIL_D  = 24

# ── Constantes ────────────────────────────────────────────────────────────────
MIN_FRAMES_REP_WS  = 3
MIN_FRAMES_REP_VID = 5
MIN_FRAMES_REP_VID_BICEPS = 3
RESULTADO_FRAMES   = 25
FRAME_SKIP         = 3

router = APIRouter()
_mp_pose = mp.solutions.pose

# ── Helpers geométricos ───────────────────────────────────────────────────────
def _pt(lm, idx, w, h):
    return [lm[idx].x * w, lm[idx].y * h]

def _angulo(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    ang = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    ang = np.abs(ang * 180 / np.pi)
    return 360 - ang if ang > 180 else ang

# ── Extração de features por exercício ───────────────────────────────────────
def _extrair_frontraise(lm, w, h):
    ombro_e    = _pt(lm, MP_OMBRO_E,    w, h)
    cotovelo_e = _pt(lm, MP_COTOVELO_E, w, h)
    punho_e    = _pt(lm, MP_PUNHO_E,    w, h)
    quadril_e  = _pt(lm, MP_QUADRIL_E,  w, h)
    ombro_d    = _pt(lm, MP_OMBRO_D,    w, h)
    cotovelo_d = _pt(lm, MP_COTOVELO_D, w, h)
    punho_d    = _pt(lm, MP_PUNHO_D,    w, h)
    quadril_d  = _pt(lm, MP_QUADRIL_D,  w, h)

    ang_braco_e = _angulo(quadril_e, ombro_e, cotovelo_e)
    ang_braco_d = _angulo(quadril_d, ombro_d, cotovelo_d)
    ang_cot_e   = _angulo(ombro_e, cotovelo_e, punho_e)
    ang_cot_d   = _angulo(ombro_d, cotovelo_d, punho_d)
    altura_ref  = abs(ombro_e[1] - quadril_e[1]) or 1

    features = np.array([[
        ang_braco_e, ang_cot_e,
        ang_braco_d, ang_cot_d,
        (punho_e[1] - ombro_e[1]) / altura_ref,
        (punho_d[1] - ombro_d[1]) / altura_ref,
        abs(ang_braco_e - ang_braco_d),
    ]])
    intensity = max(ang_braco_e, ang_braco_d)
    return features, intensity

def _extrair_biceps(lm, w, h):
    # Usa o lado com maior visibilidade (câmera de lado, um braço ocluído)
    vis_e = lm[MP_COTOVELO_E].visibility
    vis_d = lm[MP_COTOVELO_D].visibility

    if vis_d >= vis_e:
        ombro   = _pt(lm, MP_OMBRO_D,    w, h)
        cotovelo = _pt(lm, MP_COTOVELO_D, w, h)
        punho   = _pt(lm, MP_PUNHO_D,    w, h)
        quadril = _pt(lm, MP_QUADRIL_D,  w, h)
    else:
        ombro   = _pt(lm, MP_OMBRO_E,    w, h)
        cotovelo = _pt(lm, MP_COTOVELO_E, w, h)
        punho   = _pt(lm, MP_PUNHO_E,    w, h)
        quadril = _pt(lm, MP_QUADRIL_E,  w, h)

    ang_cot   = _angulo(ombro, cotovelo, punho)
    ang_braco = _angulo(quadril, ombro, cotovelo)
    altura_ref = abs(ombro[1] - quadril[1]) or 1
    alt_punho  = (punho[1] - ombro[1]) / altura_ref

    features  = np.array([[ang_cot, ang_braco, alt_punho]])
    # intensity sobe com a flexão: 0 = braço estendido, ~130 = máximo
    intensity = 180.0 - ang_cot
    return features, intensity

# ── Configuração por exercício ────────────────────────────────────────────────
_EX = {
    'frontraise': {
        'model':      _fr['model'],
        'scaler':     _fr['scaler'],
        'classes':    _fr['classes'],
        'extract':    _extrair_frontraise,
        'is_repouso': lambda i: i < 20,   # ang_braco < 20° = braço abaixado
        'min_frames': MIN_FRAMES_REP_VID,
    },
    'biceps': {
        'model':      _bc['model'],
        'scaler':     _bc['scaler'],
        'classes':    _bc['classes'],
        'extract':    _extrair_biceps,
        'is_repouso': lambda i: i < 50,   # 180-ang_cot < 50 → ang_cot > 130° = braço suficientemente estendido
        'min_frames': MIN_FRAMES_REP_VID_BICEPS,
    },
}

# ── Classificação ─────────────────────────────────────────────────────────────
def _classificar(frames_rep, cfg):
    peak     = max(frames_rep, key=lambda x: x[0])
    features = cfg['scaler'].transform(peak[1]) if cfg['scaler'] else peak[1]
    pred     = cfg['model'].predict(features)[0]
    prob     = cfg['model'].predict_proba(features)[0]
    confianca = prob[pred] * 100
    label = f"{cfg['classes'][pred].upper()}  {confianca:.0f}%"
    cor   = 'verde' if pred == 0 else 'vermelho'
    return label, cor

# ── Análise de vídeo ──────────────────────────────────────────────────────────
def _processar_video(path: str, exercise: str) -> dict:
    cfg = _EX.get(exercise, _EX['frontraise'])
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        return {'reps': 0, 'corretos': 0, 'incorretos': 0, 'detalhes': []}

    estado        = 'AGUARDANDO'
    frames_rep    = []
    contador_reps = 0
    reps_detalhes = []
    frame_idx     = 0

    with _mp_pose.Pose(min_detection_confidence=0.6, min_tracking_confidence=0.6) as pose:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_idx += 1
            if frame_idx % FRAME_SKIP != 0:
                continue

            h, w = frame.shape[:2]
            rgb  = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res  = pose.process(rgb)

            if not res.pose_landmarks:
                continue

            features_raw, intensity = cfg['extract'](res.pose_landmarks.landmark, w, h)
            em_repouso = cfg['is_repouso'](intensity)

            if em_repouso:
                if estado == 'EM_EXECUCAO':
                    if len(frames_rep) >= cfg['min_frames']:
                        label, cor = _classificar(frames_rep, cfg)
                        contador_reps += 1
                        reps_detalhes.append({
                            'rep':     contador_reps,
                            'label':   label,
                            'cor':     cor,
                            'correto': cor == 'verde',
                        })
                    frames_rep = []
                estado = 'AGUARDANDO'
            else:
                if estado == 'AGUARDANDO':
                    estado     = 'EM_EXECUCAO'
                    frames_rep = []
                frames_rep.append((intensity, features_raw))

    cap.release()

    corretos   = sum(1 for r in reps_detalhes if r['correto'])
    incorretos = len(reps_detalhes) - corretos

    return {
        'reps':       contador_reps,
        'corretos':   corretos,
        'incorretos': incorretos,
        'detalhes':   reps_detalhes,
    }


@router.post('/detector/analyze')
async def analyze_video(
    video: UploadFile = File(...),
    exercise: str = Query('frontraise', pattern='^(frontraise|biceps)$'),
):
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
        tmp.write(await video.read())
        tmp_path = tmp.name

    try:
        result = await asyncio.to_thread(_processar_video, tmp_path, exercise)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    return result


# ── WebSocket (mantido para compatibilidade — usa frontraise) ─────────────────
@router.websocket('/ws/detector')
async def detector_ws(websocket: WebSocket):
    await websocket.accept()
    cfg = _EX['frontraise']

    estado          = 'AGUARDANDO'
    frames_rep      = []
    contador_reps   = 0
    ultimo_label    = ''
    ultimo_cor      = 'cinza'
    resultado_timer = 0

    with _mp_pose.Pose(min_detection_confidence=0.6, min_tracking_confidence=0.6) as pose:
        try:
            while True:
                data = await websocket.receive_text()

                img_bytes = base64.b64decode(data)
                nparr     = np.frombuffer(img_bytes, np.uint8)
                frame     = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is None:
                    continue

                h, w = frame.shape[:2]
                rgb  = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                res  = await asyncio.to_thread(pose.process, rgb)

                if not res.pose_landmarks:
                    if resultado_timer > 0:
                        resultado_timer -= 1
                        await websocket.send_json({'state': 'RESULTADO', 'label': ultimo_label, 'cor': ultimo_cor, 'reps': contador_reps})
                    else:
                        await websocket.send_json({'state': 'AGUARDANDO', 'label': 'Sem pose detectada', 'cor': 'cinza', 'reps': contador_reps})
                    continue

                features_raw, intensity = cfg['extract'](res.pose_landmarks.landmark, w, h)
                em_repouso = cfg['is_repouso'](intensity)

                if em_repouso:
                    if estado == 'EM_EXECUCAO':
                        if len(frames_rep) >= MIN_FRAMES_REP_WS:
                            ultimo_label, ultimo_cor = _classificar(frames_rep, cfg)
                            resultado_timer = RESULTADO_FRAMES
                            contador_reps  += 1
                        frames_rep = []
                    estado = 'AGUARDANDO'

                    if resultado_timer > 0:
                        resultado_timer -= 1
                        await websocket.send_json({'state': 'RESULTADO', 'label': ultimo_label, 'cor': ultimo_cor, 'reps': contador_reps})
                    else:
                        await websocket.send_json({'state': 'AGUARDANDO', 'label': 'Aguardando movimento...', 'cor': 'cinza', 'reps': contador_reps})
                else:
                    if estado == 'AGUARDANDO':
                        estado     = 'EM_EXECUCAO'
                        frames_rep = []
                    frames_rep.append((intensity, features_raw))
                    await websocket.send_json({'state': 'EM_EXECUCAO', 'label': 'Executando...', 'cor': 'amarelo', 'reps': contador_reps})

        except WebSocketDisconnect:
            pass
