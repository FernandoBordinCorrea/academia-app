import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(13.6, 7))
ax.set_xlim(0, 13.6)
ax.set_ylim(0, 6.6)
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
COR_ARROW   = '#555555'

def box(x, y, w, h, titulo, subtitulo=None, cor_fundo='#FFFFFF', cor_borda=COR_APP_B,
        fontsize=10, sub_fontsize=7.6, zorder=4):
    p = mpatches.FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.06",
        linewidth=1.6, edgecolor=cor_borda, facecolor=cor_fundo, zorder=zorder
    )
    ax.add_patch(p)
    if subtitulo:
        ax.text(x + w / 2, y + h - 0.26, titulo, ha='center', va='top',
                fontsize=fontsize, fontweight='bold', color=COR_BORDA, zorder=zorder + 1)
        ax.text(x + w / 2, y + h / 2 - 0.22, subtitulo, ha='center', va='center',
                fontsize=sub_fontsize, color='#333', zorder=zorder + 1, linespacing=1.7)
    else:
        ax.text(x + w / 2, y + h / 2, titulo, ha='center', va='center',
                fontsize=fontsize, fontweight='bold', color=COR_BORDA, zorder=zorder + 1)
    return (x, y, w, h)

def arrow(x1, y1, x2, y2, texto=None, texto_dy=0.16, cor=COR_ARROW, ls='-'):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='-|>', color=cor, lw=1.4, linestyle=ls))
    if texto:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2 + texto_dy
        ax.text(mx, my, texto, ha='center', va='bottom', fontsize=7.3, color='#333')

# ── Boundary Azure ──────────────────────────────────────────────────────────
box_azure = (5.5, 0.3, 7.7, 5.6)
azure = mpatches.FancyBboxPatch(
    (box_azure[0], box_azure[1]), box_azure[2], box_azure[3], boxstyle="round,pad=0.08",
    linewidth=1.3, edgecolor=COR_AZURE_B, facecolor=COR_AZURE, linestyle='--',
    zorder=1, alpha=0.7
)
ax.add_patch(azure)
ax.text(box_azure[0] + box_azure[2] / 2, box_azure[1] + box_azure[3] - 0.28,
        'Microsoft Azure', ha='center', va='top', fontsize=9.5,
        fontweight='bold', color='#1A6FA8', style='italic', zorder=2)

# ── App Móvel ────────────────────────────────────────────────────────────────
box(0.4, 1.85, 2.9, 2.7, 'App Móvel',
    'React Native / Expo\n(Android)\n\nHTTP REST (JWT)\n+ WebSocket',
    cor_fundo='#FFFFFF', cor_borda=COR_APP_B)

# ── Container Registry ────────────────────────────────────────────────────────
box(5.85, 4.35, 3.0, 1.0, 'Azure Container\nRegistry', cor_fundo='#FFFFFF', cor_borda=COR_AZURE_B,
    fontsize=8.5)

# ── Backend (App Service B1) ─────────────────────────────────────────────────
box(5.85, 1.6, 2.7, 2.55, 'Backend (FastAPI)',
    'Azure App Service B1\n(container, sem GPU)\n\nRotas REST + /ws/detector\nAuth JWT · SQLAlchemy',
    cor_fundo=COR_BACK, cor_borda=COR_BACK_B)

# ── Módulo ML (dentro do processo do backend) ────────────────────────────────
box(9.55, 1.6, 3.0, 2.55, 'Módulo de ML',
    '(no mesmo processo\ndo backend)\n\nMediaPipe Pose\n+ classificador\npor exercício\n(RF / SVM)',
    cor_fundo=COR_ML, cor_borda=COR_ML_B, fontsize=9.5, sub_fontsize=7.2)

# ── Banco de dados ────────────────────────────────────────────────────────────
box(5.85, 0.42, 2.7, 0.95, 'Azure Database for PostgreSQL',
    'camada B1ms (SQLite em dev. local)', cor_fundo='#FFFFFF', cor_borda=COR_DB_B,
    fontsize=8.3, sub_fontsize=7.2)

# ── Setas ──────────────────────────────────────────────────────────────────
arrow(3.3, 3.55, 5.85, 3.35, 'HTTP / WebSocket', texto_dy=0.15)
arrow(5.85, 2.9, 3.3, 3.1, texto=None)
arrow(7.2, 1.6, 7.2, 1.37, 'SQLAlchemy')
arrow(7.2, 4.35, 7.2, 4.15, 'build / deploy da imagem', cor='#7FB3D3')
arrow(8.55, 2.85, 9.55, 2.85, 'quadros', texto_dy=0.15)
arrow(9.55, 2.15, 8.55, 2.15, 'resultado', texto_dy=0.15)

ax.text(6.5, 0.08,
        'Diagrama de componentes — Academia App (arquitetura de implantação)',
        ha='center', va='center', fontsize=8.5, color='#888')

plt.tight_layout(pad=0.3)
plt.savefig('diagrama_arquitetura.jpg', format='jpeg', dpi=150,
            bbox_inches='tight', facecolor=fig.get_facecolor())
print('diagrama_arquitetura.jpg salvo')
plt.close()
