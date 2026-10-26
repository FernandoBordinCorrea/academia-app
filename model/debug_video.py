"""Roda o mesmo pipeline do backend (/detector/analyze) num vídeo local,
imprimindo diagnóstico frame a frame (ângulos, visibilidade de cada
articulação, intensidade) e o resultado de cada repetição.

Reaproveita as funções de extração/classificação de backend/routes/detector.py
direto (mesmo código que roda em produção), em vez de reimplementar a lógica.

Uso:
    source ../backend/venv/bin/activate
    python3 debug_video.py caminho/video.mp4 [frontraise|biceps]
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import cv2  # noqa: E402
from routes import detector as det  # noqa: E402

LANDMARKS_INTERESSE = {
    'ombro_e': det.MP_OMBRO_E, 'ombro_d': det.MP_OMBRO_D,
    'cotovelo_e': det.MP_COTOVELO_E, 'cotovelo_d': det.MP_COTOVELO_D,
    'punho_e': det.MP_PUNHO_E, 'punho_d': det.MP_PUNHO_D,
    'quadril_e': det.MP_QUADRIL_E, 'quadril_d': det.MP_QUADRIL_D,
}


def debug_video(path, exercise):
    cfg = det._EX[exercise]
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        print(f'Não consegui abrir {path}')
        return

    w_in = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h_in = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps_in = cap.get(cv2.CAP_PROP_FPS)
    print(f'Vídeo: {w_in}x{h_in} @ {fps_in:.1f}fps — exercício: {exercise}\n')

    estado        = 'AGUARDANDO'
    frames_rep    = []
    contador_reps = 0
    frame_idx     = 0

    with det._mp_pose.Pose(min_detection_confidence=0.6, min_tracking_confidence=0.6) as pose:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_idx += 1
            if frame_idx % det.FRAME_SKIP != 0:
                continue

            h, w = frame.shape[:2]
            rgb  = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res  = pose.process(rgb)

            if not res.pose_landmarks:
                print(f'frame {frame_idx:4d}  SEM POSE DETECTADA')
                continue

            lm = res.pose_landmarks.landmark
            vis_str = ' '.join(f'{nome}={lm[idx].visibility:.2f}' for nome, idx in LANDMARKS_INTERESSE.items())

            features_raw, intensity = cfg['extract'](lm, w, h)
            em_repouso  = cfg['is_repouso'](intensity)
            estado_str  = 'REPOUSO   ' if em_repouso else 'EXECUTANDO'

            print(f'frame {frame_idx:4d}  intensity={intensity:7.2f}  {estado_str}  {vis_str}  '
                  f'features={[round(x, 1) for x in features_raw[0].tolist()]}')

            if em_repouso:
                if estado == 'EM_EXECUCAO':
                    if len(frames_rep) >= cfg['min_frames']:
                        peak = max(frames_rep, key=lambda x: x[0])
                        label, cor = det._classificar(frames_rep, cfg)
                        contador_reps += 1
                        print(f'--- REP {contador_reps}: {label}  '
                              f'(pico intensity={peak[0]:.2f}, features do pico='
                              f'{[round(x, 1) for x in peak[1][0].tolist()]}) ---\n')
                    else:
                        print(f'--- movimento descartado ({len(frames_rep)} frames < '
                              f'{cfg["min_frames"]} mínimos) ---\n')
                    frames_rep = []
                estado = 'AGUARDANDO'
            else:
                if estado == 'AGUARDANDO':
                    estado     = 'EM_EXECUCAO'
                    frames_rep = []
                frames_rep.append((intensity, features_raw))

    cap.release()
    print(f'\nTotal: {contador_reps} reps')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Uso: python3 debug_video.py caminho/video.mp4 [frontraise|biceps]')
        sys.exit(1)
    debug_video(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'frontraise')
