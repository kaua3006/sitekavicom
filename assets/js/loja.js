// WhatsApp que recebe os pedidos dos produtos
const WHATSAPP = '5519974239102';

// No tema preto as fotos usam a versão recortada, sem fundo branco
const TEMA_PRETO = document.body.dataset.tema === 'preto';
const foto = src => TEMA_PRETO ? src.replace('/produtos/', '/produtos-preto/').replace(/\.jpg$/, '.webp') : src;

const NOMES_CATEGORIA = {
  todos: 'Todos os produtos',
  deslizantes: 'Deslizantes',
  ganchos: 'Ganchos',
  fitas: 'Fitas',
  varoes: 'Varões',
  ilhoses: 'Ilhoses e Argolas',
  apanhadores: 'Apanhadores'
};

// Referência de cores do catálogo
const CORES_HEX = {
  'Bege': '#efd9b0', 'Marfim': '#f4ecd6', 'Cerejeira': '#d9773c', 'Branco': '#ffffff',
  'Mogno': '#7a1f2b', 'Imbuia': '#6b4026', 'Titânio': '#9b9b9b', 'Rosa Bebê': '#f4a9c6',
  'Azul Bebê': '#86a6ea', 'Ouro Velho': '#9b8150', 'Palha': '#f1d35a', 'Preto': '#141414',
  'Rosa Pink': '#ff3fa4', 'Lilás': '#c58be0', 'Roxo': '#7b3fc4', 'Vermelho': '#e3262b',
  'Verde Pistache': '#88d77b', 'Verde Escuro': '#1f7a3a', 'Amarelo': '#f6c400', 'Laranja': '#f5822a',
  'Azul': '#4f6db0', 'Rosa': '#e88bb0',
  'Transparente': 'transparente', 'Cromado': 'cromado', 'Dourado': 'dourado'
};
const bolinha = nome => {
  const v = CORES_HEX[nome] || '#ccc';
  const estilo = v.startsWith('#') ? ` style="--cor:${v}"` : '';
  const classe = v.startsWith('#') ? '' : ` sw-${v}`;
  return `<i class="sw${classe}"${estilo} title="${nome}"></i>`;
};
const juntar = l => l.length > 1 ? `${l.slice(0, -1).join(', ')} e ${l[l.length - 1]}` : l[0];
const coresHTML = c => `
  <div class="swatches">${[...c.injetado, ...c.metalizado].map(bolinha).join('')}</div>
  <span class="sw-legenda">${c.injetado.length} cores injetadas · Metalizado: ${juntar(c.metalizado)}</span>`;
const coresTexto = c => c ? [...c.injetado, ...c.metalizado].join(' ') : '';

// Ordem das linhas no carrossel
const ORDEM = ['deslizantes', 'ganchos', 'fitas', 'varoes', 'ilhoses', 'apanhadores'];

const slider = document.getElementById('slider');
const track = document.getElementById('track');
const empty = document.getElementById('empty');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('#filters button');

let categoriaAtual = 'todos';
let busca = '';
let lista = [];

const normalizar = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const num = n => String(n).padStart(4, '0');

const linkWhatsApp = nome =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá, Kavicom! Tenho interesse no produto: ${nome}.`)}`;

// ─── Carrossel com movimento suave (inspirado no smooothy) ───
const car = {
  atual: 0,        // posição renderizada (px)
  alvo: 0,         // posição desejada (px)
  largura: 1,      // largura de um slide (px)
  infinito: true,
  arrastando: false,
  moveu: false,
  inicioX: 0, inicioAlvo: 0, ultimoX: 0, ultimoT: 0, velocidade: 0,
  ativo: -1,
  slides: []
};
const SUAVIDADE = matchMedia('(prefers-reduced-motion: reduce)').matches ? 40 : 7;

function medir() {
  const s = car.slides[0];
  car.largura = s ? s.offsetWidth : 1;
  // com poucos produtos o loop infinito mostraria repetidos lado a lado
  car.infinito = car.slides.length * car.largura > slider.offsetWidth * 1.6;
  slider.classList.toggle('is-finito', !car.infinito);
}

function limitar(v) {
  if (car.infinito) return v;
  return Math.min(Math.max(v, 0), (car.slides.length - 1) * car.largura);
}
// a animação só roda enquanto o carrossel se move; parado, não gasta processador
let rodando = false;
function acordar() {
  if (rodando) return;
  rodando = true;
  quadro.t = 0;
  requestAnimationFrame(quadro);
}
const encaixar = () => { car.alvo = limitar(Math.round(car.alvo / car.largura) * car.largura); acordar(); };
function passo(d) { car.alvo = limitar((Math.round(car.alvo / car.largura) + d) * car.largura); acordar(); }

