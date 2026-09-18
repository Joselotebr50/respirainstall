// js/app.js (completo com todas as funcionalidades)
console.log('🔥 App.js carregou');

import { auth, db } from './firebase.js';
import { login, register, logout, togglePasswordVisibility } from './auth.js';
import { 
  iniciarOnboarding, 
  carregarOnboardingParaEdicao, 
  finalizarOnboarding 
} from './onboarding.js';
import { renderDashboard, atualizarContador } from './dashboard.js';
import { mostrarEstrategias, voltarEstrategias, strategies as TODAS_ESTRATEGIAS } from './strategies.js';
import { iniciarRespiracao, finalizarRespiracao } from './subapps/respiracao.js';
import { iniciarAgua, sairAgua } from './subapps/agua.js';
import { carregarTemaSalvo, aplicarTema } from './themeManager.js';
import { carregarLessons } from './lessons.js';
import { carregarHistory } from './history.js';

// ===== VARIÁVEIS GLOBAIS =====
export let currentUser = null;
export let userProfile = null;
export let modoEdicao = false;

const PROTECTED_SCREENS = [
  'screen-onboarding', 'screen-dashboard', 'screen-strategies',
  'screen-register-cigarette', 'screen-register-craving', 'screen-relapse',
  'screen-lessons', 'screen-history', 'screen-agua', 'screen-respiracao'
];

// ===== ROTEADOR =====
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
    el.style.visibility = 'hidden';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
  });
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    target.style.display = 'block';
    target.style.visibility = 'visible';
    target.style.opacity = '1';
    target.style.pointerEvents = 'auto';
    if (id === 'screen-login') target.style.display = 'flex';
    if (id === 'screen-respiracao') target.style.display = 'block';
  }
  if (id === 'screen-dashboard' && currentUser && userProfile) {
    renderDashboard(currentUser, userProfile).catch(e => console.error('Erro ao atualizar dashboard:', e));
  }
}

export function navigateTo(screenId) {
  if (PROTECTED_SCREENS.includes(screenId) && !currentUser) {
    showScreen('screen-login');
    return;
  }
  if (screenId === 'screen-login' && currentUser) {
    if (userProfile) {
      showScreen('screen-dashboard');
      updatePlanBadge();
    } else {
      showScreen('screen-onboarding');
    }
    return;
  }
  showScreen(screenId);
}

export function updatePlanBadge() {
  const badge = document.getElementById('plan-badge');
  if (!userProfile) return;
  const mode = userProfile.quitMode;
  if (mode === 'today') badge.textContent = '🔥 Plano: Hoje (Intensivo)';
  else if (mode === 'reduce') badge.textContent = '📉 Plano: Redução gradual';
  else badge.textContent = `📅 Plano: ${mode} dias`;
}

// Fotos e áudio motivacional ficam em documentos separados do perfil
// (users/{uid}) para não estourar o limite de 1MB por documento do Firestore.
async function carregarMidiaDoUsuario(uid) {
  if (!userProfile) return;
  try {
    const mediaDoc = await db.collection('userMedia').doc(uid).get();
    userProfile.fotos = mediaDoc.exists ? (mediaDoc.data().fotos || []) : [];
  } catch (e) {
    console.warn('Erro ao carregar fotos do usuário:', e);
    userProfile.fotos = [];
  }
  try {
    const audioDoc = await db.collection('userAudio').doc(uid).get();
    userProfile.audioMotivacional = audioDoc.exists ? (audioDoc.data().audioMotivacional || null) : null;
  } catch (e) {
    console.warn('Erro ao carregar áudio do usuário:', e);
    userProfile.audioMotivacional = null;
  }
}

// ===== AUTH STATE =====
// Carrega o perfil. Nunca grava nada aqui: se a leitura falhar (rede, permissão),
// mostra o aviso e deixa o usuário tentar de novo — assim um erro passageiro
// não sobrescreve um perfil existente.
async function carregarPerfil(user) {
  const msg = document.getElementById('login-message');
  msg.textContent = '';
  let doc;
  try {
    doc = await db.collection('users').doc(user.uid).get();
  } catch (e) {
    console.warn('Erro ao carregar perfil:', e);
    userProfile = null;
    msg.textContent = 'Não foi possível carregar seu perfil. Verifique a conexão e toque em Entrar para tentar de novo.';
    showScreen('screen-login');
    return;
  }
  if (!doc.exists) {
    userProfile = null;
    showScreen('screen-onboarding');
    iniciarOnboarding(false);
    return;
  }
  userProfile = doc.data();
  await carregarMidiaDoUsuario(user.uid);
  // APLICA TEMA
  if (userProfile.tema) {
    aplicarTema(userProfile.tema, userProfile.ajusteImagem || 'top');
  } else {
    carregarTemaSalvo();
  }
  showScreen('screen-dashboard');
  updatePlanBadge();
}

