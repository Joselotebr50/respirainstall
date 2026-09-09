// js/subapps/agua.js
import { db } from '../firebase.js';
import { navigateTo } from '../app.js';
import { atualizarContador } from '../dashboard.js';

let aguaUser = null;
let aguaProfile = null;
let aguaSessaoId = null;
let aguaAtividadeId = null;
let aguaVariacao = null;
let aguaGoleAtual = 0;
let aguaRespiracaoInterval = null;

const aguaInstrucoes = {
  agua_gelada: [
    'Gole 1: Segure o copo e sinta o frio na mão.',
    'Gole 2: Tome um gole pequeno e sinta o frio na boca.',
    'Gole 3: Tome o último gole devagar.'
  ],
  agua_temperatura_ambiente: [
    'Gole 1: Observe a água no copo.',
    'Gole 2: Tome um gole e sinta a textura.',
    'Gole 3: Beba o restante com calma.'
  ],
  agua_com_gas: [
    'Gole 1: Observe as bolhas.',
    'Gole 2: Tome um gole e sinta a efervescência.',
    'Gole 3: Termine a água.'
  ],
  cha: [
    'Gole 1: Segure a xícara com as duas mãos.',
    'Gole 2: Assopre e tome um gole pequeno.',
    'Gole 3: Tome o último gole.'
  ]
};

export function iniciarAgua(user, profile) {
  aguaUser = user;
  aguaProfile = profile;
  aguaSessaoId = null;
  aguaAtividadeId = null;
  aguaVariacao = null;
  aguaGoleAtual = 0;
  if (aguaRespiracaoInterval) clearInterval(aguaRespiracaoInterval);
  navigateTo('screen-agua');
  mostrarEtapa('agua-tela-abertura');
  criarSessaoAtividade();
}

