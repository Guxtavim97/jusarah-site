/* ============================================================
   Reconhecimento facial pela câmera (totem da oficina)
   - Não sai foto do aparelho: só o vetor de 128 números do rosto.
   - Usa face-api (modelo roda no próprio navegador).
   Uso:
     Rosto.cadastrar(sb)          -> cadastra o rosto da pessoa logada
     Rosto.entrar(sb, SB_URL)     -> identifica e cria a sessão
   ============================================================ */
window.Rosto = (function(){
  var LIB = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.esm.js';
  var MODELO = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
  var faceapi = null, prontos = false;

  async function carrega(status){
    if(!faceapi){ if(status) status.textContent='Carregando reconhecimento…'; faceapi = await import(LIB); }
    if(!prontos){
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODELO);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODELO);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODELO);
      prontos = true;
    }
  }

  function abreCamera(titulo, dica){
    var ov = document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;z-index:9800;background:rgba(4,10,22,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;font-family:system-ui,Segoe UI,Arial,sans-serif;color:#e6eef7';
    ov.innerHTML =
      '<div style="font-weight:800;font-size:1.15rem;margin-bottom:4px">'+titulo+'</div>'+
      '<div style="color:#8fb4d6;font-size:.9rem;margin-bottom:14px">'+dica+'</div>'+
      '<div style="position:relative;width:min(74vw,340px);aspect-ratio:1/1;border-radius:50%;overflow:hidden;border:4px solid #2e86c1;box-shadow:0 0 0 6px rgba(46,134,193,.15)">'+
        '<video id="rosto-video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1)"></video>'+
      '</div>'+
      '<div id="rosto-status" style="margin-top:16px;font-size:.95rem;min-height:1.3em">Iniciando a câmera…</div>'+
      '<button id="rosto-cancel" style="margin-top:16px;border:0;border-radius:10px;padding:11px 20px;background:#26364a;color:#fff;font-size:1rem;cursor:pointer">Cancelar</button>';
    document.body.appendChild(ov);
    return {
      overlay: ov,
      video: ov.querySelector('#rosto-video'),
      status: ov.querySelector('#rosto-status'),
      cancel: ov.querySelector('#rosto-cancel'),
      fecha: function(){ try{ ov.remove(); }catch(e){} }
    };
  }

  async function capturaDescriptor(video, status){
    var opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
    for(var i=0;i<50;i++){
      var det = await faceapi.detectSingleFace(video, opts).withFaceLandmarks().withFaceDescriptor();
      if(det && det.descriptor) return Array.from(det.descriptor);
      if(status && i===6) status.textContent = 'Aproxime o rosto e olhe para a câmera…';
      await new Promise(function(r){ setTimeout(r,140); });
    }
    return null;
  }

  async function comCamera(titulo, dica, fn){
    var ui = abreCamera(titulo, dica);
    var stream = null, cancelado = false;
    ui.cancel.onclick = function(){ cancelado = true; if(stream) stream.getTracks().forEach(function(t){ t.stop(); }); ui.fecha(); };
    try{
      stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user' } });
      if(cancelado){ stream.getTracks().forEach(function(t){ t.stop(); }); return; }
      ui.video.srcObject = stream;
      await new Promise(function(res){ ui.video.onloadedmetadata = res; });
      await carrega(ui.status);
      ui.status.textContent = 'Olhe para a câmera…';
      var res = await fn(ui);
      if(stream) stream.getTracks().forEach(function(t){ t.stop(); });
      ui.fecha();
      return res;
    }catch(e){
      if(stream) stream.getTracks().forEach(function(t){ t.stop(); });
      ui.fecha();
      if(e && (e.name==='NotAllowedError' || e.name==='NotFoundError'))
        throw new Error('Não consegui usar a câmera. Permita o acesso à câmera no navegador do totem.');
      throw e;
    }
  }

  return {
    async cadastrar(sb){
      return comCamera('Cadastrar meu rosto', 'Vamos capturar algumas vezes — olhe para a câmera', async function(ui){
        var u = await sb.auth.getUser();
        var uid = u.data && u.data.user && u.data.user.id;
        if(!uid) throw new Error('Entre com a sua conta antes de cadastrar o rosto.');
        var dicas = ['Olhe de frente…', 'Vire um pouco o rosto…', 'Aproxime-se um pouco…'];
        var amostras = [];
        for(var k=0;k<3;k++){
          ui.status.textContent = dicas[k] || 'Olhe para a câmera…';
          var desc = await capturaDescriptor(ui.video, ui.status);
          if(desc) amostras.push({ user_id: uid, descriptor: desc });
          await new Promise(function(res){ setTimeout(res, 450); });
        }
        if(!amostras.length) throw new Error('Não consegui ver o rosto. Tente com mais luz e de frente.');
        var r = await sb.from('manut_rostos').insert(amostras);
        if(r.error) throw new Error(r.error.message);
        ui.status.textContent = amostras.length + ' captura(s) salvas ✓';
        await new Promise(function(res){ setTimeout(res, 800); });
        return true;
      });
    },
    async entrar(sb, SB_URL){
      return comCamera('Entrar com o rosto', 'Olhe para a câmera', async function(ui){
        var desc = await capturaDescriptor(ui.video, ui.status);
        if(!desc) throw new Error('Não consegui ver o rosto. Tente de novo.');
        ui.status.textContent = 'Reconhecendo…';
        var resp = await fetch(SB_URL+'/functions/v1/rosto-login', {
          method:'POST', headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ acao:'entrar', descriptor: desc }) });
        if(resp.status===404) throw new Error('A função de reconhecimento facial ainda não foi publicada.');
        var d = await resp.json().catch(function(){ return null; });
        if(!resp.ok || !d || d.erro) throw new Error((d && d.erro) || 'Rosto não reconhecido.');
        var v = await sb.auth.verifyOtp({ token_hash: d.token_hash, type: 'magiclink' });
        if(v.error) throw new Error(v.error.message);
        ui.status.textContent = 'Bem-vindo(a)!';
        await new Promise(function(res){ setTimeout(res, 500); });
        return true;
      });
    }
  };
})();
