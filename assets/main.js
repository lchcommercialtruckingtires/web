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
        if (wag) wag.href = "https://wa.me/18048210538?text=" + encodeURIComponent("EMERGENCY - tire help. My location: " + link);
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
      lead: "Reparación y cambio móvil de llantas en Richmond, VA. Tractocamiones, trailers, camiones de caja y maquinaria pesada, y también carros, pickups y SUV. Todas las medidas y marcas. Contestamos de día y de noche.",
      h1a: "¿Llanta ponchada? ¿Reventón?",
      h1b: "Vamos a donde estés, 24/7.",
      call: "Llamar ahora 24/7" } };
    var EN = {}; document.querySelectorAll("[data-i]").forEach(function (e) { EN[e.dataset.i] = e.textContent; });
    var es = false;
    btn.addEventListener("click", function () {
      es = !es; document.documentElement.lang = es ? "es" : "en"; btn.textContent = es ? "EN" : "ES";
      document.querySelectorAll("[data-i]").forEach(function (e) { if (D.es[e.dataset.i]) e.textContent = es ? D.es[e.dataset.i] : EN[e.dataset.i]; });
    });
  }

  /* ================= FX v2 ================= */
  var root = document.documentElement, ticking = false;
  var trip = document.querySelector(".trip"), tRoad = trip && trip.querySelector(".troad"),
      tHills = trip && trip.querySelector(".hills"), tTrees = trip && trip.querySelector(".trees"),
      tSteps = trip ? trip.querySelectorAll(".step") : [], tire = document.querySelector(".bigtire"),
      sky = document.querySelector(".skyline");
  function frame() {
    ticking = false;
    var y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    root.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
    if (sky) sky.style.setProperty("--par", (y * 0.18).toFixed(1) + "px");
    if (tire) { var r0 = tire.getBoundingClientRect(); tire.style.setProperty("--rot", ((innerHeight - r0.top) * 0.35).toFixed(1) + "deg"); }
    if (trip) {
      var r = trip.getBoundingClientRect(), total = trip.offsetHeight - innerHeight + 68;
      var p = Math.min(1, Math.max(0, (68 - r.top) / total));
      if (r.bottom > 0 && r.top < innerHeight) {
        tRoad.style.transform = "translateX(" + (-p * 200).toFixed(3) + "vw)";
        tHills.style.backgroundPositionX = (-p * 700).toFixed(0) + "px";
        tTrees.style.backgroundPositionX = (-p * 1600).toFixed(0) + "px";
        var idx = p < 0.27 ? 0 : p < 0.52 ? 1 : p < 0.78 ? 2 : 3;
        tSteps.forEach(function (s, i) { s.classList.toggle("on", i === idx); });
      }
    }
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener("resize", frame); frame();

  /* Contadores */
  var cnt = document.querySelectorAll("[data-to]");
  if ("IntersectionObserver" in window && cnt.length) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = +el.dataset.to, pre = el.dataset.pre || "", suf = el.dataset.suf || "", t0 = null;
        if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;
        function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / 1400), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
          el.textContent = pre + v + suf; if (k < 1) requestAnimationFrame(step); }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    cnt.forEach(function (c) { co.observe(c); });
  }

  /* Pestañas de medidas */
  document.querySelectorAll(".tab").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (x) { x.setAttribute("aria-selected", x === b); });
      document.querySelectorAll(".tabp").forEach(function (x) { x.classList.toggle("on", x.id === b.getAttribute("aria-controls")); });
    });
  });

  /* Inclinacion 3D en tarjetas de vehiculos y logo */
  if (matchMedia("(hover:hover)").matches && !matchMedia("(prefers-reduced-motion:reduce)").matches) {
    document.querySelectorAll(".vt").forEach(function (c) {
      c.addEventListener("pointermove", function (e) {
        var b = c.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
        c.style.transform = "perspective(700px) rotateY(" + (x * 10).toFixed(2) + "deg) rotateX(" + (-y * 10).toFixed(2) + "deg) translateY(-4px)";
      });
      c.addEventListener("pointerleave", function () { c.style.transform = ""; });
    });
  }
})();