function mostrarEtapa(id) {
  document.querySelectorAll('#screen-agua .subapp-tela').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

async function criarSessaoAtividade() {
  if (!aguaUser) return;
  const sessaoRef = db.collection('users').doc(aguaUser.uid).collection('sessoes_sos').doc();
  aguaSessaoId = sessaoRef.id;
  await sessaoRef.set({
    data_hora_inicio: firebase.firestore.FieldValue.serverTimestamp(),
    status: 'em_andamento'
  });
  const ativRef = sessaoRef.collection('atividades').doc();
  aguaAtividadeId = ativRef.id;
  await ativRef.set({
    tipo: 'beber_agua',
    variacao: null,
    data_hora_inicio: firebase.firestore.FieldValue.serverTimestamp(),
    concluida: false
  });
}

export function aguaMostrarVariacao() { mostrarEtapa('agua-tela-variacao'); }
window.aguaMostrarVariacao = aguaMostrarVariacao;

export function aguaSelecionarVariacao(variacao) {
  aguaVariacao = variacao;
  document.getElementById('agua-texto-preparacao').textContent = aguaInstrucoes[variacao][0];
  mostrarEtapa('agua-tela-preparacao');
}
window.aguaSelecionarVariacao = aguaSelecionarVariacao;

export function aguaIniciarGoles() {
  aguaGoleAtual = 1;
  mostrarGole();
}
window.aguaIniciarGoles = aguaIniciarGoles;

function mostrarGole() {
  if (aguaGoleAtual > 3) {
    mostrarEtapa('agua-tela-registro');
    return;
  }
  const texto = aguaInstrucoes[aguaVariacao][aguaGoleAtual - 1];
  document.getElementById('agua-texto-gole').textContent = texto;
  document.getElementById('agua-respiracao').style.display = 'none';
  document.getElementById('agua-botao-proximo').style.display = 'block';
  document.getElementById('agua-botao-proximo').textContent = 'Próximo gole';
  document.getElementById('agua-botao-proximo').onclick = () => iniciarRespiracaoEntreGoles();
  mostrarEtapa('agua-tela-goles');
}

function iniciarRespiracaoEntreGoles() {
  document.getElementById('agua-botao-proximo').style.display = 'none';
  const respDiv = document.getElementById('agua-respiracao');
  respDiv.style.display = 'block';
  const circle = document.getElementById('agua-breath-circle');
  const texto = document.getElementById('agua-respiracao-texto');
  
  const fases = [
    { label: 'Inspire...', cor: '#3b82f6', escala: 1.3 },
    { label: 'Segure...', cor: '#8b5cf6', escala: 1.3 },
    { label: 'Expire...', cor: '#22c55e', escala: 0.7 },
  ];
  let faseIdx = 0;
  let ciclos = 0;
  
  if (aguaRespiracaoInterval) clearInterval(aguaRespiracaoInterval);
  aguaRespiracaoInterval = setInterval(() => {
    const fase = fases[faseIdx];
    circle.style.background = fase.cor;
    circle.style.transform = `scale(${fase.escala})`;
    texto.textContent = fase.label;
    faseIdx++;
    if (faseIdx >= fases.length) {
      faseIdx = 0;
      ciclos++;
      if (ciclos >= 3) {
        clearInterval(aguaRespiracaoInterval);
        aguaRespiracaoInterval = null;
        texto.textContent = '✅ Respiração concluída!';
        circle.style.background = '#22c55e';
        circle.style.transform = 'scale(1)';
        const continuarBtn = document.createElement('button');
        continuarBtn.className = 'btn btn-primary';
        continuarBtn.textContent = 'Continuar';
        continuarBtn.onclick = () => {
          respDiv.style.display = 'none';
          aguaGoleAtual++;
          mostrarGole();
        };
        respDiv.appendChild(continuarBtn);
      }
    }
  }, 2000);
}

export function aguaPularGole() {
  if (aguaRespiracaoInterval) clearInterval(aguaRespiracaoInterval);
  aguaGoleAtual++;
  mostrarGole();
}
window.aguaPularGole = aguaPularGole;

// ===== CORREÇÃO: REGISTRAR FISSURA E ATUALIZAR DASHBOARD =====
export async function aguaRegistrarFissura(intensidade) {
  await saveFissura(intensidade);
  if (aguaUser) {
    await atualizarContador(aguaUser.uid);
  }
  const mensagem = intensidade === 'passou' || intensidade === 'fraca'
    ? 'Você cuidou de si. A fissura perde força.'
    : 'Que tal tentar outra atividade?';
  document.getElementById('agua-mensagem-encerramento').textContent = mensagem;
  mostrarEtapa('agua-tela-encerramento');
}
window.aguaRegistrarFissura = aguaRegistrarFissura;

async function saveFissura(intensidade) {
  if (!aguaSessaoId || !aguaUser) return;
  try {
    const ativRef = db.collection('users').doc(aguaUser.uid)
      .collection('sessoes_sos').doc(aguaSessaoId)
      .collection('atividades').doc(aguaAtividadeId);
    await ativRef.update({ concluida: true, data_hora_fim: firebase.firestore.FieldValue.serverTimestamp() });
    await db.collection('users').doc(aguaUser.uid)
      .collection('sessoes_sos').doc(aguaSessaoId)
      .update({ status: 'concluida', data_hora_fim: firebase.firestore.FieldValue.serverTimestamp() });
    await db.collection('cravingLogs').add({
      userId: aguaUser.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      trigger: 'Água - ' + aguaVariacao,
      intensity: intensidade === 'passou' ? 2 : intensidade === 'fraca' ? 4 : intensidade === 'moderada' ? 6 : 8,
      strategyUsed: 'agua',
      smoked: false
    });
    if (intensidade !== 'forte') {
      const counterRef = db.collection('counters').doc(aguaUser.uid);
      const cost = aguaProfile?.costPerPack || 12.00;
      await counterRef.set({
        cigarettesAvoided: firebase.firestore.FieldValue.increment(1),
        moneySaved: firebase.firestore.FieldValue.increment(cost / 20)
      }, { merge: true });
    }
  } catch (e) {
    console.error('Erro ao salvar fissura:', e);
  }
}

export function aguaRepetir() {
  aguaGoleAtual = 0;
  aguaVariacao = null;
  criarSessaoAtividade();
  aguaMostrarVariacao();
}
window.aguaRepetir = aguaRepetir;

// ===== CORREÇÃO: SAIR E ATUALIZAR DASHBOARD =====
export async function aguaSairParaEstrategias() {
  if (aguaRespiracaoInterval) clearInterval(aguaRespiracaoInterval);
  if (aguaUser) {
    await atualizarContador(aguaUser.uid);
  }
  navigateTo('screen-strategies');
}
window.aguaSairParaEstrategias = aguaSairParaEstrategias;

export function sairAgua() {
  if (aguaRespiracaoInterval) clearInterval(aguaRespiracaoInterval);
}
