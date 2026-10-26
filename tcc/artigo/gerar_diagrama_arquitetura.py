import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# Canvas em polegadas (unidade de dados = 1 pol). Impresso a 15 cm de largura
# (~5,9 pol), a escala é ~0,8: fonte de 9,5 pt no desenho sai com ~7,5 pt.
LARG, ALT = 7.7, 5.2

fig, ax = plt.subplots(figsize=(LARG, ALT))
ax.set_xlim(0, LARG)
ax.set_ylim(0, ALT)
ax.axis('off')
fig.patch.set_facecolor('#F8F9FA')
ax.set_facecolor('#F8F9FA')

COR_BORDA   = '#2C3E50'
COR_APP_B   = '#2980B9'
COR_BACK    = '#EAF4FB'
COR_BACK_B  = '#1A6FA8'
COR_ML      = '#E8FF47'
COR_ML_B    = '#B8CC00'
COR_DB_B    = '#2980B9'
COR_AZURE   = '#EBF5FB'
COR_AZURE_B = '#7FB3D3'
COR_ARROW   = '#444444'

FONT_TIT = 10.5
FONT_SUB = 9.5
FONT_SEL = 9.0


def box(x, y, w, h, titulo, subtitulo=None, cor_fundo='#FFFFFF', cor_borda=COR_APP_B,
        fonte_tit=FONT_TIT, fonte_sub=FONT_SUB, zorder=4):
    p = mpatches.FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.03",
        linewidth=1.6, edgecolor=cor_borda, facecolor=cor_fundo, zorder=zorder
    )
    ax.add_patch(p)
    if subtitulo:
        n_tit = titulo.count('\n') + 1
        alt_tit = 0.19 * n_tit
        ax.text(x + w / 2, y + h - 0.09, titulo, ha='center', va='top',
                fontsize=fonte_tit, fontweight='bold', color=COR_BORDA,
                zorder=zorder + 1, linespacing=1.15)
        ax.text(x + w / 2, y + (h - alt_tit - 0.09) / 2, subtitulo, ha='center', va='center',
                fontsize=fonte_sub, color='#222', zorder=zorder + 1, linespacing=1.45)
    else:
        ax.text(x + w / 2, y + h / 2, titulo, ha='center', va='center',
                fontsize=fonte_tit, fontweight='bold', color=COR_BORDA,
                zorder=zorder + 1, linespacing=1.15)


def arrow(x1, y1, x2, y2, cor=COR_ARROW):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='-|>', color=cor, lw=1.6,
                                shrinkA=0, shrinkB=0))


def rotulo(x, y, texto, ha='center', va='bottom'):
    ax.text(x, y, texto, ha=ha, va=va, fontsize=FONT_SEL, color='#222',
            zorder=6, linespacing=1.15)


# ── Fronteira Azure ──────────────────────────────────────────────────────────
AZ_X, AZ_Y, AZ_W, AZ_H = 2.55, 0.08, 5.05, 4.97
ax.add_patch(mpatches.FancyBboxPatch(
    (AZ_X, AZ_Y), AZ_W, AZ_H, boxstyle="round,pad=0.03",
    linewidth=1.4, edgecolor=COR_AZURE_B, facecolor=COR_AZURE, linestyle='--',
    zorder=1, alpha=0.8))
ax.text(AZ_X + AZ_W / 2, AZ_Y + AZ_H - 0.1, 'Microsoft Azure', ha='center', va='top',
        fontsize=FONT_TIT, fontweight='bold', color='#1A6FA8', style='italic', zorder=2)

# ── App móvel ────────────────────────────────────────────────────────────────
box(0.08, 1.5, 1.55, 2.05, 'App Móvel',
    'React Native /\nExpo (Android)\n\nHTTP REST (JWT)\n+ WebSocket',
    cor_borda=COR_APP_B)

CX = 2.75 + 2.15 / 2   # eixo vertical da coluna Registry/Backend/Banco

# ── Azure Container Registry ─────────────────────────────────────────────────
box(2.75, 3.95, 2.15, 0.7, 'Azure Container\nRegistry', cor_borda=COR_AZURE_B)

# ── Backend (App Service B1) ─────────────────────────────────────────────────
box(2.75, 1.45, 2.15, 2.15, 'Backend (FastAPI)',
    'Azure App Service B1\n(container, sem GPU)\n\nREST + /ws/detector\nJWT · SQLAlchemy',
    cor_fundo=COR_BACK, cor_borda=COR_BACK_B)

# ── Módulo de ML (mesmo processo do backend) ─────────────────────────────────
box(5.85, 1.45, 1.6, 2.15, 'Módulo de ML',
    '(mesmo processo\ndo backend)\n\nMediaPipe Pose\n+ classificador\npor exercício\n(RF / SVM)',
    cor_fundo=COR_ML, cor_borda=COR_ML_B)

# ── Banco de dados ───────────────────────────────────────────────────────────
box(2.75, 0.22, 2.15, 0.85, 'Azure Database\nfor PostgreSQL',
    'B1ms (SQLite em dev.)', cor_borda=COR_DB_B)

# ── Setas ────────────────────────────────────────────────────────────────────
# App <-> Backend
arrow(1.63, 3.0, 2.75, 3.0)
arrow(2.75, 2.2, 1.63, 2.2)
rotulo(2.09, 3.08, 'HTTP /\nWebSocket')
# Backend <-> ML
arrow(4.9, 3.0, 5.85, 3.0)
arrow(5.85, 2.2, 4.9, 2.2)
rotulo(5.375, 3.08, 'quadros')
rotulo(5.375, 2.12, 'resultado', va='top')
# Registry -> Backend
arrow(CX, 3.95, CX, 3.6, cor='#5B9BC4')
rotulo(CX + 0.1, 3.775, 'build / deploy da imagem', ha='left', va='center')
# Backend -> Banco
arrow(CX, 1.45, CX, 1.07)
rotulo(CX + 0.1, 1.26, 'SQLAlchemy', ha='left', va='center')

plt.savefig('diagrama_arquitetura.jpg', format='jpeg', dpi=220,
            bbox_inches='tight', pad_inches=0.05, facecolor=fig.get_facecolor())
print('diagrama_arquitetura.jpg salvo')
plt.close()