auth.onAuthStateChanged(async (user) => {
  document.getElementById('screen-loading').classList.remove('active');
  if (user) {
    currentUser = user;
    document.getElementById('user-email').textContent = currentUser.email;
    await carregarPerfil(user);
  } else {
    currentUser = null;
    userProfile = null;
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-message').textContent = '';
    showScreen('screen-login');
  }
});

// Preenche o <select> de "Venci fissura" (registro manual) a partir da mesma
// lista de estratégias usada em strategies.js e history.js — fonte única,
// evita que o select fique desatualizado se uma estratégia mudar.
(function preencherSelectEstrategias() {
  const select = document.getElementById('craving-strategy');
  if (!select) return;
  select.innerHTML = TODAS_ESTRATEGIAS.map(s => `<option value="${s.id}">${s.emoji} ${s.label}</option>`).join('');
})();

// ===== EVENTOS DE LOGIN =====
// Se já está autenticado mas o perfil não carregou (erro de rede), "Entrar" só tenta carregar de novo.
function entrarOuTentarDeNovo() {
  const emailVazio = !document.getElementById('login-email').value.trim();
  if (currentUser && !userProfile && emailVazio) {
    carregarPerfil(currentUser);
    return;
  }
  login();
}
document.getElementById('btn-login').addEventListener('click', () => entrarOuTentarDeNovo());
document.getElementById('login-password').addEventListener('keypress', (e) => { if (e.key === 'Enter') entrarOuTentarDeNovo(); });
document.getElementById('login-email').addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('login-password').focus(); });
document.getElementById('toggle-login-password').addEventListener('click', function() {
  const input = document.getElementById('login-password');
  togglePasswordVisibility(input, this);
});
document.getElementById('btn-register').addEventListener('click', () => register());
document.getElementById('btn-logout').addEventListener('click', () => logout());

// ===== ENGENAGEM (CONFIGURAÇÕES) =====
document.getElementById('btn-config').addEventListener('click', () => {
  if (!currentUser || !userProfile) { alert('Carregando perfil...'); return; }
  modoEdicao = true;
  showScreen('screen-onboarding');
  carregarOnboardingParaEdicao(userProfile);
});

// ===== ONBOARDING (SAIR E FINALIZAR) =====
document.getElementById('btn-onboarding-sair').addEventListener('click', () => {
  if (confirm('Descartar alterações?')) {
    if (modoEdicao) {
      modoEdicao = false;
      // desfaz a pré-visualização de tema feita durante a edição
      if (userProfile?.tema) aplicarTema(userProfile.tema, userProfile.ajusteImagem || 'top');
      showScreen('screen-dashboard');
    } else {
      auth.signOut();
      showScreen('screen-login');
    }
  }
});

const btnFinishOnboarding = document.getElementById('btn-finish-onboarding');
btnFinishOnboarding.addEventListener('click', async () => {
  if (btnFinishOnboarding.disabled) return;
  btnFinishOnboarding.disabled = true;
  try {
    const success = await finalizarOnboarding(currentUser, modoEdicao);
    if (success) {
      modoEdicao = false;
      const doc = await db.collection('users').doc(currentUser.uid).get();
      userProfile = doc.exists ? doc.data() : null;
      if (userProfile) await carregarMidiaDoUsuario(currentUser.uid);
      if (userProfile?.tema) aplicarTema(userProfile.tema, userProfile.ajusteImagem || 'top');
      showScreen('screen-dashboard');
      updatePlanBadge();
    }
  } catch (e) {
    console.error('Erro ao concluir o cadastro:', e);
    alert('Salvamos seus dados, mas não foi possível recarregar o perfil. Feche e abra o app.');
  } finally {
    btnFinishOnboarding.disabled = false;
  }
});

// ===== ESTRATÉGIAS E SOS =====
document.getElementById('btn-sos-strategies').addEventListener('click', () => {
  mostrarEstrategias(currentUser, userProfile);
  showScreen('screen-strategies');
});

document.getElementById('btn-sos-emergencia').addEventListener('click', () => {
  showScreen('screen-respiracao');
  iniciarRespiracao(currentUser, userProfile, true);
});

document.getElementById('btn-strategies-back').addEventListener('click', () => {
  voltarEstrategias();
  showScreen('screen-dashboard');
});

// ===== LIÇÕES =====
document.getElementById('btn-go-lessons').addEventListener('click', () => {
  carregarLessons();
  showScreen('screen-lessons');
});
document.getElementById('btn-lessons-back').addEventListener('click', () => showScreen('screen-dashboard'));

// ===== HISTÓRICO =====
document.getElementById('btn-go-history').addEventListener('click', () => {
  carregarHistory(currentUser);
  showScreen('screen-history');
});
document.getElementById('btn-history-back').addEventListener('click', () => showScreen('screen-dashboard'));

// ===== ÁUDIO MOTIVACIONAL =====
document.getElementById('btn-play-motivational').addEventListener('click', () => {
  if (userProfile && userProfile.audioMotivacional) {
    const audio = new Audio(userProfile.audioMotivacional);
    audio.play();
  } else {
    alert('Nenhum áudio motivacional cadastrado.');
  }
});

