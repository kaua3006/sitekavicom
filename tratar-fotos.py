"""Tratamento das fotos de produto para o site.

Para cada produto: recorta do fundo, aumenta a resolução quando a foto é pequena,
ajusta nitidez/contraste e enquadra todos no mesmo padrão de estúdio.

Gera duas versões com o mesmo nome:
  assets/img/produtos/<nome>.jpg         fundo branco com sombra suave (site claro)
  assets/img/produtos-preto/<nome>.webp  fundo transparente com reflexo (site preto)

Uso:  python tratar-fotos.py                 (todos os produtos)
      python tratar-fotos.py varao-due ...   (só os produtos indicados)
Para um produto novo, coloque a foto em FOTOS/ e acrescente uma linha em PRODUTOS.
Cada produto tratado fica guardado em FOTOS/catalogo/_tratadas/, para montar o banner
sem reprocessar tudo.
Requer: pip install "rembg[cpu]" opencv-contrib-python-headless pillow
"""
import os
import sys
import urllib.request
from pathlib import Path

# cache do numba (usado pelo rembg) fora da pasta protegida do Python
os.environ.setdefault('NUMBA_CACHE_DIR', str(Path.home() / '.cache/kavicom/numba'))
os.makedirs(os.environ['NUMBA_CACHE_DIR'], exist_ok=True)

import cv2
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter
from rembg import new_session, remove

RAIZ = Path(__file__).parent
FOTOS = RAIZ / 'FOTOS'
SAIDA_BRANCO = RAIZ / 'assets/img/produtos'
SAIDA_PRETO = RAIZ / 'assets/img/produtos-preto'
TRATADAS = FOTOS / 'catalogo/_tratadas'

LADO = 1200          # tamanho final (quadrado)
OCUPA_L = 0.70       # largura máxima do produto no quadro
OCUPA_A = 0.66       # altura máxima do produto no quadro
BASE = 0.80          # altura (fração) onde fica a base do produto

# Fotos extraídas dos catálogos em PDF, em FOTOS/catalogo/<nome>.png
# nome de saída: (arquivo em FOTOS, recorte (esq, topo, dir, baixo) ou None)
CATALOGO = [
    'max-redondo', 'deslizante-click-clip', 'deslizante-wave', 'deslizante-terminal',
    'clips-gancho-facil', 'gancho-clips',
    'fita-wave', 'fita-wave-botoes', 'fita-facil',
    'varao-due', 'varao-facile', 'ponteira-suporte',
    'ilhos-piazza', 'ilhos-round', 'argola-massiccio',
    'apanhador-losangular', 'apanhador-oval',
]
PRODUTOS = {nome: (f'catalogo/{nome}.png', None) for nome in CATALOGO}
# Produtos fotografados sobre fundo escuro uniforme: recorte pela diferença de cor
# em relação ao fundo (o recorte automático deixa peças brancas translúcidas)
FUNDO_ESCURO = {
    'varao-due', 'varao-facile', 'ponteira-suporte',
    'ilhos-piazza', 'ilhos-round', 'argola-massiccio',
    'apanhador-losangular', 'apanhador-oval',
}
# Peças brancas fotografadas sobre fundo branco: recorte pelo contraste com o branco
# puro (o recorte automático deixa o tecido translúcido e acinzentado no fundo preto)
FUNDO_CLARO = {'fita-wave-botoes'}
# Banner com a linha completa de deslizantes lado a lado
LINHA = ('linha-deslizantes', ['max-redondo', 'deslizante-click-clip', 'deslizante-wave', 'deslizante-terminal'])

MODELO_SR = Path.home() / '.cache/kavicom/EDSR_x2.pb'
URL_SR = 'https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x2.pb'


def super_resolucao():
    if not MODELO_SR.exists():
        MODELO_SR.parent.mkdir(parents=True, exist_ok=True)
        print('baixando modelo de super-resolução…')
        urllib.request.urlretrieve(URL_SR, MODELO_SR)
    sr = cv2.dnn_superres.DnnSuperResImpl_create()
    sr.readModel(str(MODELO_SR))
    sr.setModel('edsr', 2)
    return sr


def ampliar(img_rgba, sr):
    """Dobra a resolução: EDSR na cor, Lanczos no canal de transparência."""
    rgb = cv2.cvtColor(np.array(img_rgba.convert('RGB')), cv2.COLOR_RGB2BGR)
    rgb2 = cv2.cvtColor(sr.upsample(rgb), cv2.COLOR_BGR2RGB)
    out = Image.fromarray(rgb2)
    alpha = img_rgba.getchannel('A').resize(out.size, Image.LANCZOS)
    out.putalpha(alpha)
    return out


