# 2_gerar_dataset.py
import csv
import os
import numpy as np

THRESHOLD_REPOUSO = 20   # descarta frames onde nenhum braço passou de 20° (posição de repouso)

PASTA_GOOD  = "poses/frontraise/good"
PASTA_BAD   = "poses/frontraise/bad"
ARQUIVO_CSV = "dataset_frontraise.csv"

# Índices OpenPose BODY_18
OMBRO_D=2; COTOVELO_D=3; PUNHO_D=4
OMBRO_E=5; COTOVELO_E=6; PUNHO_E=7
QUADRIL_D=8; QUADRIL_E=11

def calcular_angulo(a, b, c):
    a, b, c = np.array(a), np.array(b), np.array(c)
    angulo = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angulo = np.abs(angulo * 180 / np.pi)
    return 360 - angulo if angulo > 180 else angulo

def extrair_ponto(kp, i):
    return kp[i, :2]

def processar_pasta(pasta, label, writer):
    salvos = 0
    repouso = 0
    baixa_confianca = 0

    for arquivo in sorted(os.listdir(pasta)):
        if not arquivo.endswith(".npy"):
            continue
        data = np.load(os.path.join(pasta, arquivo))  # (n_frames, 18, 3)

        for kp in data:
            confiancas = [kp[OMBRO_E, 2], kp[COTOVELO_E, 2],
                          kp[OMBRO_D, 2], kp[COTOVELO_D, 2]]
            if any(c < 0.1 for c in confiancas):
                baixa_confianca += 1
                continue

            ombro_e    = extrair_ponto(kp, OMBRO_E)
            cotovelo_e = extrair_ponto(kp, COTOVELO_E)
            punho_e    = extrair_ponto(kp, PUNHO_E)
            quadril_e  = extrair_ponto(kp, QUADRIL_E)
            ombro_d    = extrair_ponto(kp, OMBRO_D)
            cotovelo_d = extrair_ponto(kp, COTOVELO_D)
            punho_d    = extrair_ponto(kp, PUNHO_D)
            quadril_d  = extrair_ponto(kp, QUADRIL_D)

            ang_braco_e = calcular_angulo(quadril_e, ombro_e, cotovelo_e)
            ang_braco_d = calcular_angulo(quadril_d, ombro_d, cotovelo_d)
            ang_cot_e   = calcular_angulo(ombro_e, cotovelo_e, punho_e)
            ang_cot_d   = calcular_angulo(ombro_d, cotovelo_d, punho_d)
            altura_ref  = abs(ombro_e[1] - quadril_e[1]) or 1

            if max(ang_braco_e, ang_braco_d) < THRESHOLD_REPOUSO:
                repouso += 1
                continue

            writer.writerow([
                ang_braco_e, ang_cot_e,
                ang_braco_d, ang_cot_d,
                (punho_e[1] - ombro_e[1]) / altura_ref,
                (punho_d[1] - ombro_d[1]) / altura_ref,
                abs(ang_braco_e - ang_braco_d),
                label
            ])
            salvos += 1

    return salvos, repouso, baixa_confianca

with open(ARQUIVO_CSV, "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow([
        "angulo_braco_esq", "angulo_cotovelo_esq",
        "angulo_braco_dir", "angulo_cotovelo_dir",
        "altura_punho_esq", "altura_punho_dir",
        "simetria_braco",   "label"
    ])

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
    ratio = salvos_good / salvos_bad
    print(f"✓ Proporção GOOD/BAD: {ratio:.1f}x")