// ===== RESPIRAÇÃO (SAIR) =====
document.getElementById('btn-respiracao-sair').addEventListener('click', () => {
  finalizarRespiracao();
  showScreen('screen-dashboard');
});

// ===== ÁGUA (SAIR) =====
document.getElementById('btn-agua-sair').addEventListener('click', () => {
  sairAgua();
  showScreen('screen-strategies');
});

// ===== REGISTROS: FUMEI E VENCI FISSURA =====
document.getElementById('btn-register-cigarette').addEventListener('click', () => showScreen('screen-register-cigarette'));
document.getElementById('btn-cancel-cigarette').addEventListener('click', () => showScreen('screen-dashboard'));

document.getElementById('btn-save-cigarette').addEventListener('click', async () => {
  if (!currentUser) { alert('Faça login.'); return; }
  const context = document.getElementById('cig-context').value || 'não informado';
  const craving = parseInt(document.getElementById('cig-craving').value) || 0;
  const emotion = document.getElementById('cig-emotion').value || 'não informado';
  try {
    await db.collection('cigaretteLogs').add({
      userId: currentUser.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      context,
      craving,
      emotion
    });
    showScreen('screen-dashboard');
  } catch (e) {
    console.error('Erro ao salvar registro:', e);
    alert('Não foi possível salvar. Verifique a conexão e tente de novo.');
  }
});

document.getElementById('btn-register-craving').addEventListener('click', () => showScreen('screen-register-craving'));
document.getElementById('btn-cancel-craving').addEventListener('click', () => showScreen('screen-dashboard'));

document.getElementById('btn-save-craving').addEventListener('click', async () => {
  if (!currentUser) { alert('Faça login.'); return; }
  const trigger = document.getElementById('craving-trigger').value || 'não informado';
  const intensidadeLida = parseInt(document.getElementById('craving-intensity').value);
  const intensity = Number.isNaN(intensidadeLida) ? 6 : intensidadeLida;
  const strategy = document.getElementById('craving-strategy').value;
  try {
    await db.collection('cravingLogs').add({
      userId: currentUser.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      trigger,
      gatilho: null,
      origem: 'manual',
      intensity,
      strategyUsed: strategy,
      smoked: false
    });
    const counterRef = db.collection('counters').doc(currentUser.uid);
    const cost = userProfile?.costPerPack || 12.00;
    await counterRef.set({
      cigarettesAvoided: firebase.firestore.FieldValue.increment(1),
      moneySaved: firebase.firestore.FieldValue.increment(cost / 20)
    }, { merge: true });
    showScreen('screen-dashboard');
  } catch (e) {
    console.error('Erro ao salvar fissura:', e);
    alert('Não foi possível salvar. Verifique a conexão e tente de novo.');
  }
});

// ===== RECAÍDA =====
document.getElementById('btn-relapse').addEventListener('click', () => showScreen('screen-relapse'));
document.getElementById('btn-cancel-relapse').addEventListener('click', () => showScreen('screen-dashboard'));

document.getElementById('btn-save-relapse').addEventListener('click', async () => {
  if (!currentUser) { alert('Faça login.'); return; }
  const place = document.getElementById('relapse-place').value || 'não informado';
  const trigger = document.getElementById('relapse-trigger').value || 'não informado';
  const feeling = document.getElementById('relapse-feeling').value || 'não informado';
  const learn = document.getElementById('relapse-learn').value || 'não informado';
  try {
    await db.collection('relapseEvents').add({
      userId: currentUser.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      place,
      trigger,
      feeling,
      lessonLearned: learn
    });
    showScreen('screen-dashboard');
  } catch (e) {
    console.error('Erro ao salvar recaída:', e);
    alert('Não foi possível salvar. Verifique a conexão e tente de novo.');
  }
});

console.log('✅ App completo com todas as funcionalidades!');

// ===== BOTÃO "INSTALAR APP" =====
let deferredInstallPrompt = null;
const installBanner = document.getElementById('install-banner');

function jaEstaInstalado() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.matchMedia('(display-mode: minimal-ui)').matches
    || window.navigator.standalone === true; // iOS
}

function foiDispensadoRecentemente() {
  const dispensadoEm = localStorage.getItem('install_banner_dispensado_em');
  if (!dispensadoEm) return false;
  const dias = (Date.now() - Number(dispensadoEm)) / (1000 * 60 * 60 * 24);
  return dias < 14; // não incomoda de novo antes de 14 dias
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (!jaEstaInstalado() && !foiDispensadoRecentemente()) {
    installBanner.style.display = 'flex';
  }
});

document.getElementById('btn-install-app').addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  installBanner.style.display = 'none';
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
});

document.getElementById('btn-dismiss-install').addEventListener('click', () => {
  installBanner.style.display = 'none';
  localStorage.setItem('install_banner_dispensado_em', String(Date.now()));
});

window.addEventListener('appinstalled', () => {
  installBanner.style.display = 'none';
  deferredInstallPrompt = null;
});
