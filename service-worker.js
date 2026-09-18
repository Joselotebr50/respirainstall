// service-worker.js
// Cacheia o "esqueleto" do app (HTML, JS, imagens de fundo, ícones) e o SDK do
// Firebase para o app abrir rápido e continuar abrindo com internet ruim/instável.
// (Os DADOS — login e Firestore — continuam precisando de conexão.)
// Atenção: sempre que os arquivos do app forem atualizados, mude o CACHE_VERSION
// abaixo para forçar o navegador a buscar os arquivos novos.
const CACHE_VERSION = 'respira-v12';
const SDK_CACHE = 'respira-sdk-v1'; // SDK do Firebase (URLs com versão fixa, não muda)

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
  './js/registroFissura.js',
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
  // cache: 'reload' ignora o cache HTTP do navegador/GitHub Pages, para não
  // guardar arquivos antigos dentro da versão nova do cache.
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' })))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((n) => n !== CACHE_VERSION && n !== SDK_CACHE)
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // SDK do Firebase (gstatic, versão fixa): cache-first. Sem isso o app não abre offline,
  // pois o objeto global `firebase` nunca é carregado.
  if (url.origin === 'https://www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    event.respondWith(
      caches.open(SDK_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((resposta) => {
            if (resposta && (resposta.ok || resposta.type === 'opaque')) {
              cache.put(req, resposta.clone());
            }
            return resposta;
          });
        })
      )
    );
    return;
  }

  // Todo o resto de outros domínios (Firestore, Auth, Google Fonts...) segue direto pela rede.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((resposta) => {
          // só guarda respostas válidas (nada de 404/500 no cache)
          if (resposta && resposta.ok && resposta.type === 'basic') {
            const copia = resposta.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copia));
          }
          return resposta;
        })
        .catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
