# gerar_dataset_biceps.py
#
# Os vídeos são filmados de lado (câmera a um dos lados), então apenas um braço
# é visível em cada arquivo. Por isso as features usam o lado visível
# (o que tiver maior confiança média em OMBRO + COTOVELO).
import csv
import os
import numpy as np

# Frames onde o cotovelo já está quase estendido (repouso entre reps)
THRESHOLD_REPOUSO = 155
CONF_MIN          = 0.1

PASTA_GOOD  = "poses/biceps/good"
PASTA_BAD   = "poses/biceps/bad"
ARQUIVO_CSV = "dataset_biceps.csv"

# Índices OpenPose BODY_18
OMBRO_D=2;  COTOVELO_D=3;  PUNHO_D=4
OMBRO_E=5;  COTOVELO_E=6;  PUNHO_E=7
QUADRIL_D=8; QUADRIL_E=11

def calcular_angulo(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    angulo = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angulo = np.abs(angulo * 180 / np.pi)
    return 360 - angulo if angulo > 180 else angulo

def pt(kp, i):
    return kp[i, :2]

def lado_visivel(data):
    """Retorna 'D' ou 'E' baseado na confiança média de OMBRO+COTOVELO."""
    conf_d = data[:, [OMBRO_D, COTOVELO_D], 2].mean()
    conf_e = data[:, [OMBRO_E, COTOVELO_E], 2].mean()
    return 'D' if conf_d >= conf_e else 'E'

def extrair(kp, lado):
    if lado == 'D':
        ombro   = pt(kp, OMBRO_D);   cotovelo = pt(kp, COTOVELO_D)
        punho   = pt(kp, PUNHO_D);   quadril  = pt(kp, QUADRIL_D)
        conf_ok = kp[OMBRO_D, 2] >= CONF_MIN and kp[COTOVELO_D, 2] >= CONF_MIN
    else:
        ombro   = pt(kp, OMBRO_E);   cotovelo = pt(kp, COTOVELO_E)
        punho   = pt(kp, PUNHO_E);   quadril  = pt(kp, QUADRIL_E)
        conf_ok = kp[OMBRO_E, 2] >= CONF_MIN and kp[COTOVELO_E, 2] >= CONF_MIN

    if not conf_ok:
        return None

    ang_cot   = calcular_angulo(ombro, cotovelo, punho)
    ang_braco = calcular_angulo(quadril, ombro, cotovelo)
    altura_ref = abs(ombro[1] - quadril[1]) or 1
    alt_punho  = (punho[1] - ombro[1]) / altura_ref

    return ang_cot, ang_braco, alt_punho

def processar_pasta(pasta, label, writer):
    salvos = 0
    repouso = 0
    baixa_confianca = 0

    for arquivo in sorted(os.listdir(pasta)):
        if not arquivo.endswith(".npy"):
            continue
        data = np.load(os.path.join(pasta, arquivo))  # (n_frames, 18, 3)
        lado = lado_visivel(data)

        for kp in data:
            feats = extrair(kp, lado)
            if feats is None:
                baixa_confianca += 1
                continue

            ang_cot, ang_braco, alt_punho = feats

            if ang_cot > THRESHOLD_REPOUSO:
                repouso += 1
                continue

            writer.writerow([ang_cot, ang_braco, alt_punho, label])
            salvos += 1

    return salvos, repouso, baixa_confianca

with open(ARQUIVO_CSV, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["angulo_cotovelo", "angulo_braco", "altura_punho", "label"])

    print("Processando GOOD → label 0...")
    salvos_good, rep_good, conf_good = processar_pasta(PASTA_GOOD, label=0, writer=writer)
    print(f"  {salvos_good} frames salvos | {rep_good} repouso descartados | {conf_good} baixa confiança")

    print("Processando BAD → label 1...")
    salvos_bad, rep_bad, conf_bad = processar_pasta(PASTA_BAD, label=1, writer=writer)
    print(f"  {salvos_bad} frames salvos | {rep_bad} repouso descartados | {conf_bad} baixa confiança")

total = salvos_good + salvos_bad
print(f"\n✓ Dataset salvo em '{ARQUIVO_CSV}'")
print(f"✓ Total: {total} frames  (GOOD={salvos_good} | BAD={salvos_bad})")
if salvos_good and salvos_bad:
    print(f"✓ Proporção GOOD/BAD: {salvos_good/salvos_bad:.1f}x")