function quadro(t) {
  const dt = quadro.t ? Math.min((t - quadro.t) / 1000, 0.05) : 1 / 60;
  quadro.t = t;
  car.atual += (car.alvo - car.atual) * (1 - Math.exp(-SUAVIDADE * dt));
  if (Math.abs(car.alvo - car.atual) < 0.05) car.atual = car.alvo;

  const n = car.slides.length;
  const W = car.largura;
  const total = n * W;
  const centro = slider.offsetWidth / 2 - W / 2;
  car.slides.forEach((el, i) => {
    let x = i * W - car.atual;
    if (car.infinito) x = ((x % total) + total * 1.5) % total - total / 2;
    const d = x / W; // distância em slides até o centro
    el.style.transform = `translate3d(${(centro + x).toFixed(2)}px,0,0)`;
    el.style.setProperty('--d', d.toFixed(3));
    el.style.setProperty('--perto', Math.max(0, 1 - Math.abs(d)).toFixed(3));
  });

  if (n) {
    const ativo = ((Math.round(car.atual / W) % n) + n) % n;
    if (ativo !== car.ativo) atualizarAtivo(ativo);
    const pos = car.infinito ? ((((car.atual / W) % n) + n) % n) : car.atual / W;
    const prog = Math.min(Math.max(pos / Math.max(n - 1, 1), 0), 1);
    document.getElementById('progress').style.transform = `scaleX(${prog.toFixed(3)})`;
  }
  if (car.atual === car.alvo && !car.arrastando) { rodando = false; return; }
  requestAnimationFrame(quadro);
}

function atualizarAtivo(i) {
  car.ativo = i;
  car.slides.forEach((el, j) => el.classList.toggle('is-ativo', j === i));
  const p = lista[i];
  document.getElementById('countAtual').textContent = num(i + 1);
  document.getElementById('ativoCat').textContent = `${NOMES_CATEGORIA[p.categoria]} · ${p.tag}`;
  document.getElementById('ativoNome').textContent = p.nome;
  document.getElementById('ativoDesc').textContent = p.descricao;
  document.getElementById('ativoComprar').href = linkWhatsApp(p.nome);
}

// Arrastar com mouse ou dedo
slider.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  car.arrastando = true;
  car.moveu = false;
  car.inicioX = car.ultimoX = e.clientX;
  car.ultimoT = performance.now();
  car.inicioAlvo = car.alvo;
  car.velocidade = 0;
  acordar();
});
window.addEventListener('pointermove', e => {
  if (!car.arrastando) return;
  const dx = e.clientX - car.inicioX;
  if (Math.abs(dx) > 6 && !car.moveu) {
    car.moveu = true;
    slider.classList.add('is-arrastando');
  }
  const agora = performance.now();
  car.velocidade = (e.clientX - car.ultimoX) / Math.max(agora - car.ultimoT, 1);
  car.ultimoX = e.clientX;
  car.ultimoT = agora;
  car.alvo = car.inicioAlvo - dx * 1.2;
  if (!car.infinito) {
    // resistência elástica nas pontas
    const max = (car.slides.length - 1) * car.largura;
    if (car.alvo < 0) car.alvo *= 0.35;
    if (car.alvo > max) car.alvo = max + (car.alvo - max) * 0.35;
  }
});
window.addEventListener('pointerup', () => {
  if (!car.arrastando) return;
  car.arrastando = false;
  slider.classList.remove('is-arrastando');
  car.alvo -= car.velocidade * 260; // inércia
  encaixar();
});
// um arraste não conta como clique no produto
slider.addEventListener('click', e => {
  if (car.moveu) { e.stopPropagation(); e.preventDefault(); car.moveu = false; }
}, true);
slider.addEventListener('dragstart', e => e.preventDefault());

// Touchpad (ou roda do mouse com Shift)
let fimRoda;
slider.addEventListener('wheel', e => {
  const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
  if (!dx) return;
  e.preventDefault();
  car.alvo = limitar(car.alvo + dx * 1.1);
  acordar();
  clearTimeout(fimRoda);
  fimRoda = setTimeout(encaixar, 140);
}, { passive: false });

slider.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { passo(1); e.preventDefault(); }
  if (e.key === 'ArrowLeft') { passo(-1); e.preventDefault(); }
});
document.getElementById('slidePrev').addEventListener('click', () => passo(-1));
document.getElementById('slideNext').addEventListener('click', () => passo(1));

// clicar num produto de lado traz ele para o centro; no do centro abre os detalhes
track.addEventListener('click', e => {
  const el = e.target.closest('.peca');
  if (!el) return;
  const i = +el.dataset.i;
  if (i === car.ativo) {
    abrirDetalhe(lista[i]);
    return;
  }
  const n = car.slides.length;
  let d = i - car.ativo;
  if (car.infinito && Math.abs(d) > n / 2) d -= Math.sign(d) * n;
  passo(d);
});
document.getElementById('ativoDetalhes').addEventListener('click', () => abrirDetalhe(lista[car.ativo]));

window.addEventListener('resize', () => {
  const i = Math.max(car.ativo, 0);
  medir();
  car.atual = car.alvo = limitar(i * car.largura);
  acordar();
});

