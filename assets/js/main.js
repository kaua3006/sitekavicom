// WhatsApp comercial que recebe os pedidos de orçamento
const WHATSAPP = '5519974239102';

// Sombra no menu ao rolar
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Menu mobile
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');
toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  links.classList.remove('open');
  toggle.setAttribute('aria-expanded', false);
}));

// Contagem dos números
const countUp = el => {
  const to = +el.dataset.to;
  const dur = 1400;
  const t0 = performance.now();
  const tick = now => {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

// Revelar elementos ao rolar (com escalonamento entre irmãos)
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.transitionDelay = `${siblings.indexOf(el) * 90}ms`;
    el.classList.add('in');
    el.querySelectorAll('.count').forEach(countUp);
    io.unobserve(el);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Formulário → mensagem pronta no WhatsApp
const form = document.getElementById('leadForm');
const err = document.getElementById('formError');
form.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(form);
  const required = ['nome', 'empresa', 'telefone'];
  let ok = true;
  required.forEach(name => {
    const input = form.elements[name];
    const empty = !input.value.trim();
    input.classList.toggle('invalid', empty);
    if (empty) ok = false;
  });
  err.hidden = ok;
  if (!ok) return;

  const msg = [
    'Olá, Kavicom! Gostaria de solicitar um orçamento.',
    '',
    `*Nome:* ${data.get('nome')}`,
    `*Empresa:* ${data.get('empresa')}`,
    `*Telefone:* ${data.get('telefone')}`,
    `*Serviço:* ${data.get('servico')}`,
    data.get('mensagem') ? `*Detalhes:* ${data.get('mensagem')}` : null
  ].filter(l => l !== null).join('\n');

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
});

document.getElementById('ano').textContent = new Date().getFullYear();
