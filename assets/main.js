/* LCH Trucking: JS compartido (sin dependencias) */
(function () {
  "use strict";
  var C = window.LCH || {};

  /* ---------- Medición (solo si hay IDs en config.js) ---------- */
  var ids = [C.gaId, C.adsId].filter(Boolean);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  if (ids.length) {
    var s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + ids[0];
    document.head.appendChild(s);
    gtag("js", new Date());
    ids.forEach(function (id) { gtag("config", id); });
  }
  function track(kind) {
    var page = location.pathname;
    gtag("event", kind === "call" ? "call_click" : kind === "form" ? "generate_lead" : "whatsapp_click", { page_path: page });
    var label = kind === "call" ? C.callLabel : kind === "form" ? C.formLabel : C.waLabel;
    if (C.adsId && label) gtag("event", "conversion", { send_to: C.adsId + "/" + label, transport_type: "beacon" });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-track]");
    if (a && a.tagName === "A") track(a.getAttribute("data-track"));
  });
  document.querySelectorAll("form[data-track]").forEach(function (f) {
    f.addEventListener("submit", function () { track("form"); });
  });

  /* ---------- Aparición al hacer scroll ---------- */
  var rv = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
    }, { threshold: 0.12 });
    rv.forEach(function (e) { io.observe(e); });
  } else { rv.forEach(function (e) { e.classList.add("in"); }); }

  /* ---------- Spotlight Card (21st.dev / jahed, portado) ---------- */
  var cards = document.querySelectorAll(".card[data-glow]");
  if (cards.length) {
    document.addEventListener("pointermove", function (e) {
      var x = e.clientX, y = e.clientY, xp = (x / innerWidth).toFixed(2);
      cards.forEach(function (c) {
        c.style.setProperty("--x", x.toFixed(1)); c.style.setProperty("--y", y.toFixed(1)); c.style.setProperty("--xp", xp);
      });
    }, { passive: true });
  }

  /* ---------- Cuadrícula animada del hero (21st.dev / shadcnui-blocks, portado) ---------- */
  var g = document.getElementById("agrid");
  if (g && !matchMedia("(prefers-reduced-motion:reduce)").matches) {
    var cols = Math.ceil(g.offsetWidth / 56) || 20, rows = Math.ceil(g.offsetHeight / 56) || 12;
    for (var n = 0; n < 26; n++) {
      var q = document.createElement("i");
      q.style.left = Math.floor(Math.random() * cols) * 56 + "px";
      q.style.top = Math.floor(Math.random() * rows) * 56 + "px";
      q.style.animationDelay = (Math.random() * 3.2).toFixed(2) + "s";
      g.appendChild(q);
    }
  }

  /* ---------- Galería con ampliación ---------- */
  var lb = document.getElementById("lb");
  if (lb) {
    document.querySelectorAll(".bento figure").forEach(function (f) {
      f.addEventListener("click", function () {
        var i = f.querySelector("img");
        lb.querySelector("img").src = i.src; lb.querySelector("img").alt = i.alt;
        if (lb.showModal) lb.showModal();
      });
    });
    lb.addEventListener("click", function () { lb.close(); });
  }

  /* ---------- Geolocalización: ubicación actual + GPS por WhatsApp ---------- */
  var geo = document.getElementById("geo");
  if (geo) {
    var msg = document.getElementById("geomsg"), loc = document.getElementById("loc"),
        gps = document.getElementById("gps"), wag = document.getElementById("wagps");
    geo.addEventListener("click", function () {
      if (!navigator.geolocation) { msg.textContent = "Location is not available on this device. Type where you are instead."; return; }
      msg.textContent = "Finding your location…";
      navigator.geolocation.getCurrentPosition(function (p) {
        var lat = p.coords.latitude.toFixed(5), lng = p.coords.longitude.toFixed(5);
        var link = "https://maps.google.com/?q=" + lat + "," + lng;
        loc.value = "GPS: " + lat + ", " + lng; if (gps) gps.value = link;
        if (wag) wag.href = "https://wa.me/18048210538?text=" + encodeURIComponent("EMERGENCY - commercial truck tire. My location: " + link);
        msg.innerHTML = 'Location added (accuracy about ' + Math.round(p.coords.accuracy) + ' m). <a href="' + link + '" target="_blank" rel="noopener">Check it on the map</a>. You can edit the text above.';
      }, function () { msg.textContent = "We could not get your location. Type the highway, direction and mile marker instead."; },
      { timeout: 10000, enableHighAccuracy: true });
    });
  }

  /* ---------- Idioma ES/EN (solo portada) ---------- */
  var btn = document.getElementById("lang");
  if (btn) {
    var D = { es: {
      eta: "Disponible ahora · Llegada promedio 30–45 min",
      h1: "¿Llanta reventada en la I-95? Vamos a ti, 24/7.",
      lead: "Reparación y reemplazo móvil de llantas comerciales en Richmond, VA. Solo tractocamiones, trailers y maquinaria pesada. Contestamos de día y de noche.",
      call: "Llamar ahora 24/7" } };
    var EN = {}; document.querySelectorAll("[data-i]").forEach(function (e) { EN[e.dataset.i] = e.textContent; });
    var es = false;
    btn.addEventListener("click", function () {
      es = !es; document.documentElement.lang = es ? "es" : "en"; btn.textContent = es ? "EN" : "ES";
      document.querySelectorAll("[data-i]").forEach(function (e) { if (D.es[e.dataset.i]) e.textContent = es ? D.es[e.dataset.i] : EN[e.dataset.i]; });
    });
  }
})();
