// js/themeManager.js
// 9 temas: cada um tem imagem de fundo + paleta. 'modo' diz se o tema é claro
// (texto escuro, cartões claros) ou escuro (texto claro, cartões escuros) — o CSS do
// index.html troca bordas, vidro e botões conforme a classe 'tema-claro' no <body>.
// A primeira posição da lista é o tema padrão de quem ainda não escolheu.
const temas = [
  {
    id: 'estrelado',
    nome: 'Estrelado',
    imagem: 'assets/fundos/fundo9.jpg',
    modo: 'escuro',
    cores: { fundo: '#0a1420', card: '#101f33', texto: '#f2f7fb', medio: '#a9bdd4', fraco: '#7c93ad', primaria: '#3b82f6', secundaria: '#4fd1f0', destaque: '#f59e0b' }
  },
  {
    id: 'meditacao',
    nome: 'Meditação',
    imagem: 'assets/fundos/fundo1.jpg',
    modo: 'claro',
    cores: { fundo: '#faf8fd', card: '#ffffff', texto: '#241d3a', medio: '#463e62', fraco: '#6a6288', primaria: '#6a4db3', secundaria: '#5a3d9e', destaque: '#b4470b' }
  },
  {
    id: 'coracao',
    nome: 'Coração',
    imagem: 'assets/fundos/fundo2.jpg',
    modo: 'claro',
    cores: { fundo: '#a3ca79', card: '#f7faf1', texto: '#12240f', medio: '#1f3a1a', fraco: '#33502d', primaria: '#2f7a34', secundaria: '#1f5f25', destaque: '#b23a26' }
  },
  {
    id: 'afeto',
    nome: 'Afeto',
    imagem: 'assets/fundos/fundo3.jpg',
    modo: 'claro',
    cores: { fundo: '#ddd9d3', card: '#fbf8f6', texto: '#2a2624', medio: '#4a4340', fraco: '#655d59', primaria: '#3d7267', secundaria: '#9a3f55', destaque: '#b0432f' }
  },
  {
    id: 'pulmoes',
    nome: 'Pulmões',
    imagem: 'assets/fundos/fundo4.jpg',
    modo: 'claro',
    cores: { fundo: '#f8f9f4', card: '#ffffff', texto: '#1a2a16', medio: '#3a4d34', fraco: '#5a6c53', primaria: '#3b7a37', secundaria: '#2c6a3a', destaque: '#a4560c' }
  },
  {
    id: 'liberdade',
    nome: 'Liberdade',
    imagem: 'assets/fundos/fundo5.jpg',
    modo: 'claro',
    cores: { fundo: '#fefffe', card: '#ffffff', texto: '#15283a', medio: '#34495c', fraco: '#586c7e', primaria: '#2c6ea6', secundaria: '#245f91', destaque: '#b45410' }
  },
  {
    id: 'familia',
    nome: 'Família',
    imagem: 'assets/fundos/fundo6.jpg',
    modo: 'claro',
    cores: { fundo: '#fdaf73', card: '#fff8f0', texto: '#3a1c0a', medio: '#4f2a12', fraco: '#6e3e1e', primaria: '#b44a0a', secundaria: '#8a3506', destaque: '#a8300e' }
  },
  {
    id: 'cinzas',
    nome: 'Cinzas',
    imagem: 'assets/fundos/fundo7.jpg',
    modo: 'claro',
    cores: { fundo: '#807d75', card: '#f4f1ea', texto: '#0d0c0a', medio: '#12100e', fraco: '#2b2925', primaria: '#465c6e', secundaria: '#1c2a33', destaque: '#8f3b1c' }
  },
  {
    id: 'economia',
    nome: 'Economia',
    imagem: 'assets/fundos/fundo8.jpg',
    modo: 'claro',
    cores: { fundo: '#92745a', card: '#f6f0e6', texto: '#0f0a05', medio: '#0f0a05', fraco: '#2c1f13', primaria: '#4a6a2c', secundaria: '#1f3312', destaque: '#8f3a1a' }
  },
];

// Temas antigos (imagens que saíram da lista) -> tema mais parecido, para quem já tinha salvo.
const ALIAS_TEMAS = {
  mar: 'liberdade',
  floresta: 'pulmoes',
  por_do_sol: 'familia',
  neve: 'afeto',
};

export function resolverIdTema(id) {
  if (temas.some(t => t.id === id)) return id;
  if (ALIAS_TEMAS[id]) return ALIAS_TEMAS[id];
  return temas[0].id;
}

