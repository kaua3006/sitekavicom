// ─── CATÁLOGO KAVICOM ───
// Para adicionar um produto, copie um bloco { ... } e altere os dados.
// categoria: deslizantes | ganchos | fitas | varoes | ilhoses | apanhadores
// tag:      texto curto acima do nome (como no catálogo impresso)
// medidas: opcional ('' esconde)
// cores:   opcional, { injetado: [...], metalizado: [...] } com nomes de CORES_HEX (loja.js)
// selo:     destaque no canto da foto (ou '' para nenhum)

const CORES_VAROES = {
  injetado: ['Azul', 'Palha', 'Branco', 'Cerejeira', 'Imbuia', 'Marfim', 'Mogno', 'Ouro Velho', 'Rosa', 'Titânio'],
  metalizado: ['Cromado']
};
const CORES_ILHOSES = {
  injetado: ['Branco', 'Palha', 'Bege', 'Marfim', 'Cerejeira', 'Mogno', 'Imbuia', 'Preto', 'Titânio', 'Ouro Velho',
             'Rosa Bebê', 'Rosa Pink', 'Lilás', 'Roxo', 'Vermelho', 'Azul Bebê', 'Verde Pistache', 'Verde Escuro',
             'Amarelo', 'Laranja', 'Transparente'],
  metalizado: ['Cromado', 'Dourado']
};
const CORES_APANHADORES = {
  injetado: ['Branco', 'Marfim', 'Cerejeira', 'Mogno', 'Imbuia', 'Preto', 'Titânio', 'Ouro Velho'],
  metalizado: ['Cromado', 'Dourado']
};

