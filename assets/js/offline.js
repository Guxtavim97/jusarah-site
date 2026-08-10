/* ============================================================
   Trabalho offline — fila de registros que sobe sozinha
   - Guarda anotações/pendências/fotos no aparelho (IndexedDB) quando
     não há internet, e envia sozinho quando a conexão volta.
   - Só registros que SOMAM (append). Ações que mudam o estado legal
     (executar/conferir/assinar) continuam online, por segurança.
   Uso:
     Offline.init(sb)
     var res = await Offline.exec('foto', {caminho, ctype, blob, row})
        -> {ok:true}            enviado agora
        -> {ok:true, offline:true} salvo no aparelho (vai sincronizar)
        -> {ok:false, erro}     erro de regra (mostrar na tela)
   ============================================================ */
window.Offline = (function(){
  var DBN='jusarah_offline', STORE='fila', sb=null, sincronizando=false, timer=null;

  function abreDB(){
    return new Promise(function(res, rej){
      var req = indexedDB.open(DBN, 1);
      req.onupgradeneeded = function(){
        var db = req.result;
        if(!db.objectStoreNames.contains(STORE)){
          db.createObjectStore(STORE, { keyPath:'id', autoIncrement:true });
        }
      };
      req.onsuccess = function(){ res(req.result); };
      req.onerror   = function(){ rej(req.error); };
    });
  }
  function store(mode){ return abreDB().then(function(db){ return db.transaction(STORE, mode).objectStore(STORE); }); }
  function guarda(op){ return new Promise(function(res, rej){ store('readwrite').then(function(s){ var r=s.add(op); r.onsuccess=function(){res(r.result);}; r.onerror=function(){rej(r.error);}; }); }); }
  function todos(){ return new Promise(function(res){ store('readonly').then(function(s){ var r=s.getAll(); r.onsuccess=function(){ res((r.result||[]).sort(function(a,b){ return a.criado_em-b.criado_em; })); }; r.onerror=function(){ res([]); }; }).catch(function(){ res([]); }); }); }
  function remove(id){ return new Promise(function(res){ store('readwrite').then(function(s){ var r=s.delete(id); r.onsuccess=function(){res();}; r.onerror=function(){res();}; }); }); }
  function marcaErro(id, msg){ return new Promise(function(res){ store('readwrite').then(function(s){ var g=s.get(id); g.onsuccess=function(){ var it=g.result; if(it){ it.erro=msg; s.put(it); } res(); }; g.onerror=function(){res();}; }); }); }
  function conta(){ return todos().then(function(t){ return { pend:t.filter(function(x){return !x.erro;}).length, err:t.filter(function(x){return x.erro;}).length, total:t.length }; }); }

  var EXEC = {
    tarefa_nova:    function(p){ return sb.from('manut_os_tarefas').insert(p.row); },
    pendencia_nova: function(p){ return sb.from('manut_os_pendencias').insert(p.row); },
    foto: async function(p){
      var up = await sb.storage.from('manutencao').upload(p.caminho, p.blob, { contentType:p.ctype });
      if(up.error) return { error: up.error };
      return sb.from('manut_os_fotos').insert(p.row);
    }
  };
  async function roda(op){ try{ var f=EXEC[op.tipo]; if(!f) return {error:{message:'tipo desconhecido'}}; return await f(op.payload); }catch(e){ return {error:e}; } }
  function ehRede(err){ if(!err) return false; var m=(err.message||String(err)||'').toLowerCase(); return err.name==='TypeError' || m.indexOf('fetch')>=0 || m.indexOf('network')>=0 || m.indexOf('failed to')>=0 || m.indexOf('load failed')>=0; }

  async function badge(){
    if(!window.__net) return;
    var c = await conta();
    if(!navigator.onLine){ window.__net(c.pend ? ('⚠️ Sem internet — '+c.pend+' registro(s) salvo(s) aqui') : '⚠️ Sem internet — pode continuar, sincroniza ao voltar', '#7d2020'); return; }
    if(sincronizando){ window.__net('📤 Sincronizando…', '#1e5a8a'); return; }
    if(c.err){ window.__net('⚠️ '+c.err+' registro(s) não sincronizaram', '#7d2020'); return; }
    if(c.pend){ window.__net('📤 '+c.pend+' aguardando envio…', '#1e5a8a'); return; }
    window.__net('');
  }

  async function sincroniza(){
    if(!navigator.onLine || sincronizando || !sb) return;
    var itens = (await todos()).filter(function(x){ return !x.erro; });
    if(!itens.length){ badge(); return; }
    sincronizando = true; badge();
    for(var i=0;i<itens.length;i++){
      var it = itens[i];
      var r = await roda(it);
      if(!r || !r.error){ await remove(it.id); }
      else if(ehRede(r.error)){ break; }              // sem rede: para e tenta depois
      else { await marcaErro(it.id, r.error.message || 'erro'); }  // erro de regra: guarda e segue
    }
    sincronizando = false; await badge();
    if(window.__aposSync){ try{ window.__aposSync(); }catch(e){} }
  }

  return {
    init: function(cliente){
      sb = cliente;
      window.addEventListener('online',  function(){ badge(); sincroniza(); });
      window.addEventListener('offline', function(){ badge(); });
      if(!timer) timer = setInterval(function(){ if(navigator.onLine) sincroniza(); }, 20000);
      badge(); if(navigator.onLine) sincroniza();
    },
    exec: async function(tipo, payload){
      if(navigator.onLine){
        var r = await roda({ tipo:tipo, payload:payload });
        if(!r || !r.error){ badge(); return { ok:true }; }
        if(ehRede(r.error)){ await guarda({ tipo:tipo, payload:payload, criado_em:Date.now() }); badge(); return { ok:true, offline:true }; }
        return { ok:false, erro: r.error.message || 'erro' };
      }
      await guarda({ tipo:tipo, payload:payload, criado_em:Date.now() });
      badge();
      return { ok:true, offline:true };
    },
    conta: conta,
    sincroniza: sincroniza,
    badge: badge
  };
})();
