// js/auth.js
import { auth, db } from './firebase.js';

export async function login() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  const msg = document.getElementById('login-message');
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    msg.textContent = '';
  } catch (e) {
    msg.textContent = e.message;
  }
}

export async function register() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  const msg = document.getElementById('login-message');
  if (pass.length < 6) {
    msg.textContent = 'Senha mín. 6 caracteres.';
    return;
  }
  try {
    await auth.createUserWithEmailAndPassword(email, pass);
    msg.textContent = '';
  } catch (e) {
    msg.textContent = e.message;
  }
}

export async function logout() {
  await auth.signOut();
}

export function togglePasswordVisibility(input, eyeIcon) {
  if (input.type === 'password') {
    input.type = 'text';
    eyeIcon.textContent = '🙈';
  } else {
    input.type = 'password';
    eyeIcon.textContent = '👁️';
  }
}