// Variáveis que dependem do modo (claro/escuro). Os valores do escuro são os mesmos
// que estão em :root no index.html.
const VARIAVEIS_MODO = {
  escuro: {
    '--borda': 'rgba(255,255,255,0.18)',
    '--hover-card': 'color-mix(in srgb, var(--bg-card) 90%, #fff)',
    '--bg-thumb': '#1a2a40',
    '--bg-chip-suave': 'rgba(255,255,255,0.08)',
    '--badge-bg': 'rgba(15,30,46,0.9)',
  },
  claro: {
    '--borda': 'rgba(0,0,0,0.14)',
    '--hover-card': 'color-mix(in srgb, var(--bg-card) 90%, #000)',
    '--bg-thumb': 'rgba(255,255,255,0.7)',
    '--bg-chip-suave': 'rgba(0,0,0,0.07)',
    '--badge-bg': 'rgba(255,255,255,0.88)',
  },
};

// Lista de ajustes (mantida para compatibilidade, mas usaremos 'top' como padrão)
const opcoesAjuste = [
  { id: 'top', label: 'Topo (padrão)', value: 'auto' },
  { id: 'cover', label: 'Cobrir', value: 'cover' },
  { id: 'contain', label: 'Conter', value: 'contain' },
  { id: 'stretch', label: 'Esticar', value: '100% 100%' },
  { id: 'repeat', label: 'Repetir', value: 'auto' },
  { id: 'center', label: 'Centralizar', value: 'auto' },
  { id: 'bottom', label: 'Inferior', value: 'auto' },
];

export function listarTemas() { return temas; }
export function listarAjustes() { return opcoesAjuste; }
export function obterUrlImagem(id) {
  const tema = temas.find(t => t.id === resolverIdTema(id));
  return tema ? tema.imagem : '';
}

export function aplicarTema(idOriginal, ajusteId = 'top') {
  const id = resolverIdTema(idOriginal);
  const tema = temas.find(t => t.id === id);
  // Se ajusteId não for fornecido ou for inválido, usa 'top'
  const ajuste = opcoesAjuste.find(a => a.id === ajusteId) || opcoesAjuste.find(a => a.id === 'top');
  const body = document.body;
  const c = tema.cores;

  const root = document.documentElement;
  root.style.setProperty('--bg-fundo', c.fundo);
  root.style.setProperty('--bg-card', c.card);
  root.style.setProperty('--texto-principal', c.texto);
  root.style.setProperty('--texto-medio', c.medio);
  root.style.setProperty('--texto-fraco', c.fraco);
  root.style.setProperty('--cor-primaria', c.primaria);
  root.style.setProperty('--cor-secundaria', c.secundaria);
  root.style.setProperty('--cor-destaque', c.destaque);
  const vars = VARIAVEIS_MODO[tema.modo] || VARIAVEIS_MODO.escuro;
  Object.entries(vars).forEach(([nome, valor]) => root.style.setProperty(nome, valor));
  body.classList.toggle('tema-claro', tema.modo === 'claro');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.fundo);

  const img = new Image();
  img.src = tema.imagem;
  img.onload = () => {
    body.style.backgroundImage = `url(${tema.imagem})`;
    body.style.backgroundColor = c.fundo;
    if (ajuste.id === 'repeat') {
      body.style.backgroundRepeat = 'repeat';
      body.style.backgroundSize = 'auto';
      body.style.backgroundPosition = '0 0';
    } else if (ajuste.id === 'stretch') {
      body.style.backgroundRepeat = 'no-repeat';
      body.style.backgroundSize = '100% 100%';
      body.style.backgroundPosition = 'center';
    } else if (ajuste.id === 'contain') {
      body.style.backgroundRepeat = 'no-repeat';
      body.style.backgroundSize = 'contain';
      body.style.backgroundPosition = 'center';
    } else if (ajuste.id === 'center') {
      body.style.backgroundRepeat = 'no-repeat';
      body.style.backgroundSize = 'auto';
      body.style.backgroundPosition = 'center';
    } else if (ajuste.id === 'top') {
      body.style.backgroundRepeat = 'no-repeat';
      body.style.backgroundSize = 'auto';
      body.style.backgroundPosition = 'top center';
    } else if (ajuste.id === 'bottom') {
      body.style.backgroundRepeat = 'no-repeat';
      body.style.backgroundSize = 'auto';
      body.style.backgroundPosition = 'bottom center';
    } else { // cover (fallback)
      body.style.backgroundRepeat = 'no-repeat';
      body.style.backgroundSize = 'cover';
      body.style.backgroundPosition = 'center';
    }
  };
  img.onerror = () => {
    console.warn('Imagem não encontrada:', tema.imagem);
    body.style.backgroundImage = 'none';
    body.style.backgroundColor = c.fundo;
  };

  // guarda sempre o id "novo" (se veio um tema antigo, já converte)
  localStorage.setItem('tema_app', id);
  localStorage.setItem('ajuste_imagem', ajusteId);
}

export function carregarTemaSalvo() {
  const id = resolverIdTema(localStorage.getItem('tema_app'));
  const ajusteSalvo = localStorage.getItem('ajuste_imagem') || 'top'; // padrão 'top'
  aplicarTema(id, ajusteSalvo);
  return { temaId: id, ajusteId: ajusteSalvo };
}
