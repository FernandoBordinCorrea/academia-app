# 3_treinar_modelo.py
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix

ARQUIVO_CSV    = "dataset_frontraise.csv"
ARQUIVO_MODELO = "modelo_frontraise.pkl"

FEATURES = [
    "angulo_braco_esq", "angulo_cotovelo_esq",
    "angulo_braco_dir", "angulo_cotovelo_dir",
    "altura_punho_esq", "altura_punho_dir",
    "simetria_braco"
]
CLASSES = ["correto", "incorreto"]

# ── Carregar dados ────────────────────────────────────────────────────────────
df = pd.read_csv(ARQUIVO_CSV)
X  = df[FEATURES].values
y  = df["label"].values

print(f"Dataset: {len(df)} frames")
print(f"  Correto   (0): {sum(y == 0)}")
print(f"  Incorreto (1): {sum(y == 1)}")

# ── Treino / Teste ────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── Treinar ───────────────────────────────────────────────────────────────────
modelo = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
modelo.fit(X_train, y_train)

# ── Avaliação no conjunto de teste ────────────────────────────────────────────
y_pred = modelo.predict(X_test)

print("\n── Relatório de Classificação ───────────────────")
print(classification_report(y_test, y_pred, target_names=CLASSES))

# ── Validação cruzada (visão mais robusta com dataset pequeno) ────────────────
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(modelo, X, y, cv=cv, scoring="accuracy")
print("── Validação Cruzada (5-fold) ───────────────────")
print(f"  Acurácia por fold: {[f'{s:.2f}' for s in scores]}")
print(f"  Média: {scores.mean():.2f} ± {scores.std():.2f}")

# ── Importância das features ──────────────────────────────────────────────────
importancias = modelo.feature_importances_
ordem = np.argsort(importancias)[::-1]
print("\n── Importância das Features ─────────────────────")
for i in ordem:
    print(f"  {FEATURES[i]:<25} {importancias[i]:.3f}")

# ── Gráficos ──────────────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Matriz de confusão
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=CLASSES, yticklabels=CLASSES, ax=axes[0])
axes[0].set_title("Matriz de Confusão")
axes[0].set_ylabel("Real")
axes[0].set_xlabel("Predito")

# Importância das features
nomes_ord = [FEATURES[i] for i in ordem]
vals_ord  = importancias[ordem]
axes[1].barh(nomes_ord[::-1], vals_ord[::-1], color="steelblue")
axes[1].set_title("Importância das Features")
axes[1].set_xlabel("Importância")

plt.tight_layout()
plt.savefig("resultado_treino.png")
plt.show()
print("\nGráfico salvo em 'resultado_treino.png'")

# ── Salvar modelo ─────────────────────────────────────────────────────────────
with open(ARQUIVO_MODELO, "wb") as f:
    pickle.dump({
        "model":    modelo,
        "features": FEATURES,
        "classes":  CLASSES,
    }, f)

print(f"✓ Modelo salvo em '{ARQUIVO_MODELO}'")
