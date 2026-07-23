/* ============================================================
   Assistente de IA da Jusarah — conversa com voz e foto.
   Uso: Assistente.init(sb, SB_URL, { nome:'Sarah', contexto:'mecanica' })
   - fala com a Edge Function `assistente` (o "cérebro"), que guarda
     a chave da IA em segredo. Enquanto a função não estiver no ar,
     o painel funciona e avisa que o cérebro ainda não foi ligado.
   ============================================================ */
(function(){
  var A = { sb:null, url:'', nome:'Assistente', contexto:'geral', falar:true, ouvindo:false, rec:null, pensando:false, imgPend:null };

  var CSS = ''
  + '.ia-fab{position:fixed;right:18px;bottom:18px;z-index:9000;width:60px;height:60px;border:0;'
  +   'border-radius:50%;cursor:pointer;background:linear-gradient(145deg,#1B6E3B,#0d3d20);'
  +   'color:#fff;box-shadow:0 10px 26px rgba(12,40,25,.4);display:grid;place-items:center;'
  +   'font-size:1.5rem;transition:transform .15s}'
  + '.ia-fab:hover{transform:scale(1.06)}'
  + '.ia-wrap{position:fixed;right:18px;bottom:18px;z-index:9001;width:380px;max-width:calc(100vw - 28px);'
  +   'height:560px;max-height:calc(100vh - 36px);background:#0b1a2e;border:1px solid rgba(127,212,255,.18);'
  +   'border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.5);display:none;flex-direction:column;overflow:hidden}'
  + '.ia-wrap.open{display:flex}'
  + '.ia-hd{display:flex;align-items:center;gap:11px;padding:14px 15px;background:linear-gradient(135deg,#123f6b,#0d3d20);color:#fff}'
  + '.ia-hd .av{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.15);display:grid;place-items:center;font-size:1.1rem;flex:none}'
  + '.ia-hd b{font-size:1rem;line-height:1.1}'
  + '.ia-hd span{font-size:.72rem;color:#a9d8bf;display:block}'
  + '.ia-hd .x{margin-left:auto;background:none;border:0;color:#cfe3f5;font-size:1.4rem;cursor:pointer;line-height:1}'
  + '.ia-hd .spk{background:none;border:1px solid rgba(255,255,255,.25);color:#fff;border-radius:8px;'
  +   'cursor:pointer;font-size:.9rem;width:32px;height:30px}'
  + '.ia-hd .spk.off{opacity:.4}'
  + '.ia-body{flex:1;overflow-y:auto;padding:15px;display:flex;flex-direction:column;gap:11px;background:#0b1a2e}'
  + '.ia-msg{max-width:86%;padding:10px 13px;border-radius:14px;font-size:.92rem;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}'
  + '.ia-msg.u{align-self:flex-end;background:#1e5a8a;color:#fff;border-bottom-right-radius:4px}'
  + '.ia-msg.a{align-self:flex-start;background:#13253d;color:#e6eef7;border:1px solid rgba(127,212,255,.14);border-bottom-left-radius:4px}'
  + '.ia-msg.sys{align-self:center;background:rgba(255,196,77,.12);color:#ffd98a;font-size:.8rem;text-align:center;border-radius:10px}'
  + '.ia-msg img.foto{display:block;max-width:100%;border-radius:9px;margin-bottom:6px}'
  + '.ia-msg .font{display:block;margin-top:6px;font-size:.72rem;color:#8fb4d6;font-style:italic}'
  + '.ia-typ{align-self:flex-start;display:flex;gap:4px;padding:12px 14px}'
  + '.ia-typ i{width:7px;height:7px;border-radius:50%;background:#4a9fd4;animation:iablink 1.2s infinite}'
  + '.ia-typ i:nth-child(2){animation-delay:.2s}.ia-typ i:nth-child(3){animation-delay:.4s}'
  + '@keyframes iablink{0%,60%,100%{opacity:.25}30%{opacity:1}}'
  + '.ia-sug{display:flex;gap:7px;flex-wrap:wrap;padding:0 15px 10px;background:#0b1a2e}'
  + '.ia-sug button{background:#13253d;border:1px solid rgba(127,212,255,.18);color:#bcd6ee;'
  +   'border-radius:999px;padding:7px 12px;font-size:.76rem;cursor:pointer;text-align:left}'
  + '.ia-sug button:hover{border-color:#4a9fd4}'
  + '.ia-prev{display:none;align-items:center;gap:10px;padding:8px 12px;background:#0d1f36;border-top:1px solid rgba(127,212,255,.1)}'
  + '.ia-prev.on{display:flex}'
  + '.ia-prev img{width:44px;height:44px;object-fit:cover;border-radius:8px;flex:none}'
  + '.ia-prev span{flex:1;font-size:.8rem;color:#bcd6ee}'
  + '.ia-prev .rm{background:none;border:0;color:#8fb4d6;cursor:pointer;font-size:1.1rem}'
  + '.ia-ft{display:flex;align-items:center;gap:7px;padding:11px;background:#0d1f36;border-top:1px solid rgba(127,212,255,.12)}'
  + '.ia-ft input.ia-in{flex:1;background:#0b1a2e;border:1px solid rgba(127,212,255,.2);border-radius:11px;'
  +   'padding:11px 13px;color:#eaf2fb;font-size:.92rem;font-family:inherit}'
  + '.ia-ft input.ia-in:focus{outline:none;border-color:#4a9fd4}'
  + '.ia-ft button{flex:none;width:42px;height:42px;border:0;border-radius:11px;cursor:pointer;font-size:1.1rem;display:grid;place-items:center}'
  + '.ia-cam{background:#13253d;color:#cfe3f5}'
  + '.ia-mic{background:#13253d;color:#cfe3f5}'
  + '.ia-mic.rec{background:#c0392b;color:#fff;animation:iapulse 1s infinite}'
  + '@keyframes iapulse{0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,.5)}50%{box-shadow:0 0 0 8px rgba(192,57,43,0)}}'
  + '.ia-send{background:#1B6E3B;color:#fff}'
  + '@media(max-width:480px){.ia-wrap{right:0;bottom:0;width:100vw;height:100dvh;max-height:none;border-radius:0}}';

  function el(tag, cls, html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var SUGEST = {
    mecanica:[
      'Quais aeronaves estão em manutenção agora?',
      'Quantas OS foram encerradas este mês?',
      'Quais OS estão paradas há mais tempo?'
    ],
    agro:[
      'Quantas propostas foram aceitas este mês?',
      'Qual a receita das propostas aceitas?'
    ],
    geral:['O que você consegue me dizer sobre o sistema?']
  };

  var wrap, body, input, micBtn, camBtn, spkBtn, fab, fileInput, prev;

  A.init = function(sb, url, opts){
    opts = opts || {};
    A.sb = sb; A.url = (url||'').replace(/\/+$/,''); A.nome = opts.nome || 'Assistente'; A.contexto = opts.contexto || 'geral';
    injeta();
  };

  function injeta(){
    var st = el('style'); st.textContent = CSS; document.head.appendChild(st);

    fab = el('button','ia-fab','✨');
    fab.title = 'Falar com ' + A.nome;
    fab.onclick = abre;
    document.body.appendChild(fab);

    wrap = el('div','ia-wrap');
    wrap.innerHTML =
      '<div class="ia-hd"><span class="av">✨</span>'+
        '<div><b>'+esc(A.nome)+'</b><span>assistente da Jusarah</span></div>'+
        '<button class="spk" title="Ler as respostas em voz alta">🔊</button>'+
        '<button class="x" title="Fechar">×</button></div>'+
      '<div class="ia-body"></div>'+
      '<div class="ia-sug"></div>'+
      '<div class="ia-prev"><img alt=""><span>Foto anexada</span><button class="rm" title="Remover">✕</button></div>'+
      '<div class="ia-ft">'+
        '<button class="ia-cam" title="Tirar/anexar foto">📷</button>'+
        '<button class="ia-mic" title="Falar">🎤</button>'+
        '<input type="text" class="ia-in" placeholder="Pergunte, fale ou tire uma foto…" autocomplete="off">'+
        '<button class="ia-send" title="Enviar">➤</button>'+
      '</div>'+
      '<input type="file" class="ia-file" accept="image/*" capture="environment" style="display:none">';
    document.body.appendChild(wrap);

    body     = wrap.querySelector('.ia-body');
    input    = wrap.querySelector('.ia-in');
    micBtn   = wrap.querySelector('.ia-mic');
    camBtn   = wrap.querySelector('.ia-cam');
    spkBtn   = wrap.querySelector('.spk');
    prev     = wrap.querySelector('.ia-prev');
    fileInput= wrap.querySelector('.ia-file');

    wrap.querySelector('.x').onclick = function(){ wrap.classList.remove('open'); pararVoz(); };
    wrap.querySelector('.ia-send').onclick = enviar;
    input.addEventListener('keydown', function(e){ if(e.key==='Enter') enviar(); });
    micBtn.onclick = toggleMic;
    camBtn.onclick = function(){ fileInput.click(); };
    fileInput.onchange = function(e){ var f = e.target.files && e.target.files[0]; if(f) comprime(f, function(im){ A.imgPend = im; mostraPrev(im.url); }); };
    prev.querySelector('.rm').onclick = limpaFoto;
    spkBtn.onclick = function(){ A.falar = !A.falar; spkBtn.classList.toggle('off', !A.falar); if(!A.falar) pararVoz(); };

    montaSugestoes();
    saudacao();
  }

  function abre(){
    wrap.classList.add('open');
    setTimeout(function(){ input.focus(); }, 100);
  }

  function montaSugestoes(){
    var box = wrap.querySelector('.ia-sug');
    var lista = SUGEST[A.contexto] || SUGEST.geral;
    box.innerHTML = '';
    lista.forEach(function(q){
      var b = el('button', null, esc(q));
      b.onclick = function(){ input.value = q; enviar(); };
      box.appendChild(b);
    });
  }

  var saudou = false;
  function saudacao(){
    if(saudou) return; saudou = true;
    addMsg('a', 'Oi! Sou a assistente da Jusarah. Pergunte por texto, fale no microfone 🎤 ou tire uma foto 📷 de uma peça.');
  }

  function addMsg(tipo, texto, fonte, imgUrl){
    var m = el('div','ia-msg '+tipo);
    if(imgUrl){ var im = el('img'); im.className='foto'; im.src=imgUrl; im.alt=''; m.appendChild(im); }
    if(texto){ var tx = document.createElement('div'); tx.textContent = texto; m.appendChild(tx); }
    if(fonte){ var f = el('span','font','Fonte: '+esc(fonte)); m.appendChild(f); }
    body.appendChild(m); body.scrollTop = body.scrollHeight;
    return m;
  }
  function typing(on){
    var t = body.querySelector('.ia-typ');
    if(on && !t){ t=el('div','ia-typ','<i></i><i></i><i></i>'); body.appendChild(t); body.scrollTop=body.scrollHeight; }
    else if(!on && t){ t.remove(); }
  }

  /* ---------- foto: compressão + preview ---------- */
  function comprime(file, cb){
    var r = new FileReader();
    r.onload = function(e){
      var im = new Image();
      im.onload = function(){
        var max = 1024, w = im.width, h = im.height;
        if(w > h && w > max){ h = Math.round(h*max/w); w = max; }
        else if(h >= w && h > max){ w = Math.round(w*max/h); h = max; }
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(im, 0, 0, w, h);
        var url = c.toDataURL('image/jpeg', 0.7);
        cb({ url:url, media_type:'image/jpeg', data:url.split(',')[1] });
      };
      im.src = e.target.result;
    };
    r.readAsDataURL(file);
  }
  function mostraPrev(url){ prev.querySelector('img').src = url; prev.classList.add('on'); }
  function limpaFoto(){ A.imgPend = null; prev.classList.remove('on'); prev.querySelector('img').src=''; fileInput.value=''; }

  function enviar(){
    var q = (input.value||'').trim();
    if((!q && !A.imgPend) || A.pensando) return;
    input.value = '';
    var img = A.imgPend; A.imgPend = null; prev.classList.remove('on'); fileInput.value='';
    addMsg('u', q, null, img ? img.url : null);
    pergunta(q, img);
  }

  async function pergunta(q, img){
    A.pensando = true; typing(true);
    try{
      var sess = await A.sb.auth.getSession();
      var token = sess && sess.data && sess.data.session ? sess.data.session.access_token : null;
      if(!token){ typing(false); addMsg('sys','Você precisa estar logado para usar o assistente.'); A.pensando=false; return; }

      var payload = { pergunta:q, contexto:A.contexto };
      if(img) payload.imagem = { media_type:img.media_type, data:img.data };

      var resp = await fetch(A.url + '/functions/v1/assistente', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
        body: JSON.stringify(payload)
      });

      typing(false);
      if(resp.status === 404){
        addMsg('sys','O cérebro do assistente ainda não foi publicado. A conversa já funciona — falta ligar a IA (publicar a função e a chave).');
        A.pensando=false; return;
      }
      var data = await resp.json().catch(function(){ return null; });
      if(!resp.ok || !data){
        addMsg('sys', (data && data.erro) ? data.erro : 'Não consegui responder agora. Tente de novo em instantes.');
        A.pensando=false; return;
      }
      addMsg('a', data.resposta || '(sem resposta)', data.fonte);
      if(A.falar) fala(data.resposta || '');
    }catch(err){
      typing(false);
      addMsg('sys','O cérebro do assistente ainda não está ligado. Assim que publicarmos a função e a chave, ele passa a responder.');
    }
    A.pensando = false;
  }

  /* ---------- voz: reconhecimento (fala -> texto) ---------- */
  function toggleMic(){
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SR){ addMsg('sys','Este navegador não suporta ditado por voz. Você pode digitar normalmente.'); return; }
    if(A.ouvindo){ pararMic(); return; }
    A.rec = new SR();
    A.rec.lang = 'pt-BR'; A.rec.interimResults = true; A.rec.continuous = false;
    A.ouvindo = true; micBtn.classList.add('rec');
    A.rec.onresult = function(e){
      var t = '';
      for(var i=0;i<e.results.length;i++){ t += e.results[i][0].transcript; }
      input.value = t;
    };
    A.rec.onerror = function(){ pararMic(); };
    A.rec.onend = function(){
      micBtn.classList.remove('rec'); A.ouvindo=false;
      if((input.value||'').trim() || A.imgPend) enviar();
    };
    try{ A.rec.start(); }catch(e){ pararMic(); }
  }
  function pararMic(){ if(A.rec){ try{ A.rec.stop(); }catch(e){} } A.ouvindo=false; micBtn.classList.remove('rec'); }

  /* ---------- voz: síntese (texto -> fala) ---------- */
  function fala(txt){
    if(!('speechSynthesis' in window) || !txt) return;
    pararVoz();
    var u = new SpeechSynthesisUtterance(txt.replace(/\s+/g,' ').slice(0,600));
    u.lang = 'pt-BR'; u.rate = 1.02;
    window.speechSynthesis.speak(u);
  }
  function pararVoz(){ if('speechSynthesis' in window) window.speechSynthesis.cancel(); }

  window.Assistente = A;
})();
