"""Diagrama de casos de uso para o artigo (Figura 2).

Mesmo conteúdo do diagrama do projeto (gerar_diagrama_use_cases.py, na raiz do
repositório, que não é alterado), redesenhado numa tela pequena (unidade de dados
= 1 polegada) para que, impresso na largura da coluna (~5,9 pol), as letras
fiquem legíveis. Gera diagrama_use_cases.jpg nesta pasta.
"""
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

LARG, ALT = 8.5, 6.5

fig, ax = plt.subplots(figsize=(LARG, ALT))
ax.set_xlim(0, LARG)
ax.set_ylim(0, ALT)
ax.axis('off')
fig.patch.set_facecolor('#F8F9FA')
ax.set_facecolor('#F8F9FA')

COR_BORDA    = '#2C3E50'
COR_UC_BORDA = '#2980B9'
COR_UC_IA    = '#EAF4FB'
COR_UC_IA_B  = '#1A6FA8'
COR_ACTOR    = '#2C3E50'
COR_GROUP    = '#EBF5FB'
COR_GROUP_B  = '#AED6F1'
COR_ARROW    = '#555555'
COR_INC      = '#2980B9'
COR_EXT      = '#8E44AD'

F_UC, F_GRP, F_REL, F_ACT, F_SYS = 9.5, 9, 8.5, 10, 12

# ── Fronteira do sistema ─────────────────────────────────────────────────────
ax.add_patch(mpatches.FancyBboxPatch(
    (1.0, 0.1), 6.6, 6.25, boxstyle="round,pad=0.03",
    linewidth=2.2, edgecolor=COR_BORDA, facecolor='white', zorder=1))
ax.text(4.3, 6.2, 'Academia App', ha='center', va='center',
        fontsize=F_SYS, fontweight='bold', color=COR_BORDA, zorder=5)


def grupo(x, y, w, h, titulo, fundo=COR_GROUP, borda=COR_GROUP_B):
    ax.add_patch(mpatches.FancyBboxPatch(
        (x, y), w, h, boxstyle="round,pad=0.02", linewidth=1.2, edgecolor=borda,
        facecolor=fundo, linestyle='--', zorder=2, alpha=0.6))
    ax.text(x + w / 2, y + h - 0.08, titulo, ha='center', va='top',
            fontsize=F_GRP, color='#555', style='italic', zorder=5)


grupo(1.1, 4.45, 2.0, 1.5, 'Autenticação')
grupo(1.1, 1.55, 2.0, 2.8, 'Gerenciamento')
grupo(3.2, 0.85, 4.3, 5.1, 'Detector de Exercícios', fundo='#EAF7FB', borda='#7FB3D3')


def ator(cx, cy, nome, cor=COR_ACTOR):
    ax.add_patch(plt.Circle((cx, cy + 0.42), 0.17, color=cor, zorder=6))
    ax.plot([cx, cx], [cy + 0.25, cy - 0.2], color=cor, lw=2, zorder=6)
    ax.plot([cx - 0.25, cx + 0.25], [cy + 0.1, cy + 0.1], color=cor, lw=2, zorder=6)
    ax.plot([cx, cx - 0.2], [cy - 0.2, cy - 0.6], color=cor, lw=2, zorder=6)
    ax.plot([cx, cx + 0.2], [cy - 0.2, cy - 0.6], color=cor, lw=2, zorder=6)
    ax.text(cx, cy - 0.75, nome, ha='center', va='top',
            fontsize=F_ACT, fontweight='bold', color=cor, zorder=6)


ator(0.5, 3.175, 'Usuário')
ator(8.0, 2.85, 'Backend\nIA', cor='#1A6FA8')


def uc(cx, cy, texto, w=1.75, h=0.62, ia=False):
    ax.add_patch(mpatches.Ellipse(
        (cx, cy), w, h, linewidth=1.5,
        edgecolor=COR_UC_IA_B if ia else COR_UC_BORDA,
        facecolor=COR_UC_IA if ia else 'white', zorder=4))
    ax.text(cx, cy, texto, ha='center', va='center', fontsize=F_UC,
            color='#1A1A1A', zorder=5, linespacing=1.1)
    return (cx, cy, w, h)


