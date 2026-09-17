// js/strategies.js
import { db } from './firebase.js';
import { navigateTo } from './app.js';
import { iniciarRespiracao } from './subapps/respiracao.js';
import { iniciarAgua } from './subapps/agua.js';
import { atualizarContador } from './dashboard.js';

// Cada estratégia carrega os gatilhos (definidos no onboarding, #trigger-group)
// que ela combate melhor. Usado só para REORDENAR a lista (nunca para esconder
// estratégias) quando o perfil do usuário tem gatilhos salvos.
const strategies = [
  { id:'agua', label:'Beber água', emoji:'💧', triggers:['cafe', 'refeicao'] },
  { id:'caminhar', label:'Caminhar', emoji:'🚶', triggers:['trabalho', 'tedio'] },
  { id:'apoio', label:'Ligar para apoio', emoji:'📞', triggers:['social', 'ansiedade'] },
  { id:'chiclete', label:'Mascar chiclete', emoji:'🍬', triggers:['cafe', 'refeicao', 'direcao'] },
  { id:'banho', label:'Tomar banho', emoji:'🚿', triggers:['estresse', 'dor'] },
  { id:'audio', label:'Ouvir áudio relaxante', emoji:'🎧', triggers:['estresse', 'ansiedade'] },
  { id:'sair', label:'Sair do gatilho', emoji:'🚪', triggers:['alcool', 'social'] },
  { id:'respirar', label:'Respiração guiada', emoji:'🧘', triggers:['estresse', 'ansiedade', 'dor'] },
  { id:'adiar', label:'Adiar por 5 min', emoji:'⏳', triggers:['tedio', 'direcao', 'outro'] },
  { id:'alongar', label:'Pausa ativa', emoji:'🤸', triggers:['trabalho', 'tedio'] },
  { id:'motivo', label:'Lembrar motivo', emoji:'💪', triggers:['alcool', 'outro'] },
];
window._strategies = strategies;

let rodizioIndex = 0;
let userProfileAtual = null;
let currentUserAtual = null;

export function mostrarEstrategias(user, profile) {
  currentUserAtual = user;
  userProfileAtual = profile;
  const container = document.getElementById('strategies-list');

  const gatilhosDoUsuario = profile?.triggers || [];
  const temPersonalizacao = gatilhosDoUsuario.length > 0;

  const recomendadas = [];
  const outras = [];
  strategies.forEach(s => {
    const combate = s.triggers.some(t => gatilhosDoUsuario.includes(t));
    if (temPersonalizacao && combate) {
      recomendadas.push(s);
    } else {
      outras.push(s);
    }
  });

  function renderCard(s, destacar) {
    return `<div class="card" data-strategy-id="${s.id}" style="display:flex; align-items:center; gap:12px; ${destacar ? 'border:2px solid var(--cor-secundaria);' : ''}">
      <span style="font-size:24px;">${s.emoji}</span>
      <span style="font-size:16px; font-weight:500; flex:1;">${s.label}</span>
      ${destacar ? '<span style="font-size:11px; background:var(--cor-secundaria); color:#fff; padding:3px 8px; border-radius:10px; white-space:nowrap;">Recomendado</span>' : ''}
    </div>`;
  }

  let html;
  if (temPersonalizacao && recomendadas.length) {
    html = `<p style="font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:var(--texto-medio); margin:12px 0 6px;">Recomendado pra você</p>`
      + recomendadas.map(s => renderCard(s, true)).join('')
      + `<p style="font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:var(--texto-medio); margin:16px 0 6px;">Outras estratégias</p>`
      + outras.map(s => renderCard(s, false)).join('');
  } else {
    // Sem gatilhos salvos no perfil: comportamento idêntico ao original.
    html = strategies.map(s => renderCard(s, false)).join('');
  }
  container.innerHTML = html;

  container.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', function() {
      const id = this.dataset.strategyId;
      if (id === 'agua') { iniciarAgua(currentUserAtual, userProfileAtual); return; }
      if (id === 'respirar') {
        navigateTo('screen-respiracao');
        iniciarRespiracao(currentUserAtual, userProfileAtual, false);
        return;
      }
      // Estratégias simples -> overlay
      window._selectedStrategyId = id;
      const strategy = strategies.find(s => s.id === id);
      document.getElementById('confirm-strategy-name').textContent = strategy.label;
      document.getElementById('confirmation-overlay').classList.add('active');
    });
  });
  atualizarRodizio(currentUserAtual, userProfileAtual);
}

