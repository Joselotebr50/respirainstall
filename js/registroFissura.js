// js/registroFissura.js
// Janela simples para registrar uma fissura vencida: intensidade (0-10) e,
// opcionalmente, o gatilho da situação (o que puxou a vontade de fumar).
// Substitui o prompt() nativo: dá para cancelar de verdade e o gatilho
// passa a ser gravado separado do botão/estratégia usado.

// Mesmos ids dos chips do onboarding (#trigger-group), para cruzar com profile.triggers.
export const GATILHOS = [
  { id: 'cafe', label: 'Café', emoji: '☕' },
  { id: 'alcool', label: 'Álcool', emoji: '🍺' },
  { id: 'estresse', label: 'Estresse', emoji: '😰' },
  { id: 'trabalho', label: 'Trabalho', emoji: '💼' },
  { id: 'direcao', label: 'Direção', emoji: '🚗' },
  { id: 'refeicao', label: 'Refeições', emoji: '🍽️' },
  { id: 'social', label: 'Amigos', emoji: '👥' },
  { id: 'dor', label: 'Dor', emoji: '🤕' },
  { id: 'tedio', label: 'Tédio', emoji: '😐' },
  { id: 'ansiedade', label: 'Ansiedade', emoji: '😥' },
  { id: 'outro', label: 'Outro', emoji: '🔄' },
];

export function rotuloGatilho(id) {
  const g = GATILHOS.find(x => x.id === id);
  return g ? g.label : (id || '');
}

let janelaAberta = false;

// Resolve com { intensidade: number, gatilho: string|null } ou null se cancelar.
export function pedirDetalhesFissura(titulo = 'Registrar fissura vencida') {
  if (janelaAberta) return Promise.resolve(null);
  janelaAberta = true;

  return new Promise((resolve) => {
    let gatilhoEscolhido = null;

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(0,0,0,0.65);';

    const box = document.createElement('div');
    box.style.cssText = 'width:100%; max-width:420px; max-height:90vh; overflow-y:auto; background:var(--bg-card, #101f33); color:var(--texto-principal, #f2f7fb); border:1px solid rgba(255,255,255,0.15); border-radius:20px; padding:20px;';

    const h = document.createElement('h3');
    h.textContent = titulo;
    h.style.cssText = 'margin-bottom:14px;';
    box.appendChild(h);

    const labelInt = document.createElement('p');
    labelInt.style.cssText = 'margin-bottom:6px; font-size:14px;';
    const valorSpan = document.createElement('strong');
    valorSpan.textContent = '6';
    labelInt.append('Intensidade da fissura: ', valorSpan, '/10');
    box.appendChild(labelInt);

    const range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = '10';
    range.step = '1';
    range.value = '6';
    range.style.cssText = 'width:100%; margin-bottom:16px;';
    range.addEventListener('input', () => { valorSpan.textContent = range.value; });
    box.appendChild(range);

    const labelG = document.createElement('p');
    labelG.textContent = 'O que puxou a vontade? (opcional)';
    labelG.style.cssText = 'margin-bottom:8px; font-size:14px;';
    box.appendChild(labelG);

    const chips = document.createElement('div');
    chips.className = 'chip-group';
    GATILHOS.forEach((g) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = `${g.emoji} ${g.label}`;
      chip.addEventListener('click', () => {
        const jaSelecionado = gatilhoEscolhido === g.id;
        chips.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
        gatilhoEscolhido = jaSelecionado ? null : g.id;
        if (!jaSelecionado) chip.classList.add('selected');
      });
      chips.appendChild(chip);
    });
    box.appendChild(chips);

    const btnOk = document.createElement('button');
    btnOk.className = 'btn btn-success';
    btnOk.textContent = 'Registrar';
    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn btn-outline';
    btnCancel.textContent = 'Cancelar';
    box.append(btnOk, btnCancel);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function fechar(resultado) {
      overlay.remove();
      janelaAberta = false;
      resolve(resultado);
    }

    btnOk.addEventListener('click', () => fechar({
      intensidade: parseInt(range.value, 10),
      gatilho: gatilhoEscolhido
    }));
    btnCancel.addEventListener('click', () => fechar(null));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(null); });
  });
}
