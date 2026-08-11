// Service worker do /mecanica — permite abrir OFFLINE + mantém atualizado.
// Estratégia:
//  - HTML (navegação): rede primeiro (sempre fresco online), cai no cache se offline.
//  - JS/CSS/imagens e libs de CDN: cache primeiro, atualizando em segundo plano.
//  - Supabase (dados/escrita): NUNCA cacheia — passa direto (offline falha e o app trata).
var CACHE = 'pjaero-mec-v13';
var SHELL = [
  '/mecanica/',
  '/mecanica/index.html',
  '/assets/js/supabase.js',
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

/* ============================================================
   NOTIFICAÇÕES NO CELULAR (push)
   Chegam mesmo com o app fechado. O servidor manda o aviso,
   o service worker mostra, e o toque abre a OS certa.
   ============================================================ */
self.addEventListener('push', function(e){
  var d = {};
  try{ d = e.data ? e.data.json() : {}; }catch(err){ d = { titulo:'PJ AERO CENTRO', corpo: e.data ? e.data.text() : '' }; }
  var titulo = d.titulo || 'PJ AERO CENTRO';
  var opcoes = {
    body: d.corpo || '',
    icon: '/mecanica/icon-192.png',
    badge: '/mecanica/icon-192.png',
    tag: d.os_id ? ('os-' + d.os_id) : undefined,   // avisos da mesma OS se substituem
    renotify: true,
    data: { os_id: d.os_id || null, url: '/mecanica/' }
  };
  e.waitUntil(self.registration.showNotification(titulo, opcoes));
});

/* Tocar no aviso: traz o app para a frente e abre a OS */
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var osId = e.notification.data && e.notification.data.os_id;
  var destino = '/mecanica/' + (osId ? ('?os=' + osId) : '');
  e.waitUntil(
    self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(lista){
      for(var i=0;i<lista.length;i++){
        var c = lista[i];
        if(c.url.indexOf('/mecanica') >= 0 && 'focus' in c){
          if(osId && c.navigate) { try{ c.navigate(destino); }catch(err){} }
          return c.focus();
        }
      }
      if(self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});