function atualizarRodizio(user, profile) {
  const fotoEl = document.getElementById('strategies-foto');
  const fraseEl = document.getElementById('strategies-frase');
  
  if (!profile) {
    fotoEl.style.backgroundImage = '';
    fraseEl.textContent = '"Sua motivação aqui"';
    return;
  }
  
  const frases = profile.frases || [];
  if (frases.length) {
    const idx = rodizioIndex % frases.length;
    fraseEl.textContent = `"${frases[idx]}"`;
  } else {
    fraseEl.textContent = '"Você é mais forte que a fissura"';
  }
  
  const fotos = profile.fotos || [];
  if (fotos.length) {
    const idx = rodizioIndex % fotos.length;
    fotoEl.style.backgroundImage = `url(${fotos[idx]})`;
  } else {
    fotoEl.style.backgroundImage = '';
  }
  rodizioIndex++;
  if (window._rodizioInterval) clearInterval(window._rodizioInterval);
  window._rodizioInterval = setInterval(() => {
    if (document.getElementById('screen-strategies').classList.contains('active')) {
      atualizarRodizio(currentUserAtual, userProfileAtual);
    } else {
      clearInterval(window._rodizioInterval);
    }
  }, 8000);
}

export function voltarEstrategias() {
  if (window._rodizioInterval) clearInterval(window._rodizioInterval);
}

// ===== OVERLAY (corrigido) =====
document.getElementById('confirm-yes').addEventListener('click', async () => {
  const overlay = document.getElementById('confirmation-overlay');
  overlay.classList.remove('active');
  const strategyId = window._selectedStrategyId;
  if (strategyId && currentUserAtual) {
    await saveCravingLog(strategyId, 6, false, currentUserAtual);
    window._selectedStrategyId = null;
    await atualizarContador(currentUserAtual.uid);
    navigateTo('screen-dashboard');
  }
});

document.getElementById('confirm-no').addEventListener('click', async () => {
  const overlay = document.getElementById('confirmation-overlay');
  overlay.classList.remove('active');
  const strategyId = window._selectedStrategyId;
  if (strategyId && currentUserAtual) {
    const strategyLabel = strategies.find(s => s.id === strategyId)?.label || strategyId;
    await registerCigarroAutomatico(`Fissura - não resistiu (${strategyLabel})`, currentUserAtual);
    window._selectedStrategyId = null;
    navigateTo('screen-relapse');
  }
});

// ===== FUNÇÕES AUXILIARES =====
async function saveCravingLog(strategyId, intensity, smoked, user) {
  await db.collection('cravingLogs').add({
    userId: user.uid,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    trigger: 'Estratégia: ' + (strategies.find(s => s.id === strategyId)?.label || strategyId),
    intensity: intensity || 6,
    strategyUsed: strategyId,
    smoked: smoked || false
  });
  if (!smoked) {
    const counterRef = db.collection('counters').doc(user.uid);
    const cost = await getCostPerPack(user.uid);
    await counterRef.set({
      cigarettesAvoided: firebase.firestore.FieldValue.increment(1),
      moneySaved: firebase.firestore.FieldValue.increment(cost / 20)
    }, { merge: true });
  }
}

async function registerCigarroAutomatico(trigger, user) {
  await db.collection('cigaretteLogs').add({
    userId: user.uid,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    context: trigger || 'Fissura - não resistiu',
    craving: 8,
    emotion: 'Frustração'
  });
}

async function getCostPerPack(uid) {
  const doc = await db.collection('users').doc(uid).get();
  return doc.exists ? (doc.data().costPerPack || 12.00) : 12.00;
}
