/* ==========================================================================
   JUSARAH AGRO AÉREA — Interações
   Sem dependências externas. Funciona abrindo o arquivo direto no navegador.
   ========================================================================== */

/* ---- CONFIGURAÇÃO RÁPIDA (edite aqui) --------------------------------------
   Estes valores também existirão no painel do WordPress. Aqui servem para o
   protótipo funcionar sozinho. */
window.JUSARAH = {
  whatsapp: "5569993257000",         // (69) 99325-7000
  emailDestino: "financeiro@voejusarah.com",
};
/* --------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", function () {
  /* ---- Menu mobile ---- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("is-open"); });
    });
  }

  /* ---- Contadores animados ---- */
  var counters = document.querySelectorAll("[data-count]");
  var animateCount = function (el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dur = 1600, start = null;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.floor(eased * target);
      el.textContent = val.toLocaleString("pt-BR");
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString("pt-BR");
    };
    requestAnimationFrame(step);
  };

  /* ---- Observer: contadores + reveal ---- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (entry.target.hasAttribute("data-count")) animateCount(entry.target);
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    counters.forEach(function (c) { io.observe(c); });
    document.querySelectorAll(".reveal").forEach(function (r) { io.observe(r); });
  } else {
    counters.forEach(function (c) { c.textContent = parseFloat(c.getAttribute("data-count")).toLocaleString("pt-BR"); });
    document.querySelectorAll(".reveal").forEach(function (r) { r.classList.add("is-visible"); });
  }

  /* ---- Links de WhatsApp dinâmicos ---- */
  document.querySelectorAll("[data-wa]").forEach(function (el) {
    var msg = el.getAttribute("data-wa") || "Olá! Gostaria de falar com a Jusarah Agro Aérea.";
    el.setAttribute("href", "https://wa.me/" + window.JUSARAH.whatsapp + "?text=" + encodeURIComponent(msg));
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });

  /* ---- Formulário de orçamento ----
     No protótipo: monta a mensagem e oferece envio por WhatsApp ou e-mail.
     No WordPress: um plugin de formulário (WPForms/Fluent Forms) faz isso com
     entrega automática por e-mail — este JS não é mais necessário. */
  var form = document.getElementById("form-orcamento");
  if (form) {
    var buildMessage = function () {
      var f = form;
      var get = function (n) { return (f.elements[n] && f.elements[n].value || "").trim(); };
      return (
        "*Solicitação de Orçamento — Jusarah Agro Aérea*%0A%0A" +
        "*Nome:* " + get("nome") + "%0A" +
        "*Cultura:* " + get("cultura") + "%0A" +
        "*Área (hectares):* " + get("area") + "%0A" +
        "*Município:* " + get("municipio") + "%0A" +
        "*Estado:* " + get("estado") + "%0A" +
        "*Serviço:* " + get("servico") + "%0A" +
        "*Telefone:* " + get("telefone") + "%0A" +
        "*Mensagem:* " + get("mensagem")
      );
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var msg = buildMessage();
      // Abre o WhatsApp da empresa com os dados organizados
      window.open("https://wa.me/" + window.JUSARAH.whatsapp + "?text=" + msg, "_blank");
      var ok = document.getElementById("form-ok");
      if (ok) { ok.hidden = false; ok.scrollIntoView({ behavior: "smooth", block: "center" }); }
    });
    var byEmail = document.getElementById("enviar-email");
    if (byEmail) {
      byEmail.addEventListener("click", function () {
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var subject = "Solicitação de Orçamento — " + (form.elements["nome"].value || "");
        var body = decodeURIComponent(buildMessage().replace(/%0A/g, "\n").replace(/\*/g, ""));
        window.location.href = "mailto:" + window.JUSARAH.emailDestino +
          "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      });
    }
  }

  /* ---- Conteúdo dinâmico: Notícias/Eventos (data/posts.json) ---- */
  var fmtData = function (iso) {
    if (!iso) return "";
    var meses = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
    var p = String(iso).split("-");
    if (p.length < 3) return "";
    return parseInt(p[2], 10) + " " + meses[parseInt(p[1], 10) - 1] + " " + p[0];
  };

  var grid = document.querySelector("[data-posts]");
  if (grid) {
    fetch("data/posts.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (posts) {
        if (!Array.isArray(posts) || !posts.length) return;
        grid.innerHTML = "";
        posts.forEach(function (p) {
          var art = document.createElement("article");
          art.className = "post";

          var box = document.createElement("div");
          box.className = "imgbox";
          box.style.borderRadius = "0";
          var img = document.createElement("img");
          img.src = p.imagem || "assets/img/aviao-campo-3.jpg";
          img.alt = p.titulo || "";
          img.loading = "lazy";
          img.style.aspectRatio = "16/10";
          box.appendChild(img);

          var body = document.createElement("div");
          body.className = "post__body";

          var meta = document.createElement("span");
          meta.className = "post__meta";
          meta.textContent = (p.categoria || "") + (p.data ? " · " + fmtData(p.data) : "");

          var h3 = document.createElement("h3");
          if (p.link) {
            var a = document.createElement("a");
            a.href = p.link; a.target = "_blank"; a.rel = "noopener";
            a.textContent = p.titulo || "";
            h3.appendChild(a);
          } else {
            h3.textContent = p.titulo || "";
          }

          var desc = document.createElement("p");
          desc.textContent = p.resumo || "";

          body.appendChild(meta);
          body.appendChild(h3);
          body.appendChild(desc);
          if (p.link) {
            var link = document.createElement("a");
            link.href = p.link; link.target = "_blank"; link.rel = "noopener";
            link.className = "post__link";
            link.textContent = "Ver mais →";
            body.appendChild(link);
          }

          art.appendChild(box);
          art.appendChild(body);
          grid.appendChild(art);
        });
      })
      .catch(function () {});
  }

  /* ---- Conteúdo dinâmico: Semeando Esperança (data/projeto.json) ---- */
  var proj = document.querySelector("[data-projeto]");
  if (proj) {
    fetch("data/projeto.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        var eb = proj.querySelector("[data-projeto-eyebrow]");
        var tt = proj.querySelector("[data-projeto-titulo]");
        var tx = proj.querySelector("[data-projeto-texto]");
        var im = proj.querySelector("[data-projeto-img]");
        if (eb && d.eyebrow) eb.textContent = d.eyebrow;
        if (tt && d.titulo) tt.textContent = d.titulo;
        if (im && d.imagem) im.src = d.imagem;
        if (tx && Array.isArray(d.paragrafos)) {
          tx.innerHTML = "";
          d.paragrafos.forEach(function (par) {
            var el = document.createElement("p");
            el.textContent = par;
            tx.appendChild(el);
          });
        }
      })
      .catch(function () {});
  }

  /* ---- Ano no rodapé ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---- Emergência de incêndio ---- */
  var emOpen = document.querySelector("[data-em-open]");
  var emOverlay = document.getElementById("em-overlay");
  if (emOpen && emOverlay) {
    var emClose = function () { emOverlay.classList.remove("is-open"); };
    emOpen.addEventListener("click", function () { emOverlay.classList.add("is-open"); });
    emOverlay.querySelectorAll("[data-em-close]").forEach(function (el) { el.addEventListener("click", emClose); });
    emOverlay.addEventListener("click", function (e) { if (e.target === emOverlay) emClose(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") emClose(); });

    var emWpp = document.getElementById("em-wpp");
    if (emWpp) {
      emWpp.addEventListener("click", function (e) {
        e.preventDefault();
        var num = window.JUSARAH.whatsapp;
        var base = "🔥 EMERGÊNCIA DE INCÊNDIO — preciso de combate aéreo da Jusarah.";
        var go = function (loc) { window.location.href = "https://wa.me/" + num + "?text=" + encodeURIComponent(base + loc); };
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function (p) { go(" Minha localização: https://maps.google.com/?q=" + p.coords.latitude + "," + p.coords.longitude); },
            function () { go(" (não consegui pegar a localização automática — vou informar o local)"); },
            { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
          );
        } else { go(" (vou informar o local)"); }
      });
    }
  }
});
