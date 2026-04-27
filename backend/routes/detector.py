import asyncio
import base64
import os
import pickle
import tempfile

import cv2
import mediapipe as mp
import numpy as np
from fastapi import APIRouter, File, UploadFile, WebSocket, WebSocketDisconnect

# ── Modelo ────────────────────────────────────────────────────────────────────
_MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'model', 'modelo_frontraise.pkl')

with open(_MODEL_PATH, 'rb') as f:
    _dados = pickle.load(f)

_modelo  = _dados['model']
_scaler  = _dados['scaler']
_classes = _dados['classes']

# ── Constantes ────────────────────────────────────────────────────────────────
MP_OMBRO_E    = 11; MP_OMBRO_D    = 12
MP_COTOVELO_E = 13; MP_COTOVELO_D = 14
MP_PUNHO_E    = 15; MP_PUNHO_D    = 16
MP_QUADRIL_E  = 23; MP_QUADRIL_D  = 24

THRESHOLD_REPOUSO   = 20
MIN_FRAMES_REP_WS   = 3    # WebSocket: ~1-2fps efetivos
MIN_FRAMES_REP_VID  = 5    # Vídeo: ~10fps efetivos (1 a cada 3 frames de 30fps)
RESULTADO_FRAMES    = 25
FRAME_SKIP          = 3    # Processa 1 a cada 3 frames do vídeo

router = APIRouter()
_mp_pose = mp.solutions.pose

# ── Helpers ───────────────────────────────────────────────────────────────────
def _ponto(lm, idx, w, h):
    return [lm[idx].x * w, lm[idx].y * h]

def _angulo(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    ang = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    ang = np.abs(ang * 180 / np.pi)
    return 360 - ang if ang > 180 else ang

def _classificar(frames_rep):
    peak     = max(frames_rep, key=lambda x: x[0])
    features = _scaler.transform(peak[1]) if _scaler else peak[1]
    pred     = _modelo.predict(features)[0]
    prob     = _modelo.predict_proba(features)[0]
    confianca = prob[pred] * 100
    label = f"{_classes[pred].upper()}  {confianca:.0f}%"
    cor   = 'verde' if pred == 0 else 'vermelho'
    return label, cor

def _extrair_features(lm, w, h):
    ombro_e    = _ponto(lm, MP_OMBRO_E,    w, h)
    cotovelo_e = _ponto(lm, MP_COTOVELO_E, w, h)
    punho_e    = _ponto(lm, MP_PUNHO_E,    w, h)
    quadril_e  = _ponto(lm, MP_QUADRIL_E,  w, h)
    ombro_d    = _ponto(lm, MP_OMBRO_D,    w, h)
    cotovelo_d = _ponto(lm, MP_COTOVELO_D, w, h)
    punho_d    = _ponto(lm, MP_PUNHO_D,    w, h)
    quadril_d  = _ponto(lm, MP_QUADRIL_D,  w, h)

    ang_braco_e = _angulo(quadril_e, ombro_e, cotovelo_e)
    ang_braco_d = _angulo(quadril_d, ombro_d, cotovelo_d)
    ang_cot_e   = _angulo(ombro_e, cotovelo_e, punho_e)
    ang_cot_d   = _angulo(ombro_d, cotovelo_d, punho_d)
    altura_ref  = abs(ombro_e[1] - quadril_e[1]) or 1

    features_raw = np.array([[
        ang_braco_e, ang_cot_e,
        ang_braco_d, ang_cot_d,
        (punho_e[1] - ombro_e[1]) / altura_ref,
        (punho_d[1] - ombro_d[1]) / altura_ref,
        abs(ang_braco_e - ang_braco_d),
    ]])
    ang_max = max(ang_braco_e, ang_braco_d)
    return features_raw, ang_max

# ── Análise de vídeo ──────────────────────────────────────────────────────────
def _processar_video(path: str) -> dict:
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

            features_raw, ang_max = _extrair_features(res.pose_landmarks.landmark, w, h)
            em_repouso = ang_max < THRESHOLD_REPOUSO

            if em_repouso:
                if estado == 'EM_EXECUCAO':
                    if len(frames_rep) >= MIN_FRAMES_REP_VID:
                        label, cor = _classificar(frames_rep)
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
                frames_rep.append((ang_max, features_raw))

    cap.release()

    corretos   = sum(1 for r in reps_detalhes if r['correto'])
    incorretos = len(reps_detalhes) - corretos

    return {
        'reps':      contador_reps,
        'corretos':  corretos,
        'incorretos': incorretos,
        'detalhes':  reps_detalhes,
    }


@router.post('/detector/analyze')
async def analyze_video(video: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
        tmp.write(await video.read())
        tmp_path = tmp.name

    try:
        result = await asyncio.to_thread(_processar_video, tmp_path)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    return result


# ── WebSocket (mantido para compatibilidade) ──────────────────────────────────
@router.websocket('/ws/detector')
async def detector_ws(websocket: WebSocket):
    await websocket.accept()

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

                features_raw, ang_max = _extrair_features(res.pose_landmarks.landmark, w, h)
                em_repouso = ang_max < THRESHOLD_REPOUSO

                if em_repouso:
                    if estado == 'EM_EXECUCAO':
                        if len(frames_rep) >= MIN_FRAMES_REP_WS:
                            ultimo_label, ultimo_cor = _classificar(frames_rep)
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
                    frames_rep.append((ang_max, features_raw))
                    await websocket.send_json({'state': 'EM_EXECUCAO', 'label': 'Executando...', 'cor': 'amarelo', 'reps': contador_reps})

        except WebSocketDisconnect:
            pass