UCS = {
    'cadastrar':  uc(2.1, 5.4, 'Cadastrar-se', h=0.5),
    'login':      uc(2.1, 4.8, 'Fazer Login', h=0.5),
    'treinos':    uc(2.1, 3.7, 'Gerenciar\nTreinos', h=0.7),
    'sessao':     uc(2.1, 2.85, 'Iniciar Sessão\nde Treino', h=0.7),
    'historico':  uc(2.1, 2.0, 'Ver Histórico\ne Gráficos', h=0.7),
    'selecionar': uc(5.35, 5.35, 'Selecionar\nExercício', w=1.8, h=0.7),
    'frontraise': uc(4.3, 4.45, 'Elevação\nFrontal', w=1.5, h=0.7),
    'biceps':     uc(6.4, 4.45, 'Rosca\nDireta', w=1.5, h=0.7),
    'gravar':     uc(5.35, 3.5, 'Gravar\nVídeo', w=1.5, h=0.7),
    'resultado':  uc(4.0, 2.55, 'Ver Resultado\nda Análise', w=1.6, h=0.7),
    'analisar':   uc(6.4, 2.55, 'Analisar\nExecução (IA)', w=1.9, h=0.7, ia=True),
    'rever':      uc(4.0, 1.5, 'Rever Vídeo\nGravado', w=1.6, h=0.7),
    'flash':      uc(6.4, 1.5, 'Controlar Flash\n/ Câmera', w=1.9, h=0.7),
}


def linha(x1, y1, x2, y2, cor=COR_ARROW, lw=1.1):
    ax.plot([x1, x2], [y1, y2], color=cor, lw=lw, zorder=3)


# Usuário -> casos de uso da coluna esquerda (linhas diretas)
X0, Y0 = 0.75, 3.275
for chave in ['cadastrar', 'login', 'treinos', 'sessao', 'historico']:
    cx, cy, w, _ = UCS[chave]
    linha(X0, Y0, cx - w / 2, cy)

# Usuário -> casos de uso do detector: um eixo (passa pelo vão entre os grupos,
# sem atravessar nenhum caso de uso) com ramais até cada elipse.
BUS = 3.15
linha(X0, Y0, BUS, Y0)
linha(BUS, 1.0, BUS, UCS['selecionar'][1])
for chave in ['selecionar', 'gravar', 'resultado', 'rever']:
    cx, cy, w, _ = UCS[chave]
    linha(BUS, cy, cx - w / 2, cy)
fx, fy, fw, fh = UCS['flash']
linha(BUS, 1.0, fx, 1.0)
linha(fx, 1.0, fx, fy - fh / 2)

# Backend IA -> analisar
cx, cy, w, _ = UCS['analisar']
linha(7.75, 2.95, cx + w / 2, cy, cor=COR_UC_IA_B, lw=1.5)


def rel(p1, p2, tipo, cor=COR_INC, dx=0.0, dy=0.0):
    ax.annotate('', xy=p2, xytext=p1,
                arrowprops=dict(arrowstyle='->', color=cor, lw=1.4,
                                linestyle='dashed', shrinkA=0, shrinkB=0))
    mx, my = (p1[0] + p2[0]) / 2 + dx, (p1[1] + p2[1]) / 2 + dy
    ax.text(mx, my, f'«{tipo}»', ha='center', va='center', fontsize=F_REL,
            color=cor, style='italic', zorder=6,
            bbox=dict(boxstyle='round,pad=0.05', fc='white', ec='none', alpha=0.85))


sel, fr, bi = UCS['selecionar'], UCS['frontraise'], UCS['biceps']
gr, an, re_ = UCS['gravar'], UCS['analisar'], UCS['resultado']
rv = UCS['rever']

rel((sel[0] - 0.55, sel[1] - 0.3), (fr[0] + 0.3, fr[1] + 0.3), 'include', dx=-0.5, dy=0.08)
rel((sel[0] + 0.55, sel[1] - 0.3), (bi[0] - 0.3, bi[1] + 0.3), 'include', dx=0.5, dy=0.08)
rel((gr[0], gr[1] + 0.35), (sel[0], sel[1] - 0.35), 'include', dy=-0.45)
rel((an[0] - 0.4, an[1] + 0.3), (gr[0] + 0.5, gr[1] - 0.3), 'include', dx=0.6)
rel((re_[0] + 0.8, re_[1]), (an[0] - 0.95, an[1]), 'include', dy=0.2)
rel((rv[0], rv[1] + 0.35), (re_[0], re_[1] - 0.35), 'extend', cor=COR_EXT, dx=0.5)

# ── Legenda ─────────────────────────────────────────────────────────────────
lx, ly = 1.2, 1.2
ax.text(lx, ly, 'Legenda:', fontsize=F_GRP, fontweight='bold', color=COR_BORDA, va='center')
for i, (txt, cor) in enumerate([('«include»', COR_INC), ('«extend»', COR_EXT)]):
    y = ly - 0.3 - i * 0.3
    ax.annotate('', xy=(lx + 0.6, y), xytext=(lx, y),
                arrowprops=dict(arrowstyle='->', color=cor, lw=1.4, linestyle='dashed'))
    ax.text(lx + 0.7, y, txt, fontsize=F_REL, va='center', color='#333')

plt.savefig('diagrama_use_cases.jpg', format='jpeg', dpi=220,
            bbox_inches='tight', pad_inches=0.05, facecolor=fig.get_facecolor())
print('diagrama_use_cases.jpg salvo')
plt.close()
