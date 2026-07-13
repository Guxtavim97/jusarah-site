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
        var open = function (loc) { window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(base + loc), "_blank"); };
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function (p) { open(" Minha localização: https://maps.google.com/?q=" + p.coords.latitude + "," + p.coords.longitude); },
            function () { open(" (não consegui pegar a localização automática — já informo o local.)"); },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        } else { open(" (já informo o local.)"); }
      });
    }
  }
});
