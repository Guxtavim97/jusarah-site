// Service worker mínimo — só para o app ser instalável (PWA).
// NÃO faz cache do HTML de propósito: o app é data-driven e atualiza
// sozinho pela Vercel; cachear deixaria versão velha na tela.
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(e){ /* passthrough: o navegador resolve normalmente */ });
