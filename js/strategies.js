// js/strategies.js
import { db } from './firebase.js';
import { navigateTo } from './app.js';
import { iniciarRespiracao } from './subapps/respiracao.js';
import { iniciarAgua } from './subapps/agua.js';
import { atualizarContador } from './dashboard.js';

const strategies = [
  { id:'agua', label:'Beber água', emoji:'💧' },
  { id:'caminhar', label:'Caminhar', emoji:'🚶' },
  { id:'apoio', label:'Ligar para apoio', emoji:'📞' },
  { id:'chiclete', label:'Mascar chiclete', emoji:'🍬' },
  { id:'banho', label:'Tomar banho', emoji:'🚿' },
  { id:'audio', label:'Ouvir áudio relaxante', emoji:'🎧' },
  { id:'sair', label:'Sair do gatilho', emoji:'🚪' },
  { id:'respirar', label:'Respiração guiada', emoji:'🧘' },
  { id:'adiar', label:'Adiar por 5 min', emoji:'⏳' },
  { id:'alongar', label:'Pausa ativa', emoji:'🤸' },
  { id:'motivo', label:'Lembrar motivo', emoji:'💪' },
];
window._strategies = strategies;

let rodizioIndex = 0;
let userProfileAtual = null;
let currentUserAtual = null;

export function mostrarEstrategias(user, profile) {
  currentUserAtual = user;
  userProfileAtual = profile;
  const container = document.getElementById('strategies-list');
  container.innerHTML = strategies.map(s =>
    `<div class="card" data-strategy-id="${s.id}" style="display:flex; align-items:center; gap:12px;">
      <span style="font-size:24px;">${s.emoji}</span>
      <span style="font-size:16px; font-weight:500;">${s.label}</span>
    </div>`
  ).join('');
  
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