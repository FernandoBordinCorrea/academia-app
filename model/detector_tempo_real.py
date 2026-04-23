# 5_detector_tempo_real.py
import cv2
import pickle
import numpy as np
import mediapipe as mp

# ── Carregar modelo ───────────────────────────────────────────────────────────
with open("modelo_frontraise.pkl", "rb") as f:
    dados = pickle.load(f)

modelo  = dados["model"]
scaler  = dados["scaler"]
classes = dados["classes"]

THRESHOLD_REPOUSO = 20   # mesmo valor do treino
MIN_FRAMES_REP    = 10   # ignora movimentos muito curtos (ruído)
RESULTADO_FRAMES  = 90   # ~3s a 30fps — tempo de exibição do resultado

# ── Índices MediaPipe Pose ────────────────────────────────────────────────────
MP_OMBRO_E    = 11; MP_OMBRO_D    = 12
MP_COTOVELO_E = 13; MP_COTOVELO_D = 14
MP_PUNHO_E    = 15; MP_PUNHO_D    = 16
MP_QUADRIL_E  = 23; MP_QUADRIL_D  = 24

# ── Funções ───────────────────────────────────────────────────────────────────
def calcular_angulo(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    angulo = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angulo = np.abs(angulo * 180 / np.pi)
    return 360 - angulo if angulo > 180 else angulo

def ponto(lm, idx, w, h):
    return [lm[idx].x * w, lm[idx].y * h]

def classificar_rep(frames_rep):
    """Classifica a repetição usando o frame de pico (ângulo máximo do braço)."""
    peak_features = max(frames_rep, key=lambda x: x[0])[1]
    features = scaler.transform(peak_features) if scaler else peak_features
    pred      = modelo.predict(features)[0]
    prob      = modelo.predict_proba(features)[0]
    confianca = prob[pred] * 100
    label = f"{classes[pred].upper()}  {confianca:.0f}%"
    cor   = (0, 210, 0) if pred == 0 else (0, 0, 220)
    return label, cor

# ── Camera e MediaPipe ────────────────────────────────────────────────────────
CAMERA_INDEX   = 0
LARGURA_JANELA = 1280
ALTURA_JANELA  = 720

mp_pose  = mp.solutions.pose
mp_draw  = mp.solutions.drawing_utils
mp_style = mp.solutions.drawing_styles

cap = None
for idx in range(CAMERA_INDEX, CAMERA_INDEX + 3):
    c = cv2.VideoCapture(idx)
    if c.isOpened():
        cap = c
        print(f"Câmera aberta no índice {idx}")
        break
    c.release()

if cap is None:
    print("ERRO: Nenhuma câmera encontrada. Verifique se o usuário está no grupo 'video'.")
    print("      Execute: sudo usermod -aG video $USER  e faça login novamente.")
    exit(1)

cap.set(cv2.CAP_PROP_FRAME_WIDTH,  LARGURA_JANELA)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, ALTURA_JANELA)

NOME_JANELA = "Detector — Elevacao Frontal  [Q para sair]"
cv2.namedWindow(NOME_JANELA, cv2.WINDOW_NORMAL)
cv2.resizeWindow(NOME_JANELA, LARGURA_JANELA, ALTURA_JANELA)

# ── Estado da máquina ─────────────────────────────────────────────────────────
estado         = "AGUARDANDO"   # AGUARDANDO | EM_EXECUCAO
frames_rep     = []             # (max_angulo, features_raw) por frame
ultimo_label   = ""
ultimo_cor     = (160, 160, 160)
resultado_timer = 0
contador_reps  = 0

