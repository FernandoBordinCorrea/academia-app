# 1_explorar_dados.py
import os
import numpy as np
import matplotlib.pyplot as plt

PASTA_GOOD = "poses/frontraise/good"
PASTA_BAD  = "poses/frontraise/bad"

THRESHOLD_REPOUSO = 20  # mesmo filtro do gerar_dataset.py

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
    # kp shape: (18, 3) — cada linha é [x, y, confiança]
    return kp[i, :2]

def extrair_angulos_pasta(pasta):
    angulos_braco, angulos_cotovelo, simetrias = [], [], []

    for arquivo in sorted(os.listdir(pasta)):
        if not arquivo.endswith(".npy"):
            continue
        data = np.load(os.path.join(pasta, arquivo))  # (n_frames, 18, 3)

        for kp in data:
            confiancas = [kp[OMBRO_E, 2], kp[COTOVELO_E, 2],
                          kp[OMBRO_D, 2], kp[COTOVELO_D, 2]]
            if any(c < 0.1 for c in confiancas):
                continue

            ombro_e    = extrair_ponto(kp, OMBRO_E)
            cotovelo_e = extrair_ponto(kp, COTOVELO_E)
            punho_e    = extrair_ponto(kp, PUNHO_E)
            quadril_e  = extrair_ponto(kp, QUADRIL_E)
            ombro_d    = extrair_ponto(kp, OMBRO_D)
            cotovelo_d = extrair_ponto(kp, COTOVELO_D)
            quadril_d  = extrair_ponto(kp, QUADRIL_D)

            ang_braco_e = calcular_angulo(quadril_e, ombro_e, cotovelo_e)
            ang_braco_d = calcular_angulo(quadril_d, ombro_d, cotovelo_d)
            ang_cot_e   = calcular_angulo(ombro_e, cotovelo_e, punho_e)

            # Descarta frames de repouso (mesmo filtro do gerar_dataset.py)
            if max(ang_braco_e, ang_braco_d) < THRESHOLD_REPOUSO:
                continue

            angulos_braco.append(ang_braco_e)
            angulos_cotovelo.append(ang_cot_e)
            simetrias.append(abs(ang_braco_e - ang_braco_d))

    return angulos_braco, angulos_cotovelo, simetrias

print("Analisando dados GOOD...")
good_braco, good_cotovelo, good_simetria = extrair_angulos_pasta(PASTA_GOOD)

print("Analisando dados BAD...")
bad_braco, bad_cotovelo, bad_simetria = extrair_angulos_pasta(PASTA_BAD)

# ── Estatísticas ─────────────────────────────────────────────────────────────
print("\n── GOOD ────────────────────────────────────────")
print(f"Ângulo braço:    min={min(good_braco):.1f} | max={max(good_braco):.1f} | média={np.mean(good_braco):.1f}")
print(f"Ângulo cotovelo: min={min(good_cotovelo):.1f} | max={max(good_cotovelo):.1f} | média={np.mean(good_cotovelo):.1f}")
print(f"Simetria:        min={min(good_simetria):.1f} | max={max(good_simetria):.1f} | média={np.mean(good_simetria):.1f}")

print("\n── BAD ─────────────────────────────────────────")
print(f"Ângulo braço:    min={min(bad_braco):.1f} | max={max(bad_braco):.1f} | média={np.mean(bad_braco):.1f}")
print(f"Ângulo cotovelo: min={min(bad_cotovelo):.1f} | max={max(bad_cotovelo):.1f} | média={np.mean(bad_cotovelo):.1f}")
print(f"Simetria:        min={min(bad_simetria):.1f} | max={max(bad_simetria):.1f} | média={np.mean(bad_simetria):.1f}")

# ── Gráficos comparativos ────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(15, 4))

axes[0].hist(good_braco, bins=30, alpha=0.6, label="GOOD", color="green")
axes[0].hist(bad_braco,  bins=30, alpha=0.6, label="BAD",  color="red")
axes[0].set_title("Ângulo do Braço")
axes[0].legend()

axes[1].hist(good_cotovelo, bins=30, alpha=0.6, label="GOOD", color="green")
axes[1].hist(bad_cotovelo,  bins=30, alpha=0.6, label="BAD",  color="red")
axes[1].set_title("Ângulo do Cotovelo")
axes[1].legend()

axes[2].hist(good_simetria, bins=30, alpha=0.6, label="GOOD", color="green")
axes[2].hist(bad_simetria,  bins=30, alpha=0.6, label="BAD",  color="red")
axes[2].set_title("Assimetria entre os braços")
axes[2].legend()

plt.tight_layout()
plt.savefig("exploracao_angulos.png")
plt.show()
print("\nGráfico salvo em 'exploracao_angulos.png'")