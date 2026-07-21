/* ============================================================
   QR CODE — gerado no proprio navegador (modo byte, correcao L).
   Compartilhado entre o painel da oficina (/mecanica) e a pagina
   do proprietario (/os/TOKEN). Nada e enviado a servico externo:
   o token da OS e a chave de acesso do cliente.
   ============================================================ */
var QR = (function(){
  var EXP = new Array(512), LOG = new Array(256);
  (function(){ var x = 1;
    for(var i=0;i<255;i++){ EXP[i]=x; LOG[x]=i; x <<= 1; if(x & 0x100) x ^= 0x11d; }
    for(var j=255;j<512;j++) EXP[j] = EXP[j-255];
  })();
  function mul(a,b){ return (a===0||b===0) ? 0 : EXP[LOG[a]+LOG[b]]; }

  /* versões de bloco único (sem intercalação) — suficiente pro nosso link */
  var VER = { 4:{size:33,dados:80,ec:20,al:[6,26]}, 6:{size:41,dados:136,ec:36,al:[6,34]} };

  function polGerador(grau){
    var p = [1];
    for(var i=0;i<grau;i++){
      var n = new Array(p.length+1); for(var k=0;k<n.length;k++) n[k]=0;
      for(var j=0;j<p.length;j++){ n[j] ^= p[j]; n[j+1] ^= mul(p[j], EXP[i]); }
      p = n;
    }
    return p;
  }
  function corrigeErro(dados, ecLen){
    var g = polGerador(ecLen), r = new Array(ecLen);
    for(var i=0;i<ecLen;i++) r[i]=0;
    for(var d=0; d<dados.length; d++){
      var f = dados[d] ^ r[0];
      r.shift(); r.push(0);
      if(f !== 0) for(var j=0;j<ecLen;j++) r[j] ^= mul(g[j+1], f);
    }
    return r;
  }
  function formato(mask){                    /* correção L = 01 */
    var d = (1<<3) | mask, rem = d;
    for(var i=0;i<10;i++) rem = (rem<<1) ^ (((rem>>>9) & 1) * 0x537);
    return (((d<<10) | rem) ^ 0x5412) & 0x7fff;
  }

  function ehFuncao(v, x, y){
    var s = v.size;
    if((x<9&&y<9) || (x>=s-8&&y<9) || (x<9&&y>=s-8)) return true;   /* localizadores + formato */
    if(x===6 || y===6) return true;                                  /* linhas de tempo */
    for(var i=0;i<v.al.length;i++) for(var j=0;j<v.al.length;j++){
      var cx=v.al[i], cy=v.al[j];
      if((cx===6&&cy===6)||(cx===6&&cy===v.al[v.al.length-1])||(cx===v.al[v.al.length-1]&&cy===6)) continue;
      if(Math.abs(x-cx)<=2 && Math.abs(y-cy)<=2) return true;        /* alinhamento */
    }
    return false;
  }

  function penalidade(m, s){
    var p = 0, i, j, run, cor;
    for(i=0;i<s;i++){                                   /* linhas e colunas iguais */
      run=1; cor=m[i][0];
      for(j=1;j<s;j++){ if(m[i][j]===cor) run++; else { if(run>=5) p+=3+(run-5); cor=m[i][j]; run=1; } }
      if(run>=5) p+=3+(run-5);
      run=1; cor=m[0][i];
      for(j=1;j<s;j++){ if(m[j][i]===cor) run++; else { if(run>=5) p+=3+(run-5); cor=m[j][i]; run=1; } }
      if(run>=5) p+=3+(run-5);
    }
    for(i=0;i<s-1;i++) for(j=0;j<s-1;j++)               /* blocos 2x2 */
      if(m[i][j]===m[i][j+1] && m[i][j]===m[i+1][j] && m[i][j]===m[i+1][j+1]) p+=3;
    var escuro=0;
    for(i=0;i<s;i++) for(j=0;j<s;j++) if(m[i][j]) escuro++;
    p += Math.floor(Math.abs(escuro*100/(s*s) - 50)/5)*10;
    return p;
  }

  function gerar(texto){
    var bytes = [], i;
    for(i=0;i<texto.length;i++){
      var c = texto.charCodeAt(i);
      if(c<128) bytes.push(c);
      else if(c<2048){ bytes.push(192|(c>>6), 128|(c&63)); }
      else { bytes.push(224|(c>>12), 128|((c>>6)&63), 128|(c&63)); }
    }
    var chave = bytes.length + 2 <= 80 ? 4 : 6;         /* escolhe a versão */
    var v = VER[chave];
    if(bytes.length + 2 > v.dados) return null;         /* longo demais */

    var bits = [];
    function push(val, n){ for(var k=n-1;k>=0;k--) bits.push((val>>k)&1); }
    push(4,4); push(bytes.length,8);
    for(i=0;i<bytes.length;i++) push(bytes[i],8);
    var max = v.dados*8;
    for(i=0;i<4 && bits.length<max;i++) bits.push(0);   /* terminador */
    while(bits.length % 8) bits.push(0);
    var dados = [];
    for(i=0;i<bits.length;i+=8){ var b=0; for(var k=0;k<8;k++) b=(b<<1)|bits[i+k]; dados.push(b); }
    var pad = [0xEC,0x11], t=0;
    while(dados.length < v.dados) dados.push(pad[t++%2]);
    var ec = corrigeErro(dados, v.ec);
    var todos = dados.concat(ec);

    var s = v.size, m = [], usado = [];
    for(i=0;i<s;i++){ m.push(new Array(s).fill(0)); usado.push(new Array(s).fill(0)); }
    /* localizadores */
    function localizador(ox, oy){
      for(var y=-1;y<=7;y++) for(var x=-1;x<=7;x++){
        var px=ox+x, py=oy+y; if(px<0||px>=s||py<0||py>=s) continue;
        var dentro = (x>=0&&x<=6&&(y===0||y===6)) || (y>=0&&y<=6&&(x===0||x===6)) || (x>=2&&x<=4&&y>=2&&y<=4);
        m[py][px] = dentro?1:0; usado[py][px]=1;
      }
    }
    localizador(0,0); localizador(s-7,0); localizador(0,s-7);
    for(i=8;i<s-8;i++){ m[6][i]=m[i][6]=(i%2===0)?1:0; usado[6][i]=usado[i][6]=1; }
    for(i=0;i<v.al.length;i++) for(var j2=0;j2<v.al.length;j2++){
      var cx=v.al[i], cy=v.al[j2];
      if((cx===6&&cy===6)||(cx===6&&cy===v.al[v.al.length-1])||(cx===v.al[v.al.length-1]&&cy===6)) continue;
      for(var dy=-2;dy<=2;dy++) for(var dx=-2;dx<=2;dx++){
        m[cy+dy][cx+dx] = (Math.max(Math.abs(dx),Math.abs(dy))!==1)?1:0;
        usado[cy+dy][cx+dx]=1;
      }
    }
    m[s-8][8]=1; usado[s-8][8]=1;                        /* módulo escuro */
    for(i=0;i<9;i++){ usado[8][i]=1; usado[i][8]=1; }    /* área do formato */
    for(i=0;i<8;i++){ usado[8][s-1-i]=1; usado[s-1-i][8]=1; }

    /* dados em zigue-zague, de baixo pra cima */
    var bi=0, subindo=true;
    for(var col=s-1; col>0; col-=2){
      if(col===6) col--;
      for(var passo=0; passo<s; passo++){
        var y = subindo ? (s-1-passo) : passo;
        for(var d2=0; d2<2; d2++){
          var x = col-d2;
          if(usado[y][x]) continue;
          var bit = 0;
          if(bi < todos.length*8) bit = (todos[bi>>3] >> (7-(bi&7))) & 1;
          m[y][x] = bit; bi++;
        }
      }
      subindo = !subindo;
    }

    /* escolhe a máscara com menor penalidade */
    function aplica(mask, x, y){
      switch(mask){
        case 0: return (x+y)%2===0;            case 1: return y%2===0;
        case 2: return x%3===0;                case 3: return (x+y)%3===0;
        case 4: return (Math.floor(y/2)+Math.floor(x/3))%2===0;
        case 5: return (x*y)%2 + (x*y)%3 === 0;
        case 6: return ((x*y)%2 + (x*y)%3)%2===0;
        default:return ((x+y)%2 + (x*y)%3)%2===0;
      }
    }
    var melhor=null, melhorP=Infinity, melhorM=0;
    for(var mk=0; mk<8; mk++){
      var t2=[]; for(i=0;i<s;i++) t2.push(m[i].slice());
      for(var yy=0;yy<s;yy++) for(var xx=0;xx<s;xx++)
        if(!usado[yy][xx] && aplica(mk,xx,yy)) t2[yy][xx] ^= 1;
      var f = formato(mk);
      for(i=0;i<15;i++){
        var b2 = (f>>i)&1;
        if(i<6){ t2[8][i]=b2; } else if(i<8){ t2[8][i+1]=b2; }
        else if(i===8){ t2[7][8]=b2; } else { t2[14-i][8]=b2; }
        if(i<8){ t2[s-1-i][8]=b2; } else { t2[8][s-15+i]=b2; }
      }
      var p = penalidade(t2, s);
      if(p < melhorP){ melhorP=p; melhor=t2; melhorM=mk; }
    }
    return melhor;
  }

  /* devolve o QR como <img> em data URI, pronto pro PDF */
  function svgDataURI(texto, px){
    var m = gerar(texto);
    if(!m) return null;
    var s = m.length, q = 4, tot = s + q*2, r = '';
    for(var y=0;y<s;y++) for(var x=0;x<s;x++)
      if(m[y][x]) r += 'M'+(x+q)+' '+(y+q)+'h1v1h-1z';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+tot+' '+tot+'" '+
      'width="'+px+'" height="'+px+'" shape-rendering="crispEdges">'+
      '<rect width="'+tot+'" height="'+tot+'" fill="#fff"/>'+
      '<path d="'+r+'" fill="#000"/></svg>';
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }
  return { gerar:gerar, dataURI:svgDataURI };
})();
