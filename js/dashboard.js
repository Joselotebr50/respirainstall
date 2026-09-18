// js/dashboard.js
import { db } from './firebase.js';

export async function renderDashboard(user, profile) {
  if (!user) return;
  document.getElementById('user-email').textContent = user.email;
  await atualizarContador(user.uid, profile);
}

// profileEmMemoria (opcional): quando já temos o perfil carregado, evita reler users/{uid}.
export async function atualizarContador(uid, profileEmMemoria = null) {
  if (!uid) return;
  const counterDoc = await db.collection('counters').doc(uid).get();
  const counter = counterDoc.exists ? counterDoc.data() : { daysWithout: 0, moneySaved: 0, cigarettesAvoided: 0 };

  let profile = profileEmMemoria;
  if (!profile) {
    const userDoc = await db.collection('users').doc(uid).get();
    profile = userDoc.exists ? userDoc.data() : null;
  }

  if (profile && profile.quitDate) {
    const quit = new Date(profile.quitDate);
    const now = new Date();
    const diff = Math.floor((now - quit) / (1000 * 60 * 60 * 24));
    counter.daysWithout = diff > 0 ? diff : 0;
  }

  document.getElementById('dash-days').textContent = counter.daysWithout || 0;

  const costPerPack = profile?.costPerPack || 12.00;
  const cigsAvoided = counter.cigarettesAvoided || 0;
  // Usa o valor acumulado na hora de cada registro (não muda se o preço do maço mudar depois).
  // Se ainda não houver acumulado, cai no cálculo pelo preço atual.
  const acumulado = Number(counter.moneySaved) || 0;
  const economy = acumulado > 0 ? acumulado : (costPerPack / 20) * cigsAvoided;
  document.getElementById('dash-money').textContent = `R$ ${economy.toFixed(2)}`;
  document.getElementById('dash-cigarettes-avoided').textContent = cigsAvoided;
}