const PRODUTOS = [
  // Linha 01 · Deslizantes
  {
    nome: 'Max Redondo',
    categoria: 'deslizantes',
    tag: 'Argola fechada',
    descricao: 'Deslizante com argola redonda fechada para pendurar a cortina.',
    imagem: 'assets/img/produtos/max-redondo.jpg',
    medidas: '', cores: null,
    selo: 'Mais vendido'
  },
  {
    nome: 'Deslizante Click Clip',
    categoria: 'deslizantes',
    tag: 'Encaixe clip',
    descricao: 'Deslizante com gancho clip que abre e fecha para prender a cortina.',
    imagem: 'assets/img/produtos/deslizante-click-clip.jpg',
    medidas: '', cores: null,
    selo: ''
  },
  {
    nome: 'Deslizante Wave',
    categoria: 'deslizantes',
    tag: 'Sistema wave',
    descricao: 'Deslizante com botão de encaixe, pensado para cortinas no estilo wave.',
    imagem: 'assets/img/produtos/deslizante-wave.jpg',
    medidas: '', cores: null,
    selo: ''
  },
  {
    nome: 'Deslizante Terminal',
    categoria: 'deslizantes',
    tag: 'Para finalizar',
    descricao: 'Deslizante de ponta, usado para finalizar a cortina no trilho.',
    imagem: 'assets/img/produtos/deslizante-terminal.jpg',
    medidas: '', cores: null,
    selo: ''
  },

  // Linha 02 · Ganchos para deslizantes
  {
    nome: 'Clips Gancho Fácil para Deslizantes',
    categoria: 'ganchos',
    tag: 'Formato fechado',
    descricao: 'Gancho em formato de clipe fechado para encaixar nos deslizantes.',
    imagem: 'assets/img/produtos/clips-gancho-facil.jpg',
    medidas: '', cores: null,
    selo: ''
  },
  {
    nome: 'Gancho Clips para Deslizante',
    categoria: 'ganchos',
    tag: 'Haste inclinada',
    descricao: 'Gancho clip com haste inclinada para prender a cortina ao deslizante.',
    imagem: 'assets/img/produtos/gancho-clips.jpg',
    medidas: '', cores: null,
    selo: ''
  },

  // Linha 03 · Fitas
  {
    nome: 'Fita Wave',
    categoria: 'fitas',
    tag: 'Em bobina',
    descricao: 'Cordão com esferas, em bobina, para montar cortinas no estilo wave.',
    imagem: 'assets/img/produtos/fita-wave.jpg',
    medidas: '', cores: null,
    selo: ''
  },
  {
    nome: 'Fita Wave com Botões',
    categoria: 'fitas',
    tag: 'Botões de pressão',
    descricao: 'Fita com botões de pressão para montar cortinas no estilo wave.',
    imagem: 'assets/img/produtos/fita-wave-botoes.jpg',
    medidas: '', cores: null,
    selo: ''
  },
  {
    nome: 'Fita Fácil',
    categoria: 'fitas',
    tag: 'Topo da cortina',
    descricao: 'Fita com passadores para os ganchos, aplicada no topo da cortina.',
    imagem: 'assets/img/produtos/fita-facil.jpg',
    medidas: '', cores: null,
    selo: ''
  },

  // Varões
  {
    nome: 'Varão Linha Due',
    categoria: 'varoes',
    tag: 'Kit completo',
    descricao: 'Kit de varão, suporte e ponteira. Fixação dupla, com 2 parafusos e 2 buchas.',
    imagem: 'assets/img/produtos/varao-due.jpg',
    medidas: 'Ø 19 e 28 mm · 1,5 / 2,0 / 2,5 / 3,0 / 4,0 m',
    cores: CORES_VAROES,
    selo: 'Lançamento'
  },
  {
    nome: 'Varão Linha Facile',
    categoria: 'varoes',
    tag: 'Kit completo',
    descricao: 'Kit de varão, suporte e ponteira. Fixação com 1 parafuso acoplado.',
    imagem: 'assets/img/produtos/varao-facile.jpg',
    medidas: 'Ø 19 e 28 mm · 1,5 / 2,0 / 2,5 / 3,0 / 4,0 m',
    cores: CORES_VAROES,
    selo: 'Lançamento'
  },
  {
    nome: 'Ponteira e Suporte',
    categoria: 'varoes',
    tag: 'Vendidos separadamente',
    descricao: 'Ponteiras e suportes avulsos para reposição ou montagem do varão.',
    imagem: 'assets/img/produtos/ponteira-suporte.jpg',
    medidas: '', cores: CORES_VAROES,
    selo: ''
  },

  // Ilhoses e argolas
  {
    nome: 'Ilhós Linha Piazza',
    categoria: 'ilhoses',
    tag: 'Ilhós quadrado',
    descricao: 'Ilhós quadrado para cortinas com acabamento moderno.',
    imagem: 'assets/img/produtos/ilhos-piazza.jpg',
    medidas: 'Ø 19 · 28 · 32 mm',
    cores: CORES_ILHOSES,
    selo: ''
  },
  {
    nome: 'Ilhós Linha Round',
    categoria: 'ilhoses',
    tag: 'Ilhós redondo',
    descricao: 'Ilhós redondo clássico para cortinas de varão.',
    imagem: 'assets/img/produtos/ilhos-round.jpg',
    medidas: 'Ø 19 · 28 · 32 mm',
    cores: CORES_ILHOSES,
    selo: ''
  },
  {
    nome: 'Argola Linha Massiccio',
    categoria: 'ilhoses',
    tag: 'Argola maciça',
    descricao: 'Argola maciça para pendurar a cortina no varão.',
    imagem: 'assets/img/produtos/argola-massiccio.jpg',
    medidas: 'Ø 19 · 28 mm',
    cores: CORES_ILHOSES,
    selo: ''
  },

  // Apanhadores
  {
    nome: 'Apanhador Losangular',
    categoria: 'apanhadores',
    tag: 'Formato losango',
    descricao: 'Apanhador para prender e abrir a cortina nas laterais.',
    imagem: 'assets/img/produtos/apanhador-losangular.jpg',
    medidas: 'Pequeno e Grande',
    cores: CORES_APANHADORES,
    selo: ''
  },
  {
    nome: 'Apanhador Oval',
    categoria: 'apanhadores',
    tag: 'Formato oval',
    descricao: 'Apanhador para prender e abrir a cortina nas laterais.',
    imagem: 'assets/img/produtos/apanhador-oval.jpg',
    medidas: 'Pequeno e Grande',
    cores: CORES_APANHADORES,
    selo: ''
  }
];
