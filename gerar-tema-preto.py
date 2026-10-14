"""Gera as páginas de teste do tema preto a partir das páginas principais.

Rode depois de alterar index.html ou sobre.html:
    python gerar-tema-preto.py
"""
import re
from pathlib import Path

RAIZ = Path(__file__).parent
PAGINAS = {'index.html': 'preto.html', 'sobre.html': 'sobre-preto.html'}

for origem, destino in PAGINAS.items():
    html = (RAIZ / origem).read_text(encoding='utf-8')

    # Links internos apontam para as versões pretas
    html = html.replace('sobre.html', 'sobre-preto.html').replace('index.html', 'preto.html')

    # CSS do tema preto depois do CSS principal; teste fora do Google
    html = re.sub(
        r'(<link rel="stylesheet" href="assets/css/[a-z]+\.css">)',
        r'\1\n  <link rel="stylesheet" href="assets/css/tema-preto.css">\n  <meta name="robots" content="noindex">',
        html, count=1)

    # Marca o tema e troca as fotos de produto pelas recortadas (fundo transparente)
    html = html.replace('<body>', '<body data-tema="preto">', 1)
    html = re.sub(r'assets/img/produtos/([a-z-]+)\.jpg', r'assets/img/produtos-preto/\1.webp', html)

    (RAIZ / destino).write_text(html, encoding='utf-8')
    print(f'{origem} -> {destino}')
