// js/history.js
import { db } from './firebase.js';
import { strategies } from './strategies.js';
import { rotuloGatilho } from './registroFissura.js';

// 'respirar_sos' é gravado pelo fluxo de SOS mas não existe como estratégia
// clicável em strategies.js — mantemos só o rótulo aqui para exibição.
const rotulosExtras = { respirar_sos: 'SOS Respiração' };

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Busca os 10 mais recentes. Usa orderBy/limit no Firestore (exige índice composto
// userId + timestamp). Se o índice ainda não existir, cai para o modo antigo
// (busca por userId e ordena no aparelho) para a tela continuar funcionando.
async function buscarUltimos(colecao, uid) {
  try {
    const snap = await db.collection(colecao)
      .where('userId', '==', uid).orderBy('timestamp', 'desc').limit(10).get();
    return snap.docs.map(doc => doc.data());
  } catch (e) {
    if (e.code !== 'failed-precondition') throw e;
    console.warn(`Índice composto ausente em "${colecao}". Crie pelo link da mensagem:`, e.message);
    const snap = await db.collection(colecao).where('userId', '==', uid).get();
    const lista = snap.docs.map(doc => doc.data());
    const ms = (d) => d.timestamp?.toMillis?.() ?? Date.now();
    lista.sort((a, b) => ms(b) - ms(a));
    return lista.slice(0, 10);
  }
}

export async function carregarHistory(user) {
  const container = document.getElementById('history-content');
  container.innerHTML = 'Carregando...';
  try {
    const [logs, cravings] = await Promise.all([
      buscarUltimos('cigaretteLogs', user.uid),
      buscarUltimos('cravingLogs', user.uid)
    ]);
    let html = '<h3>Últimos cigarros</h3>';
    if (logs.length === 0) html += '<p>Nenhum cigarro registrado.</p>';
    logs.forEach(d => {
      html += `<div class="card"><strong>${esc(d.context || 'Contexto')}</strong> - Vontade: ${esc(d.craving)}/10 - ${esc(d.emotion || '')}</div>`;
    });
    html += '<h3>Últimas fissuras vencidas</h3>';
    if (cravings.length === 0) html += '<p>Nenhuma fissura registrada.</p>';
    cravings.forEach(d => {
      const strategyLabel = strategies.find(s => s.id === d.strategyUsed)?.label || rotulosExtras[d.strategyUsed] || d.strategyUsed || 'não informado';
      const gatilho = d.gatilho ? ` - Gatilho: ${esc(rotuloGatilho(d.gatilho))}` : '';
      html += `<div class="card"><strong>${esc(d.trigger || 'Gatilho')}</strong> - Intensidade: ${esc(d.intensity)}/10 - Estratégia: ${esc(strategyLabel)}${gatilho}</div>`;
    });
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<p>Erro: ${esc(e.message)}</p>`;
  }
}
