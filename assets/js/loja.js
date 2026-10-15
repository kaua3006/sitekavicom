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

const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const title = document.getElementById('shopTitle');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('#filters button');

let categoriaAtual = 'todos';
let busca = '';

const normalizar = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const linkWhatsApp = nome =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá, Kavicom! Tenho interesse no produto: ${nome}.`)}`;

function render() {
  const termo = normalizar(busca.trim());
  const lista = PRODUTOS.filter(p =>
    (categoriaAtual === 'todos' || p.categoria === categoriaAtual) &&
    (!termo || normalizar(`${p.nome} ${p.tag} ${p.descricao} ${NOMES_CATEGORIA[p.categoria]} ${p.medidas} ${coresTexto(p.cores)}`).includes(termo))
  );

  title.textContent = termo ? `Resultados para "${busca.trim()}"` : NOMES_CATEGORIA[categoriaAtual];
  empty.hidden = lista.length > 0;

  grid.innerHTML = lista.map(p => `
    <article class="card">
      <div class="card-img">
        ${p.selo ? `<span class="card-seal">${p.selo}</span>` : ''}
        <img src="${foto(p.imagem)}" alt="${p.nome}" loading="lazy">
      </div>
      <div class="card-body">
        <span class="card-cat">${p.tag || NOMES_CATEGORIA[p.categoria]}</span>
        <h3>${p.nome}</h3>
        <p>${p.descricao}</p>
        ${p.medidas || p.cores ? `<dl class="card-specs">
          ${p.medidas ? `<div><dt>Medidas</dt><dd>${p.medidas}</dd></div>` : ''}
          ${p.cores ? `<div><dt>Cores</dt><dd>${coresHTML(p.cores)}</dd></div>` : ''}
        </dl>` : ''}
        <a href="${linkWhatsApp(p.nome)}" target="_blank" rel="noopener" class="btn btn-solid btn-full">Comprar pelo WhatsApp</a>
      </div>
    </article>`).join('');
}

function setCategoria(cat) {
  categoriaAtual = cat;
  filterButtons.forEach(b => b.classList.toggle('is-active', b.dataset.cat === cat));
  render();
}

filterButtons.forEach(b => b.addEventListener('click', () => setCategoria(b.dataset.cat)));

// Links de categoria espalhados pela página (menu, mosaico, círculos, rodapé)
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

render();

// Banner rotativo
const slides = [...document.querySelectorAll('.slide')];
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
