/* ============================================================
   Ditado por voz (pt-BR) com correção automática por IA
   Uso:  Voz.liga(botao, campoInput, {sbUrl, corrige, contexto, sb})
   - Fala -> texto no campo. Ao terminar, envia pra função 'corrigir'
     que arruma ortografia/pontuação/termos de aviação.
   ============================================================ */
window.Voz = (function(){
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function suportado(){ return !!SR; }

  function liga(botao, campo, opts){
    opts = opts || {};
    if(!SR){ if(botao) botao.style.display='none'; return; }
    var rec=null, ouvindo=false, base='';
    botao.onclick = function(){
      if(ouvindo){ if(rec) rec.stop(); return; }
      rec = new SR();
      rec.lang='pt-BR'; rec.continuous=false; rec.interimResults=true; rec.maxAlternatives=1;
      base = (campo.value||'').trim();
      ouvindo=true; botao.textContent='🔴'; botao.title='Toque para parar';
      var finalTxt='', comecou=false;
      rec.onstart = function(){ comecou = true; };
      /* Em alguns aparelhos o ditado nem começa e nem dá erro — fica mudo.
         Se em 2 segundos não começou, explicamos em vez de deixar no vácuo. */
      setTimeout(function(){
        if(!comecou && ouvindo){
          ouvindo=false; botao.textContent='🎤';
          try{ rec.abort(); }catch(e){}
          if(window.toast) toast('O ditado por voz não iniciou neste aparelho. Abra pelo Chrome (não pelo app) ou digite o texto.','err');
        }
      }, 2000);
      rec.onresult = function(e){
        var interim='', fin='';
        for(var i=e.resultIndex;i<e.results.length;i++){
          var t=e.results[i][0].transcript;
          if(e.results[i].isFinal) fin+=t; else interim+=t;
        }
        if(fin) finalTxt += fin;
        campo.value = (base ? base+' ' : '') + (finalTxt+interim).replace(/\s+/g,' ').trim();
      };
      /* Antes isto falhava calado: a pessoa tocava e nada acontecia.
         Agora cada motivo tem uma explicação do que fazer. */
      rec.onerror = function(ev){
        ouvindo=false; botao.textContent='🎤'; botao.title='Ditar por voz';
        var e = ev && ev.error, msg;
        if(e==='not-allowed' || e==='permission-denied')
          msg = 'Libere o microfone: toque no cadeado ao lado do endereço → Microfone → Permitir.';
        else if(e==='service-not-allowed')
          msg = 'Este aparelho não libera o ditado por voz dentro do app. Abra pelo Chrome ou digite o texto.';
        else if(e==='network')
          msg = 'O ditado por voz precisa de internet e não conseguiu conectar. Verifique a rede.';
        else if(e==='audio-capture')
          msg = 'Nenhum microfone encontrado neste aparelho.';
        else if(e==='no-speech')
          msg = 'Não ouvi nada. Toque de novo e fale perto do aparelho.';
        else if(e==='aborted')
          msg = null;                       // a pessoa mesmo cancelou — não precisa avisar
        else
          msg = 'O ditado por voz falhou aqui ('+(e||'motivo desconhecido')+'). Pode digitar normalmente.';
        if(msg && window.toast) toast(msg,'err');
      };
      rec.onend = async function(){
        ouvindo=false; botao.textContent='🎤'; botao.title='Ditar por voz';
        var txt = (campo.value||'').trim();
        if(opts.corrige && opts.sbUrl && txt.length >= 2){
          botao.textContent='…';
          try{
            var headers = { 'Content-Type':'application/json' };
            if(opts.sb){ var s = await opts.sb.auth.getSession(); var tok = s && s.data && s.data.session && s.data.session.access_token; if(tok) headers['Authorization']='Bearer '+tok; }
            var r = await fetch(opts.sbUrl+'/functions/v1/corrigir', { method:'POST', headers:headers,
              body: JSON.stringify({ texto:txt, contexto:opts.contexto||'' }) });
            var d = await r.json().catch(function(){ return null; });
            if(r.ok && d && d.texto) campo.value = d.texto;
          }catch(e){}
          botao.textContent='🎤';
        }
      };
      try{ rec.start(); }
      catch(e){
        ouvindo=false; botao.textContent='🎤';
        if(window.toast) toast('Não foi possível ligar o microfone aqui. Pode digitar normalmente.','err');
      }
    };
  }

  /* HTML de um botão de microfone (só aparece se o aparelho suportar voz) */
  function botao(campoId, contexto){
    if(!SR) return '';
    return ' <button type="button" class="voz-btn" data-voz="'+campoId+'" data-ctx="'+(contexto||'').replace(/"/g,'')+'" '+
      'style="border:0;background:#e8f0f8;border-radius:8px;padding:2px 9px;cursor:pointer;font-size:.95rem;vertical-align:middle" '+
      'title="Ditar por voz">🎤</button>';
  }
  /* liga todos os [data-voz] que estão na tela */
  function ativarTodos(sb, sbUrl){
    document.querySelectorAll('[data-voz]').forEach(function(b){
      if(b.__vozOn) return; b.__vozOn = true;
      var campo = document.getElementById(b.dataset.voz);
      if(campo) liga(b, campo, { sbUrl:sbUrl, corrige:true, contexto:b.dataset.ctx||'', sb:sb });
    });
  }

  return { suportado:suportado, liga:liga, botao:botao, ativarTodos:ativarTodos };
})();