function render() {
  const termo = normalizar(busca.trim());
  lista = PRODUTOS
    .filter(p => termo
      ? normalizar(`${p.nome} ${p.tag} ${p.descricao} ${NOMES_CATEGORIA[p.categoria]} ${p.medidas} ${coresTexto(p.cores)}`).includes(termo)
      : categoriaAtual === 'todos' || p.categoria === categoriaAtual)
    .sort((a, b) => ORDEM.indexOf(a.categoria) - ORDEM.indexOf(b.categoria));

  const vazio = lista.length === 0;
  empty.hidden = !vazio;
  slider.hidden = vazio;
  document.getElementById('sliderBar').hidden = vazio;
  document.getElementById('ativo').hidden = vazio;

  track.innerHTML = lista.map((p, i) => `
    <li class="peca" data-i="${i}">
      <div class="peca-topo"><span>${num(i + 1)}</span><span>${NOMES_CATEGORIA[p.categoria]}</span></div>
      <div class="peca-midia">
        ${p.selo ? `<span class="card-seal">${p.selo}</span>` : ''}
        <img src="${foto(p.imagem)}" alt="${p.nome}" draggable="false">
      </div>
      <div class="peca-base"><h3>"${p.nome}"</h3><span>${p.tag}</span></div>
    </li>`).join('');
  car.slides = [...track.children];
  document.getElementById('countTotal').textContent = num(lista.length);
  medir();
  car.atual = car.alvo = 0;
  car.ativo = -1;
  acordar();
}

function setCategoria(cat) {
  categoriaAtual = cat;
  filterButtons.forEach(b => b.classList.toggle('is-active', b.dataset.cat === cat));
  render();
}

filterButtons.forEach(b => b.addEventListener('click', () => setCategoria(b.dataset.cat)));

// Links de categoria espalhados pela página (menu, banner, rodapé)
document.querySelectorAll('[data-cat], [data-cat-link]').forEach(el => {
  if (el.closest('#filters')) return;
  el.addEventListener('click', () => {
    busca = '';
    searchInput.value = '';
    setCategoria(el.dataset.catLink || el.dataset.cat);
    closeMenu();
  });
});

// Busca
document.getElementById('search').addEventListener('submit', e => {
  e.preventDefault();
  busca = searchInput.value;
  setCategoria('todos');
  document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' });
});
searchInput.addEventListener('input', () => {
  busca = searchInput.value;
  render();
});
document.getElementById('clearSearch').addEventListener('click', () => {
  busca = '';
  searchInput.value = '';
  setCategoria('todos');
});

// Detalhes do produto
const detalhe = document.getElementById('detalhe');
function abrirDetalhe(p) {
  detalhe.querySelector('.detalhe-img').src = foto(p.imagem);
  detalhe.querySelector('.detalhe-img').alt = p.nome;
  detalhe.querySelector('.detalhe-cat').textContent = `${NOMES_CATEGORIA[p.categoria]} · ${p.tag}`;
  detalhe.querySelector('.detalhe-nome').textContent = p.nome;
  detalhe.querySelector('.detalhe-desc').textContent = p.descricao;
  detalhe.querySelector('.detalhe-specs').innerHTML =
    (p.medidas ? `<div><dt>Medidas</dt><dd>${p.medidas}</dd></div>` : '') +
    (p.cores ? `<div><dt>Cores</dt><dd>${coresHTML(p.cores)}</dd></div>` : '');
  detalhe.querySelector('.detalhe-cta').href = linkWhatsApp(p.nome);
  detalhe.showModal();
}
detalhe.querySelector('.detalhe-fechar').addEventListener('click', () => detalhe.close());
detalhe.addEventListener('click', e => { if (e.target === detalhe) detalhe.close(); });

render();

// Banner rotativo
const slides = [...document.querySelectorAll('.banner .slide')];
const dots = document.getElementById('dots');
let atual = 0;
let timer;
slides.forEach((_, i) => {
  const d = document.createElement('button');
  d.setAttribute('aria-label', `Banner ${i + 1}`);
  d.addEventListener('click', () => { goTo(i); restart(); });
  dots.appendChild(d);
});
function goTo(i) {
  atual = (i + slides.length) % slides.length;
  slides.forEach((s, j) => s.classList.toggle('is-active', j === atual));
  [...dots.children].forEach((d, j) => d.classList.toggle('is-active', j === atual));
}
function restart() {
  clearInterval(timer);
  timer = setInterval(() => goTo(atual + 1), 6000);
}
document.getElementById('prev').addEventListener('click', () => { goTo(atual - 1); restart(); });
document.getElementById('next').addEventListener('click', () => { goTo(atual + 1); restart(); });
goTo(0);
restart();

// Menu mobile
const toggle = document.getElementById('menuToggle');
const catbar = document.getElementById('catbar');
function closeMenu() {
  catbar.classList.remove('open');
  toggle.setAttribute('aria-expanded', false);
}
toggle.addEventListener('click', () => {
  const open = catbar.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});

// Sombra no cabeçalho ao rolar
const header = document.getElementById('header');
window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 40), { passive: true });

document.getElementById('ano').textContent = new Date().getFullYear();
