// js/themeManager.js
const temas = [
  {
    id: 'estrelado',
    nome: 'Estrelado',
    imagem: 'assets/fundos/fundo1.jpg',
    cores: { fundo: '#0a1420', card: '#101f33', texto: '#f2f7fb', primaria: '#3b82f6', secundaria: '#4fd1f0', destaque: '#f59e0b' }
  },
  {
    id: 'mar',
    nome: 'Mar',
    imagem: 'assets/fundos/fundo2.jpg',
    cores: { fundo: '#0b1a2e', card: '#1a2f44', texto: '#e6f0fa', primaria: '#0ea5e9', secundaria: '#38bdf8', destaque: '#f97316' }
  },
  {
    id: 'floresta',
    nome: 'Floresta',
    imagem: 'assets/fundos/fundo3.jpg',
    cores: { fundo: '#0f1f12', card: '#1e3322', texto: '#e6f2e6', primaria: '#22c55e', secundaria: '#4ade80', destaque: '#eab308' }
  },
  {
    id: 'por_do_sol',
    nome: 'Pôr do Sol',
    imagem: 'assets/fundos/fundo4.jpg',
    cores: { fundo: '#2a0f1a', card: '#3d1f2a', texto: '#fde8e8', primaria: '#f43f5e', secundaria: '#fb7185', destaque: '#f59e0b' }
  },
  {
    id: 'neve',
    nome: 'Neve',
    imagem: 'assets/fundos/fundo5.jpg',
    cores: { fundo: '#1a2835', card: '#2d3f4f', texto: '#f0f8ff', primaria: '#60a5fa', secundaria: '#93c5fd', destaque: '#fcd34d' }
  },
];

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
  const tema = temas.find(t => t.id === id);
  return tema ? tema.imagem : '';
}

export function aplicarTema(id, ajusteId = 'top') {
  console.log('🔄 Aplicando tema:', id, 'Ajuste:', ajusteId);
  const tema = temas.find(t => t.id === id);
  if (!tema) {
    console.warn('Tema não encontrado:', id);
    return;
  }
  // Se ajusteId não for fornecido ou for inválido, usa 'top'
  const ajuste = opcoesAjuste.find(a => a.id === ajusteId) || opcoesAjuste.find(a => a.id === 'top');
  const body = document.body;
  const c = tema.cores;

  const root = document.documentElement;
  root.style.setProperty('--bg-fundo', c.fundo);
  root.style.setProperty('--bg-card', c.card);
  root.style.setProperty('--texto-principal', c.texto);
  root.style.setProperty('--cor-primaria', c.primaria);
  root.style.setProperty('--cor-secundaria', c.secundaria);
  root.style.setProperty('--cor-destaque', c.destaque);

  const img = new Image();
  img.src = tema.imagem;
  img.onload = () => {
    body.style.backgroundImage = `url(${tema.imagem})`;
    body.style.backgroundColor = c.fundo;
    // Aplica o ajuste 'top' como padrão
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

  localStorage.setItem('tema_app', id);
  localStorage.setItem('ajuste_imagem', ajusteId);
}

export function carregarTemaSalvo() {
  const temaSalvo = localStorage.getItem('tema_app');
  const ajusteSalvo = localStorage.getItem('ajuste_imagem') || 'top'; // padrão 'top'
  const existe = temas.some(t => t.id === temaSalvo);
  const id = existe ? temaSalvo : temas[0].id;
  aplicarTema(id, ajusteSalvo);
  return { temaId: id, ajusteId: ajusteSalvo };
}
