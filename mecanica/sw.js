// Service worker do /mecanica — permite abrir OFFLINE + mantém atualizado.
// Estratégia:
//  - HTML (navegação): rede primeiro (sempre fresco online), cai no cache se offline.
//  - JS/CSS/imagens e libs de CDN: cache primeiro, atualizando em segundo plano.
//  - Supabase (dados/escrita): NUNCA cacheia — passa direto (offline falha e o app trata).
var CACHE = 'pjaero-mec-v5';
var SHELL = [
  '/mecanica/',
  '/mecanica/index.html',
  '/assets/js/qr.js',
  '/assets/js/assistente.js',
  '/assets/js/rosto.js',
  '/assets/img/pj-logo.png',
  '/mecanica/icon-192.png'
];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL).catch(function(){}); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;                 // escrita (POST/PATCH/DELETE) passa direto
  var url = new URL(req.url);
  if(url.hostname.indexOf('supabase.co') >= 0){
    // Leitura de dados (REST): rede primeiro, e guarda a última resposta
    // pra mostrar offline. Storage/auth passam direto (não cacheia).
    if(url.pathname.indexOf('/rest/v1/') >= 0){
      e.respondWith(
        fetch(req).then(function(res){
          if(res && res.ok){ var c=res.clone(); caches.open(CACHE).then(function(cc){ cc.put(req, c); }); }
          return res;
        }).catch(function(){ return caches.match(req); })
      );
    }
    return;
  }

  var aceita = req.headers.get('accept') || '';
  if(req.mode === 'navigate' || aceita.indexOf('text/html') >= 0){
    // HTML: rede primeiro (sem cache do navegador), cache só se offline
    e.respondWith(
      fetch(req.url, { cache: 'no-store' }).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put('/mecanica/index.html', copy); });
        return res;
      }).catch(function(){
        return caches.match('/mecanica/index.html').then(function(h){ return h || caches.match('/mecanica/'); });
      })
    );
    return;
  }

  // estáticos e libs de CDN: cache primeiro, atualiza em segundo plano
  e.respondWith(
    caches.match(req).then(function(hit){
      var rede = fetch(req).then(function(res){
        if(res && (res.ok || res.type === 'opaque')){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){ return hit; });
      return hit || rede;
    })
  );
});
