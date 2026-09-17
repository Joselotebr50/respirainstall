// js/subapps/respiracao.js
import { db } from '../firebase.js';
import { navigateTo } from '../app.js';

let intervalo = null;
let cicloAtual = 1;
let faseAtual = 0;
let isSOS = false;
let userAtual = null;

const fases = [
  { label: 'Inspire...', cor: '#3b82f6', escala: 1.2, tempo: 4000 },
  { label: 'Segure...', cor: '#8b5cf6', escala: 1.2, tempo: 7000 },
  { label: 'Expire...', cor: '#22c55e', escala: 0.8, tempo: 8000 },
];

export function iniciarRespiracao(user, profile, sos) {
  userAtual = user;
  isSOS = sos;
  cicloAtual = 1;
  faseAtual = 0;
  const circle = document.getElementById('respiracao-circle');
  const texto = document.getElementById('respiracao-texto');
  const fasesEl = document.getElementById('respiracao-fases');
  const cicloEl = document.getElementById('respiracao-ciclo');
  const btnConsegui = document.getElementById('btn-respiracao-consegui');
  const btnFalhei = document.getElementById('btn-respiracao-falhei');
  btnConsegui.style.display = 'none';
  btnFalhei.style.display = 'none';
  
  if (intervalo) clearInterval(intervalo);
  executarFase();
}

function executarFase() {
  const circle = document.getElementById('respiracao-circle');
  const texto = document.getElementById('respiracao-texto');
  const fasesEl = document.getElementById('respiracao-fases');
  const cicloEl = document.getElementById('respiracao-ciclo');
  
  if (cicloAtual > 3) {
    // Finalizou 3 ciclos
    circle.style.transform = 'scale(1)';
    circle.style.background = '#22c55e';
    texto.textContent = '✅ Respiração concluída!';
    document.getElementById('btn-respiracao-consegui').style.display = 'inline-block';
    document.getElementById('btn-respiracao-falhei').style.display = 'inline-block';
    return;
  }
  
  const fase = fases[faseAtual];
  circle.textContent = '🌬️';
  circle.style.background = fase.cor;
  circle.style.transform = `scale(${fase.escala})`;
  texto.textContent = fase.label;
  
  // Destacar fase atual
  fasesEl.querySelectorAll('span').forEach((el, i) => {
    el.classList.toggle('ativo', i === faseAtual);
  });
  cicloEl.textContent = `Ciclo ${cicloAtual} de 3`;
  
  faseAtual++;
  if (faseAtual >= fases.length) {
    faseAtual = 0;
    cicloAtual++;
  }
  
  intervalo = setTimeout(() => executarFase(), fase.tempo);
}

export function finalizarRespiracao() {
  if (intervalo) clearInterval(intervalo);
  intervalo = null;
  const circle = document.getElementById('respiracao-circle');
  circle.style.transform = 'scale(1)';
  circle.style.background = '#3b82f6';
  document.getElementById('respiracao-texto').textContent = 'Respiração';
  document.getElementById('btn-respiracao-consegui').style.display = 'none';
  document.getElementById('btn-respiracao-falhei').style.display = 'none';
}

// Botões de resultado
document.getElementById('btn-respiracao-consegui').addEventListener('click', async () => {
  if (!userAtual) return;
  await saveCravingLog('respirar_sos', 6, false, userAtual);
  finalizarRespiracao();
  navigateTo('screen-dashboard');
});

document.getElementById('btn-respiracao-falhei').addEventListener('click', async () => {
  if (!userAtual) return;
  await registerCigarroAutomatico('Fissura - não resistiu (respiração)', userAtual);
  finalizarRespiracao();
  navigateTo('screen-relapse');
});

async function saveCravingLog(strategyId, intensity, smoked, user) {
  await db.collection('cravingLogs').add({
    userId: user.uid,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    trigger: 'SOS - Respiração',
    intensity: intensity || 6,
    strategyUsed: strategyId,
    smoked: smoked || false,
    urgente: true
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