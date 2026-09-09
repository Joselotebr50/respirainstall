// service-worker.js
// Cacheia o "esqueleto" do app (HTML, JS, imagens de fundo, ícones) para abrir
// instantaneamente e funcionar mesmo com internet ruim/instável.
// Atenção: sempre que os arquivos do app forem atualizados, mude o CACHE_VERSION
// abaixo para forçar o navegador a buscar os arquivos novos.
const CACHE_VERSION = 'respira-v2';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './js/app.js',
  './js/auth.js',
  './js/dashboard.js',
  './js/firebase.js',
  './js/history.js',
  './js/lessons.js',
  './js/onboarding.js',
  './js/strategies.js',
  './js/themeManager.js',
  './js/subapps/agua.js',
  './js/subapps/respiracao.js',
  './assets/fundos/fundo1.jpg',
  './assets/fundos/fundo2.jpg',
  './assets/fundos/fundo3.jpg',
  './assets/fundos/fundo4.jpg',
  './assets/fundos/fundo5.jpg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes.filter((n) => n !== CACHE_VERSION).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Só intercepta requisições do próprio app (mesmo domínio).
  // Firebase, Google Fonts, etc. seguem direto pela rede normalmente,
  // já que precisam sempre de dados atualizados / autenticação.
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copia));
          return resposta;
        })
        .catch(() => cached);
    })
  );
});
