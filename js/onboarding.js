// js/onboarding.js
import { db } from './firebase.js';
import { listarTemas, aplicarTema } from './themeManager.js';

let selectedTriggers = [];
let recordedAudioBase64 = null;
let mediaRecorder = null;
let audioChunks = [];
let fotosBase64 = ['', '', '', ''];

// ===== FUNÇÃO PARA CRIAR SELETOR DE TEMAS (REUTILIZÁVEL) =====
function criarSeletorTemas() {
  const container = document.getElementById('seletor-temas-mini');
  if (!container) return;
  container.innerHTML = '';
  const temas = listarTemas();
  const coresFallback = ['#3b82f6', '#0ea5e9', '#22c55e', '#f43f5e', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
  temas.forEach((t, index) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline';
    btn.textContent = t.nome;
    btn.style.backgroundColor = coresFallback[index % coresFallback.length];
    btn.style.color = 'white';
    btn.style.border = '2px solid rgba(255,255,255,0.3)';
    btn.style.padding = '10px 16px';
    btn.style.fontSize = '14px';
    btn.style.minWidth = '70px';
    btn.style.minHeight = '70px';
    btn.style.borderRadius = '12px';
    btn.style.cursor = 'pointer';
    btn.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
    const img = new Image();
    img.src = t.imagem;
    img.onload = () => {
      btn.style.backgroundImage = `url(${t.imagem})`;
      btn.style.backgroundColor = 'transparent';
      btn.style.backgroundSize = 'cover';
      btn.style.backgroundPosition = 'center';
    };
    btn.onclick = () => {
      aplicarTema(t.id, 'top');
      container.querySelectorAll('button').forEach(b => {
        b.style.borderColor = 'transparent';
        b.style.boxShadow = 'none';
      });
      btn.style.borderColor = 'var(--cor-secundaria)';
      btn.style.boxShadow = '0 0 16px var(--cor-secundaria)';
    };
    container.appendChild(btn);
  });
}

// ===== EXPORT: INICIAR ONBOARDING (CADASTRO) =====
export function iniciarOnboarding(edicao) {
  // Limpa campos se não for edição
  if (!edicao) {
    document.getElementById('onboard-cost').value = '12.00';
    document.getElementById('frase1').value = '';
    document.getElementById('frase2').value = '';
    document.getElementById('frase3').value = '';
    document.getElementById('frase4').value = '';
    recordedAudioBase64 = null;
    fotosBase64 = ['', '', '', ''];
    selectedTriggers = [];
    document.querySelectorAll('#trigger-group .chip').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.foto-thumb').forEach(thumb => {
      thumb.style.backgroundImage = '';
      thumb.innerHTML = '+';
    });
    const btnPlay = document.getElementById('btn-play-recorded');
    btnPlay.disabled = true;
    delete btnPlay.dataset.audio;
    document.getElementById('btn-start-recording').disabled = false;
    document.getElementById('btn-stop-recording').disabled = true;
    document.getElementById('onboard-audio').value = '';
  }
  criarSeletorTemas();
}

// ===== SELEÇÃO DE GATILHOS (clique nos chips) =====
document.querySelectorAll('#trigger-group .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const val = chip.dataset.value;
    const idx = selectedTriggers.indexOf(val);
    if (idx > -1) {
      selectedTriggers.splice(idx, 1);
      chip.classList.remove('selected');
    } else {
      if (selectedTriggers.length >= 4) {
        alert('Você pode escolher até 4 gatilhos.');
        return;
      }
      selectedTriggers.push(val);
      chip.classList.add('selected');
    }
  });
});

