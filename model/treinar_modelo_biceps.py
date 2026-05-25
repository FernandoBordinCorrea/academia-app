# treinar_modelo_biceps.py
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler

ARQUIVO_CSV    = "dataset_biceps.csv"
ARQUIVO_MODELO = "modelo_biceps.pkl"
CLASSES        = ["correto", "incorreto"]
FEATURES       = ["angulo_cotovelo", "angulo_braco", "altura_punho"]

# ── Dados ─────────────────────────────────────────────────────────────────────
df = pd.read_csv(ARQUIVO_CSV)
X  = df[FEATURES].values
y  = df["label"].values

print(f"Dataset: {len(df)} frames")
print(f"  Correto   (0): {sum(y == 0)}")
print(f"  Incorreto (1): {sum(y == 1)}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# ── Modelos e grades ──────────────────────────────────────────────────────────
candidatos = {
    "RandomForest": {
        "modelo": RandomForestClassifier(random_state=42, n_jobs=-1),
        "grade": {
            "n_estimators":     [50, 100, 200, 300],
            "max_depth":        [None, 5, 10, 15],
            "min_samples_leaf": [1, 2, 4],
            "max_features":     ["sqrt", "log2", None],
        },
        "escalar": False,
    },
    "GradientBoosting": {
        "modelo": GradientBoostingClassifier(random_state=42),
        "grade": {
            "n_estimators":  [50, 100, 200],
            "learning_rate": [0.05, 0.1, 0.2],
            "max_depth":     [3, 5, 7],
        },
        "escalar": False,
    },
    "SVM": {
        "modelo": SVC(random_state=42, probability=True),
        "grade": {
            "C":      [0.1, 1, 10, 100],
            "kernel": ["rbf", "linear"],
            "gamma":  ["scale", "auto"],
        },
        "escalar": True,
    },
}

# ── Busca ─────────────────────────────────────────────────────────────────────
resultados = []

for nome, cfg in candidatos.items():
    print(f"\nOtimizando {nome}...")

    if cfg["escalar"]:
        scaler = StandardScaler()
        Xtr    = scaler.fit_transform(X_train)
        Xte    = scaler.transform(X_test)
    else:
        scaler = None
        Xtr, Xte = X_train, X_test

    busca = GridSearchCV(
        cfg["modelo"], cfg["grade"],
        cv=cv, scoring="f1_macro", n_jobs=-1, refit=True
    )
    busca.fit(Xtr, y_train)

    melhor    = busca.best_estimator_
    score_cv  = busca.best_score_
    y_pred    = melhor.predict(Xte)
    acc_teste = (y_pred == y_test).mean()

    print(f"  Melhores params: {busca.best_params_}")
    print(f"  F1 macro CV:  {score_cv:.3f}")
    print(f"  Acurácia teste: {acc_teste:.3f}")

    resultados.append({
        "nome":      nome,
        "modelo":    melhor,
        "scaler":    scaler,
        "score_cv":  score_cv,
        "acc_teste": acc_teste,
        "y_pred":    y_pred,
        "params":    busca.best_params_,
    })

# ── Comparação ────────────────────────────────────────────────────────────────
resultados.sort(key=lambda r: r["score_cv"], reverse=True)

print("\n══ Comparação Final ══════════════════════════════")
print(f"{'Modelo':<20} {'F1 CV':>8} {'Acc Teste':>10}")
print("-" * 42)
for r in resultados:
    print(f"{r['nome']:<20} {r['score_cv']:>8.3f} {r['acc_teste']:>10.3f}")

melhor_resultado = resultados[0]
print(f"\n✓ Melhor modelo: {melhor_resultado['nome']}")
print(f"  Params: {melhor_resultado['params']}")

print("\n── Relatório de Classificação (melhor modelo) ───")
print(classification_report(y_test, melhor_resultado["y_pred"], target_names=CLASSES))

# ── Gráficos ──────────────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

cm = confusion_matrix(y_test, melhor_resultado["y_pred"])
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=CLASSES, yticklabels=CLASSES, ax=axes[0])
axes[0].set_title(f"Matriz de Confusão — {melhor_resultado['nome']}")
axes[0].set_ylabel("Real"); axes[0].set_xlabel("Predito")

nomes  = [r["nome"] for r in resultados]
scores = [r["score_cv"] for r in resultados]
cores  = ["gold" if i == 0 else "steelblue" for i in range(len(resultados))]
axes[1].bar(nomes, scores, color=cores)
axes[1].set_ylim(0, 1)
axes[1].set_title("F1 Macro (Validação Cruzada)")
axes[1].set_ylabel("F1 Score")
for i, v in enumerate(scores):
    axes[1].text(i, v + 0.01, f"{v:.3f}", ha="center", fontweight="bold")

plt.tight_layout()
plt.savefig("resultado_treino_biceps.png")
plt.show()
print("Gráfico salvo em 'resultado_treino_biceps.png'")

# ── Salvar ────────────────────────────────────────────────────────────────────
with open(ARQUIVO_MODELO, "wb") as f:
    pickle.dump({
        "model":    melhor_resultado["modelo"],
        "scaler":   melhor_resultado["scaler"],
        "features": FEATURES,
        "classes":  CLASSES,
    }, f)

print(f"✓ Modelo salvo em '{ARQUIVO_MODELO}'")