with mp_pose.Pose(min_detection_confidence=0.6, min_tracking_confidence=0.6) as pose:
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, (LARGURA_JANELA, ALTURA_JANELA))
        h, w  = frame.shape[:2]
        rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb.flags.writeable = False
        resultado = pose.process(rgb)
        rgb.flags.writeable = True

        label    = ""
        cor      = (160, 160, 160)
        detalhes = ""

        if resultado.pose_landmarks:
            lm = resultado.pose_landmarks.landmark

            mp_draw.draw_landmarks(
                frame, resultado.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                mp_style.get_default_pose_landmarks_style()
            )

            ombro_e    = ponto(lm, MP_OMBRO_E,    w, h)
            cotovelo_e = ponto(lm, MP_COTOVELO_E,  w, h)
            punho_e    = ponto(lm, MP_PUNHO_E,    w, h)
            quadril_e  = ponto(lm, MP_QUADRIL_E,  w, h)
            ombro_d    = ponto(lm, MP_OMBRO_D,    w, h)
            cotovelo_d = ponto(lm, MP_COTOVELO_D,  w, h)
            punho_d    = ponto(lm, MP_PUNHO_D,    w, h)
            quadril_d  = ponto(lm, MP_QUADRIL_D,  w, h)

            ang_braco_e = calcular_angulo(quadril_e, ombro_e, cotovelo_e)
            ang_braco_d = calcular_angulo(quadril_d, ombro_d, cotovelo_d)
            ang_cot_e   = calcular_angulo(ombro_e, cotovelo_e, punho_e)
            ang_cot_d   = calcular_angulo(ombro_d, cotovelo_d, punho_d)
            altura_ref  = abs(ombro_e[1] - quadril_e[1]) or 1

            detalhes = (f"Braco E:{ang_braco_e:.0f}  D:{ang_braco_d:.0f}  "
                        f"Cot E:{ang_cot_e:.0f}  D:{ang_cot_d:.0f}")

            em_repouso = max(ang_braco_e, ang_braco_d) < THRESHOLD_REPOUSO

            if em_repouso:
                # Voltou ao repouso — verifica se veio de uma execução
                if estado == "EM_EXECUCAO":
                    if len(frames_rep) >= MIN_FRAMES_REP:
                        ultimo_label, ultimo_cor = classificar_rep(frames_rep)
                        resultado_timer = RESULTADO_FRAMES
                        contador_reps  += 1
                    frames_rep = []
                estado = "AGUARDANDO"

            else:
                # Braços levantados — coleta o frame
                if estado == "AGUARDANDO":
                    estado     = "EM_EXECUCAO"
                    frames_rep = []

                features_raw = np.array([[
                    ang_braco_e, ang_cot_e,
                    ang_braco_d, ang_cot_d,
                    (punho_e[1] - ombro_e[1]) / altura_ref,
                    (punho_d[1] - ombro_d[1]) / altura_ref,
                    abs(ang_braco_e - ang_braco_d),
                ]])
                frames_rep.append((max(ang_braco_e, ang_braco_d), features_raw))

        # ── Decide o que mostrar ──────────────────────────────────────────────
        if estado == "EM_EXECUCAO":
            label = "Executando..."
            cor   = (30, 200, 230)  # amarelo-ciano: neutro, sem julgamento
        elif resultado_timer > 0:
            label = ultimo_label
            cor   = ultimo_cor
            resultado_timer -= 1
        elif resultado.pose_landmarks:
            label = "Repouso — aguardando movimento"
            cor   = (160, 160, 160)
        else:
            label = "Sem pose detectada"
            cor   = (160, 160, 160)

        # ── Overlay ───────────────────────────────────────────────────────────
        cv2.rectangle(frame, (0, 0), (w, 65), (20, 20, 20), -1)
        cv2.putText(frame, label, (15, 47),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, cor, 3, cv2.LINE_AA)

        # Contador de repetições (canto superior direito)
        rep_txt = f"Reps: {contador_reps}"
        cv2.putText(frame, rep_txt, (w - 160, 47),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (220, 220, 220), 2, cv2.LINE_AA)

        # Ângulos (rodapé)
        if detalhes:
            cv2.rectangle(frame, (0, h - 35), (w, h), (20, 20, 20), -1)
            cv2.putText(frame, detalhes, (10, h - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (220, 220, 220), 1, cv2.LINE_AA)

        cv2.imshow(NOME_JANELA, frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

cap.release()
cv2.destroyAllWindows()