// ===== EXPORT: CARREGAR PARA EDIÇÃO (ENGENAGEM) =====
export function carregarOnboardingParaEdicao(profile) {
  if (!profile) return;
  // Preenche campos
  document.getElementById('onboard-cigarettes').value = profile.cigarettesPerDay || 10;
  document.getElementById('onboard-time').value = profile.timeToFirst || 15;
  document.getElementById('onboard-years').value = profile.yearsSmoking || 5;
  document.getElementById('onboard-cost').value = profile.costPerPack || 12.00;
  document.getElementById('onboard-quit-date').value = profile.quitMode || '7';
  // Gatilhos
  selectedTriggers = [];
  document.querySelectorAll('#trigger-group .chip').forEach(el => el.classList.remove('selected'));
  if (profile.triggers) {
    document.querySelectorAll('#trigger-group .chip').forEach(el => {
      if (profile.triggers.includes(el.dataset.value)) {
        el.classList.add('selected');
        selectedTriggers.push(el.dataset.value);
      }
    });
  }
  // Frases
  const frases = profile.frases || ['', '', '', ''];
  document.getElementById('frase1').value = frases[0] || '';
  document.getElementById('frase2').value = frases[1] || '';
  document.getElementById('frase3').value = frases[2] || '';
  document.getElementById('frase4').value = frases[3] || '';
  // Áudio
  if (profile.audioMotivacional) {
    recordedAudioBase64 = profile.audioMotivacional;
    document.getElementById('btn-play-recorded').disabled = false;
    document.getElementById('btn-play-recorded').dataset.audio = recordedAudioBase64;
  }
  // Fotos
  if (profile.fotos && profile.fotos.length) {
    profile.fotos.forEach((url, i) => {
      if (url && i < 4) {
        fotosBase64[i] = url;
        const thumb = document.querySelector(`.foto-thumb[data-index="${i}"]`);
        thumb.style.backgroundImage = `url(${url})`;
        thumb.innerHTML = `<span class="remove" data-index="${i}">✕</span>`;
      }
    });
  }
  criarSeletorTemas();
  if (profile.tema) {
    aplicarTema(profile.tema, profile.ajusteImagem || 'top');
  }
}

// ===== EXPORT: FINALIZAR ONBOARDING =====
export async function finalizarOnboarding(user, edicao) {
  if (!user) return false;

  const temaSalvo = localStorage.getItem('tema_app') || listarTemas()[0].id;
  const ajusteSalvo = 'top';
  const frases = [
    document.getElementById('frase1').value.trim(),
    document.getElementById('frase2').value.trim(),
    document.getElementById('frase3').value.trim(),
    document.getElementById('frase4').value.trim()
  ].filter(f => f !== '');
  const cigarettesPerDay = parseInt(document.getElementById('onboard-cigarettes').value) || 10;
  const timeToFirst = parseInt(document.getElementById('onboard-time').value) || 15;
  const yearsSmoking = parseInt(document.getElementById('onboard-years').value) || 5;
  const costPerPack = parseFloat(document.getElementById('onboard-cost').value) || 12.00;
  const quitMode = document.getElementById('onboard-quit-date').value || '7';

  // ÁUDIO: já vem em base64 (gravado ou enviado). Guardado num documento à parte
  // para não competir pelo limite de 1MB do documento principal do usuário.
  const audioParaSalvar = recordedAudioBase64 || null;

  // FOTOS: já vêm comprimidas (ver compressImage) e em base64. Também num documento à parte.
  const fotosParaSalvar = fotosBase64.filter(f => f);

  const dataToSave = {
    cigarettesPerDay,
    timeToFirst,
    yearsSmoking,
    costPerPack,
    quitMode,
    triggers: [...selectedTriggers],
    tema: temaSalvo,
    ajusteImagem: ajusteSalvo,
    frases,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  // Só define a data de início do plano e cria o contador na primeira vez
  // (edição de perfil não deve reiniciar um plano já em andamento)
  if (!edicao) {
    let quitDate = null;
    if (quitMode === 'today') {
      quitDate = new Date().toISOString();
    } else if (quitMode !== 'reduce') {
      const dias = parseInt(quitMode) || 7;
      const d = new Date();
      d.setDate(d.getDate() + dias);
      quitDate = d.toISOString();
    }
    if (quitDate) dataToSave.quitDate = quitDate;

    await db.collection('counters').doc(user.uid).set({
      cigarettesAvoided: 0,
      moneySaved: 0,
      daysWithout: 0
    }, { merge: true });
  }

  await db.collection('users').doc(user.uid).set(dataToSave, { merge: true });

  // Documentos separados: cada um com seu próprio limite de 1MB,
  // longe do documento principal (que é lido o tempo todo pelo app).
  await db.collection('userMedia').doc(user.uid).set({ fotos: fotosParaSalvar }, { merge: true });
  await db.collection('userAudio').doc(user.uid).set({ audioMotivacional: audioParaSalvar }, { merge: true });

  return true;
}

// ===== ÁUDIO: GRAVAÇÃO PELO MICROFONE =====
// Limite de 30s e bitrate baixo: o áudio vira base64 e é salvo no Firestore,
// que tem limite de 1MB por documento. Isso mantém o arquivo bem pequeno (~100-150KB).
const DURACAO_MAX_GRAVACAO_MS = 30000;
let recordingAutoStopTimer = null;

document.getElementById('btn-start-recording').addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    let options = { audioBitsPerSecond: 32000 };
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      options.mimeType = 'audio/webm;codecs=opus';
    }
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.addEventListener('dataavailable', (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    });
    mediaRecorder.addEventListener('stop', () => {
      clearTimeout(recordingAutoStopTimer);
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        recordedAudioBase64 = reader.result;
        const btnPlay = document.getElementById('btn-play-recorded');
        btnPlay.disabled = false;
        btnPlay.dataset.audio = recordedAudioBase64;
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach(track => track.stop());
    });
    mediaRecorder.start();
    document.getElementById('btn-start-recording').disabled = true;
    document.getElementById('btn-stop-recording').disabled = false;
    recordingAutoStopTimer = setTimeout(() => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        document.getElementById('btn-start-recording').disabled = false;
        document.getElementById('btn-stop-recording').disabled = true;
        alert('Gravação encerrada automaticamente (limite de 30 segundos).');
      }
    }, DURACAO_MAX_GRAVACAO_MS);
  } catch (e) {
    alert('Não foi possível acessar o microfone: ' + e.message);
  }
});

