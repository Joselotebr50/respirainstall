// js/history.js
import { db } from './firebase.js';

const strategies = [
  { id:'agua', label:'Água' }, { id:'caminhar', label:'Caminhar' },
  { id:'apoio', label:'Apoio' }, { id:'chiclete', label:'Chiclete' },
  { id:'banho', label:'Banho' }, { id:'audio', label:'Áudio' },
  { id:'sair', label:'Sair' }, { id:'respirar', label:'Respirar' },
  { id:'adiar', label:'Adiar' }, { id:'alongar', label:'Alongar' },
  { id:'motivo', label:'Motivo' }, { id:'respirar_sos', label:'SOS Respiração' },
];

export async function carregarHistory(user) {
  const container = document.getElementById('history-content');
  container.innerHTML = 'Carregando...';
  try {
    const logsSnap = await db.collection('cigaretteLogs').where('userId','==',user.uid).get();
    const cravingsSnap = await db.collection('cravingLogs').where('userId','==',user.uid).get();
    let logs = []; logsSnap.forEach(doc => { const d=doc.data(); logs.push({...d, timestamp: d.timestamp?.toDate?.()||new Date()}); });
    logs.sort((a,b)=>b.timestamp-a.timestamp); logs=logs.slice(0,10);
    let cravings = []; cravingsSnap.forEach(doc => { const d=doc.data(); cravings.push({...d, timestamp: d.timestamp?.toDate?.()||new Date()}); });
    cravings.sort((a,b)=>b.timestamp-a.timestamp); cravings=cravings.slice(0,10);
    let html = '<h3>Últimos cigarros</h3>';
    if (logs.length===0) html += '<p>Nenhum cigarro registrado.</p>';
    logs.forEach(d => { html += `<div class="card"><strong>${d.context||'Contexto'}</strong> - Vontade: ${d.craving}/10 - ${d.emotion||''}</div>`; });
    html += '<h3>Últimas fissuras vencidas</h3>';
    if (cravings.length===0) html += '<p>Nenhuma fissura registrada.</p>';
    cravings.forEach(d => {
      const strategyLabel = strategies.find(s=>s.id===d.strategyUsed)?.label || d.strategyUsed || 'não informado';
      html += `<div class="card"><strong>${d.trigger||'Gatilho'}</strong> - Intensidade: ${d.intensity}/10 - Estratégia: ${strategyLabel}</div>`;
    });
    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = `<p>Erro: ${e.message}</p>`;
  }
}