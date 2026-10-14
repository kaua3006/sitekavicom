"""Tratamento das fotos de produto para o site.

Para cada produto: recorta do fundo, aumenta a resolução quando a foto é pequena,
ajusta nitidez/contraste e enquadra todos no mesmo padrão de estúdio.

Gera duas versões com o mesmo nome:
  assets/img/produtos/<nome>.jpg         fundo branco com sombra suave (site claro)
  assets/img/produtos-preto/<nome>.webp  fundo transparente com reflexo (site preto)

Uso:  python tratar-fotos.py
Para um produto novo, coloque a foto em FOTOS/ e acrescente uma linha em PRODUTOS.
Requer: pip install "rembg[cpu]" opencv-contrib-python-headless pillow
"""
import os
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

LADO = 1200          # tamanho final (quadrado)
OCUPA_L = 0.70       # largura máxima do produto no quadro
OCUPA_A = 0.66       # altura máxima do produto no quadro
BASE = 0.80          # altura (fração) onde fica a base do produto

G = 'ChatGPT Image 16 de set. de 2026, '
# nome de saída: (arquivo em FOTOS, recorte (esq, topo, dir, baixo) ou None)
PRODUTOS = {
    'deslizante-argola-giratoria': (G + '16_09_44.png', (90, 0, 814, 724)),
    'deslizante-gancho':           (G + '16_09_44.png', (757, 0, 1481, 724)),
    'deslizante-roldana':          (G + '16_09_44.png', (1447, 0, 2171, 724)),
    'gancho-cortina':              (G + '16_22_54.png', None),
    'cordao-esferas':              (G + '16_24_22.png', None),
    'fita-franzidora':             (G + '16_25_55.png', None),
    'deslizante-suico-argola':     (G + '16_59_45.png', None),
}
# Banner com a linha completa de deslizantes lado a lado
LINHA = ('linha-deslizantes', ['deslizante-argola-giratoria', 'deslizante-gancho', 'deslizante-roldana'])

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
    out = remove(img_rgb, session=sessao, alpha_matting=True,
                 alpha_matting_foreground_threshold=250,
                 alpha_matting_background_threshold=12,
                 alpha_matting_erode_size=8)
    # limpa resíduos quase transparentes que viram halo no fundo escuro
    a = out.getchannel('A').point(lambda v: 0 if v < 10 else v)
    out.putalpha(a)
    return out.crop(a.getbbox())


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

    tratados = {}
    for nome, (arquivo, caixa) in PRODUTOS.items():
        img = Image.open(FOTOS / arquivo).convert('RGB')
        if caixa:
            img = img.crop(caixa)
        prod = recortar(img, sessao)
        # amplia quando o produto ficaria menor que o quadro final
        if max(prod.width / (LADO * OCUPA_L), prod.height / (LADO * OCUPA_A)) < 1:
            prod = ampliar(prod, sr)
        prod = melhorar(prod)
        tratados[nome] = prod
        salvar(nome, prod)

    # banner: produtos da linha lado a lado, mesma altura
    nome, itens = LINHA
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