document.getElementById('btn-stop-recording').addEventListener('click', () => {
  clearTimeout(recordingAutoStopTimer);
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  document.getElementById('btn-start-recording').disabled = false;
  document.getElementById('btn-stop-recording').disabled = true;
});

// ===== ÁUDIO: OUVIR GRAVAÇÃO ATUAL =====
document.getElementById('btn-play-recorded').addEventListener('click', function () {
  const audioData = this.dataset.audio || recordedAudioBase64;
  if (audioData) {
    new Audio(audioData).play();
  }
});

// ===== ÁUDIO: UPLOAD DE ARQUIVO =====
document.getElementById('btn-upload-audio').addEventListener('click', () => {
  document.getElementById('onboard-audio').click();
});

document.getElementById('onboard-audio').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 700 * 1024) {
    alert('Áudio muito grande. Escolha um arquivo de até 700KB (prefira gravar direto pelo app).');
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onloadend = () => {
    recordedAudioBase64 = reader.result;
    const btnPlay = document.getElementById('btn-play-recorded');
    btnPlay.disabled = false;
    btnPlay.dataset.audio = recordedAudioBase64;
  };
  reader.readAsDataURL(file);
});

// ===== ÁUDIO: DESCARTAR =====
document.getElementById('btn-discard-audio').addEventListener('click', () => {
  recordedAudioBase64 = null;
  const btnPlay = document.getElementById('btn-play-recorded');
  btnPlay.disabled = true;
  delete btnPlay.dataset.audio;
  document.getElementById('onboard-audio').value = '';
});

// ===== FOTOS: SELECIONAR / SUBSTITUIR =====
let fotoIndiceAtual = 0;

document.querySelectorAll('.foto-thumb').forEach(thumb => {
  thumb.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove')) return; // clique no X é tratado à parte
    fotoIndiceAtual = parseInt(thumb.dataset.index);
    document.getElementById('foto-input').click();
  });
});

// Redimensiona e comprime a imagem via canvas antes de virar base64,
// porque vamos guardar isso no Firestore (limite de 1MB por documento).
function compressImage(file, maxDim = 640, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else if (height >= width && height > maxDim) {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

document.getElementById('foto-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    alert('Imagem muito grande. Escolha um arquivo de até 8MB (ela será comprimida automaticamente).');
    return;
  }
  try {
    const comprimida = await compressImage(file);
    fotosBase64[fotoIndiceAtual] = comprimida;
    const thumb = document.querySelector(`.foto-thumb[data-index="${fotoIndiceAtual}"]`);
    thumb.style.backgroundImage = `url(${comprimida})`;
    thumb.innerHTML = `<span class="remove" data-index="${fotoIndiceAtual}">✕</span>`;
  } catch (err) {
    alert('Não foi possível processar essa imagem. Tente outra.');
  }
});

// ===== FOTOS: REMOVER (delegação, pois o botão "✕" é criado dinamicamente) =====
document.getElementById('foto-grid').addEventListener('click', (e) => {
  if (!e.target.classList.contains('remove')) return;
  e.stopPropagation();
  const index = parseInt(e.target.dataset.index);
  fotosBase64[index] = '';
  const thumb = document.querySelector(`.foto-thumb[data-index="${index}"]`);
  thumb.style.backgroundImage = '';
  thumb.innerHTML = '+';
});