def recortar(img_rgb, sessao):
    try:
        out = remove(img_rgb, session=sessao, alpha_matting=True,
                     alpha_matting_foreground_threshold=250,
                     alpha_matting_background_threshold=12,
                     alpha_matting_erode_size=8)
    except MemoryError:
        # refinamento de borda pesado demais para esta foto; recorte direto
        out = remove(img_rgb, session=sessao)
    # limpa resíduos quase transparentes que viram halo no fundo escuro
    a = out.getchannel('A').point(lambda v: 0 if v < 10 else v)
    out.putalpha(a)
    return out.crop(a.getbbox())


def recortar_fundo_escuro(img_rgb):
    im = np.asarray(img_rgb).astype(np.float32)
    b = 8
    borda = np.concatenate([im[:b].reshape(-1, 3), im[-b:].reshape(-1, 3),
                            im[:, :b].reshape(-1, 3), im[:, -b:].reshape(-1, 3)])
    fundo = np.median(borda, axis=0)
    # fundo local (acompanha degradês): borrão da foto com o produto apagado
    base = im.copy()
    base[np.linalg.norm(im - fundo, axis=2) > 30] = fundo
    fundo_local = np.asarray(Image.fromarray(base.astype(np.uint8)).filter(ImageFilter.GaussianBlur(40))).astype(np.float32)
    dist = np.linalg.norm(im - fundo_local, axis=2)
    a = np.asarray(Image.fromarray((np.clip((dist - 14) / 36, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3))).copy()
    # descarta fragmentos soltos pequenos (restos de texto do catálogo)
    n, rotulos, stats, _ = cv2.connectedComponentsWithStats((a > 30).astype(np.uint8), connectivity=8)
    if n > 1:
        maior = stats[1:, cv2.CC_STAT_AREA].max()
        for i in range(1, n):
            if stats[i, cv2.CC_STAT_AREA] < maior * 0.02:
                a[rotulos == i] = 0
    alpha = Image.fromarray(a)
    out = img_rgb.convert('RGBA')
    out.putalpha(alpha)
    return out.crop(alpha.point(lambda v: 255 if v > 30 else 0).getbbox())


def recortar_fundo_claro(img_rgb, limite=248):
    im = np.asarray(img_rgb).astype(np.float32)
    m = ((im.mean(axis=2) < limite) * 255).astype(np.uint8)
    m[:, :6] = 0  # faixa cinza que às vezes sobra na borda do recorte do PDF
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    n, rotulos, stats, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        maior = stats[1:, cv2.CC_STAT_AREA].max()
        for i in range(1, n):
            if stats[i, cv2.CC_STAT_AREA] < maior * 0.03:
                m[rotulos == i] = 0
    alpha = Image.fromarray(m).filter(ImageFilter.GaussianBlur(0.8))
    # clareia o tecido para ler como branco, preservando a costura e os botões
    rgb = np.clip((im - 40) * (255 / 205), 0, 255)
    rgb = np.where(im.mean(axis=2, keepdims=True) > 150, np.maximum(rgb, im), im)
    out = Image.fromarray(rgb.astype(np.uint8)).convert('RGBA')
    out.putalpha(alpha)
    return out.crop(alpha.point(lambda v: 255 if v > 30 else 0).getbbox())


def melhorar(img_rgba):
    """Nitidez e contraste de foto de estúdio, sem estourar o branco."""
    alpha = img_rgba.getchannel('A')
    rgb = img_rgba.convert('RGB')
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
    rgb = ImageEnhance.Contrast(rgb).enhance(1.10)
    # curva leve: escurece um pouco os meios-tons para dar volume ao plástico branco
    lut = [int(255 * ((i / 255) ** 1.08)) for i in range(256)]
    rgb = rgb.point(lut * 3)
    rgb.putalpha(alpha)
    return rgb


def enquadrar(prod, largura=LADO, altura=LADO):
    escala = min(largura * OCUPA_L / prod.width, altura * OCUPA_A / prod.height)
    p = prod.resize((round(prod.width * escala), round(prod.height * escala)), Image.LANCZOS)
    x = (largura - p.width) // 2
    y = round(altura * BASE) - p.height
    return p, x, y


def versao_preta(p, x, y, largura, altura):
    tela = Image.new('RGBA', (largura, altura), (0, 0, 0, 0))
    # reflexo no "chão": produto espelhado, desaparecendo para baixo
    refl = p.transpose(Image.FLIP_TOP_BOTTOM)
    h = refl.height
    grad = Image.linear_gradient('L').resize((1, h)).point(lambda v: int((255 - v) * 0.22))
    fade = Image.new('L', refl.size)
    fade.paste(grad.resize(refl.size))
    refl.putalpha(ImageChops.multiply(refl.getchannel('A'), fade))
    refl = refl.filter(ImageFilter.GaussianBlur(1.2))
    tela.alpha_composite(refl, (x, y + p.height + 2))
    tela.alpha_composite(p, (x, y))
    return tela


def versao_branca(p, x, y, largura, altura):
    tela = Image.new('RGBA', (largura, altura), (255, 255, 255, 255))
    # sombra de contato: elipse desfocada sob a base do produto
    sombra = Image.new('L', (largura, altura), 0)
    elip = Image.new('L', (int(p.width * 0.9), max(24, int(p.height * 0.07))), 0)
    ImageDraw.Draw(elip).ellipse((0, 0, elip.width - 1, elip.height - 1), fill=70)
    sombra.paste(elip, (x + (p.width - elip.width) // 2, y + p.height - elip.height // 2))
    sombra = sombra.filter(ImageFilter.GaussianBlur(18))
    preto = Image.new('RGBA', (largura, altura), (40, 20, 55, 255))
    preto.putalpha(sombra)
    tela.alpha_composite(preto)
    tela.alpha_composite(p, (x, y))
    return tela.convert('RGB')


def salvar(nome, prod, largura=LADO, altura=LADO):
    p, x, y = enquadrar(prod, largura, altura)
    versao_preta(p, x, y, largura, altura).save(SAIDA_PRETO / f'{nome}.webp', 'WEBP', quality=90, method=6)
    versao_branca(p, x, y, largura, altura).save(SAIDA_BRANCO / f'{nome}.jpg', quality=88, optimize=True, progressive=True)
    print(f'ok  {nome}  ({prod.width}x{prod.height})')


def main():
    SAIDA_BRANCO.mkdir(parents=True, exist_ok=True)
    SAIDA_PRETO.mkdir(parents=True, exist_ok=True)
    sessao = new_session('isnet-general-use')
    sr = super_resolucao()

    TRATADAS.mkdir(parents=True, exist_ok=True)
    escolhidos = sys.argv[1:] or list(PRODUTOS)
    desconhecidos = [n for n in escolhidos if n not in PRODUTOS]
    if desconhecidos:
        sys.exit(f'produto desconhecido: {", ".join(desconhecidos)}')

    for nome in escolhidos:
        arquivo, caixa = PRODUTOS[nome]
        img = Image.open(FOTOS / arquivo).convert('RGB')
        if caixa:
            img = img.crop(caixa)
        if nome in FUNDO_ESCURO:
            prod = recortar_fundo_escuro(img)
        elif nome in FUNDO_CLARO:
            prod = recortar_fundo_claro(img)
        else:
            prod = recortar(img, sessao)
        # amplia quando o produto ficaria menor que o quadro final
        if max(prod.width / (LADO * OCUPA_L), prod.height / (LADO * OCUPA_A)) < 1:
            prod = ampliar(prod, sr)
        prod = melhorar(prod)
        prod.save(TRATADAS / f'{nome}.png')
        salvar(nome, prod)

    # banner: produtos da linha lado a lado, mesma altura
    nome, itens = LINHA
    if not all((TRATADAS / f'{i}.png').exists() for i in itens):
        print(f'banner {nome} não montado: faltam produtos da linha em {TRATADAS}')
        return
    tratados = {i: Image.open(TRATADAS / f'{i}.png') for i in itens}
    alt = max(tratados[i].height for i in itens)
    pecas = [tratados[i].resize((round(tratados[i].width * alt / tratados[i].height), alt), Image.LANCZOS) for i in itens]
    gap = alt // 3
    faixa = Image.new('RGBA', (sum(p.width for p in pecas) + gap * (len(pecas) - 1), alt), (0, 0, 0, 0))
    cx = 0
    for p in pecas:
        faixa.alpha_composite(p, (cx, 0))
        cx += p.width + gap
    salvar(nome, faixa, 1800, 900)


if __name__ == '__main__':
    main()
