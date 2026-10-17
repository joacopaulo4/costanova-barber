(function () {
  "use strict";
  /* Costanova Barber — el contenido está escrito en el HTML; esto solo anima. */
  document.documentElement.classList.add("js");

  var WA = "59896814386";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var hasGsap = function () { return !!(window.gsap && window.ScrollTrigger); };
  function safe(fn, n) { try { fn(); } catch (e) { console.warn("[" + n + "]", e); } }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function initWA() {
    $$("[data-wa]").forEach(function (a) { a.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(a.dataset.wa); });
  }

  function initDock() {
    var dock = $("[data-dock]"), raf = null;
    function up() { raf = null; dock.classList.toggle("is-hidden", scrollY < innerHeight * 0.6); }
    up();
    addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(up); }, { passive: true });
  }

  function initReveal() {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    $$("[data-reveal],[data-words]").forEach(function (el) { io.observe(el); });
    setTimeout(function () { $$("[data-reveal]:not(.is-in),[data-words]:not(.is-in)").forEach(function (el) { el.classList.add("is-in"); }); }, 6000);
  }

  /* Abierto ahora: lunes a sábado 9:30–20 (horario de Google Maps) */
  function initStatus() {
    var parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Montevideo", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
    var g = function (t) { return (parts.filter(function (x) { return x.type === t; })[0] || {}).value; };
    var day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday"));
    var h = (parseInt(g("hour"), 10) % 24) + parseInt(g("minute"), 10) / 60;
    var open = day >= 1 && day <= 6 && h >= 9.5 && h < 20;
    var el = $("[data-status]");
    el.lastElementChild.textContent = open ? "Abierto ahora · hasta las 20" : (day === 0 || (day === 6 && h >= 20) ? "Cerrado · abrimos el lunes 9:30" : "Cerrado · abrimos 9:30");
    el.style.setProperty("--status", open ? "#19B85A" : "#FF2D8A");
    $$("[data-hours] li").forEach(function (li) { if (li.dataset.d.split(",").indexOf(String(day)) > -1) li.classList.add("today"); });
  }

  function initCount() {
    $$("[data-count-to]").forEach(function (el) {
      var t = parseFloat(el.dataset.countTo), d = (el.dataset.countTo.split(".")[1] || "").length;
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        var s = performance.now();
        (function f(n) {
          var p = Math.min((n - s) / 1600, 1), v = t * (1 - Math.pow(1 - p, 3));
          el.textContent = v.toFixed(d).replace(".", ",");
          if (p < 1) requestAnimationFrame(f);
        })(s);
      }, { threshold: 0.05 });
      io.observe(el);
    });
  }

  /* Título: letras que suben una por una (respeta <br> y <em>) */
  function initChars() {
    if (!hasGsap()) return;
    var el = $("[data-chars]");
    if (!el || el.dataset.done) return;
    el.dataset.done = "1";
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    var wrap = function (t) {
      return t.split(/(\s+)/).map(function (w) {
        if (/^\s*$/.test(w)) return w;
        return '<span class="w" style="display:inline-block;white-space:nowrap" aria-hidden="true">' + Array.from(w).map(function (c) { return '<span class="ch">' + esc(c) + "</span>"; }).join("") + "</span>";
      }).join("");
    };
    el.innerHTML = Array.prototype.map.call(el.childNodes, function (n) {
      if (n.nodeType === 3) return wrap(n.textContent);
      if (n.nodeName === "BR") return "<br>";
      if (n.nodeType === 1) { var tag = n.tagName.toLowerCase(); return "<" + tag + ">" + wrap(n.textContent) + "</" + tag + ">"; }
      return "";
    }).join("");
    gsap.from($$(".ch", el), { yPercent: 110, opacity: 0, rotate: 6, duration: 0.9, ease: "expo.out", stagger: 0.035, delay: 0.15 });
  }

  /* Palabra gigante que corre de costado mientras bajás */
  function initBigword() {
    if (!hasGsap()) return;
    var sec = $("[data-bigword]"), track = $("[data-bigword-track]");
    var dist = function () { return Math.max(0, track.scrollWidth - innerWidth); };
    gsap.to(track, {
      x: function () { return -dist(); }, ease: "none",
      scrollTrigger: { trigger: sec, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 0.5, invalidateOnRefresh: true, anticipatePin: 1 }
    });
  }

  /* FIRMA — "Pasale la máquina": el pelo se va con el dedo y aparece el corte terminado */
  function initShave() {
    var box = $("[data-shave]"), cv = $("canvas", box), btn = $("[data-shave-auto]"), msg = $("[data-shave-done]");
    var ctx = cv.getContext && cv.getContext("2d");
    if (!ctx) { box.classList.add("no-canvas"); btn.hidden = true; return; }
    var w = 0, h = 0, dpr = 1, last = null, moves = 0, done = false, touched = false;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function paintHair() {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#17120F";
      ctx.fillRect(0, 0, w, h);
      var n = Math.round(w * h / 26);
      for (var i = 0; i < n; i++) {
        var x = Math.random() * w, y = Math.random() * h, len = rnd(7, 18), a = rnd(-1.9, -1.25);
        var c = Math.round(rnd(28, 78));
        ctx.strokeStyle = "rgba(" + c + "," + Math.round(c * 0.8) + "," + Math.round(c * 0.65) + "," + rnd(0.5, 1).toFixed(2) + ")";
        ctx.lineWidth = rnd(0.8, 1.7);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,45,138,.95)";
      ctx.font = "600 " + Math.max(12, Math.round(w * 0.032)) + "px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("ANTES", w / 2, h * 0.12);
    }
    function size() {
      if (touched) return;
      var r = box.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1); w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintHair();
    }
    function cut(x0, y0, x1, y1) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = "square"; ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(44, w * 0.17);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    function cleared() {
      var d = ctx.getImageData(0, 0, cv.width, cv.height).data, tot = 0, clr = 0;
      for (var i = 3; i < d.length; i += 4 * 23) { tot++; if (d[i] < 40) clr++; }
      return tot ? clr / tot : 0;
    }
    function finish() {
      if (done) return;
      done = true;
      box.classList.add("is-done");
      msg.textContent = "Listo. Así salís de Costanova.";
      btn.textContent = "Otra vez";
    }
    function reset() {
      done = false; touched = false; moves = 0;
      box.classList.remove("is-done", "is-touched");
      msg.textContent = ""; btn.textContent = "Pasarla sola";
      size();
    }
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function move(e) {
      if (done) return;
      if (e.pointerType !== "mouse" && !last) return;
      var p = pos(e);
      if (!touched) { touched = true; box.classList.add("is-touched"); }
      if (last) cut(last.x, last.y, p.x, p.y); else cut(p.x, p.y, p.x + 0.1, p.y + 0.1);
      last = p;
      if (++moves % 14 === 0 && cleared() > 0.62) finish();
    }
    cv.addEventListener("pointerdown", function (e) { last = pos(e); try { cv.setPointerCapture(e.pointerId); } catch (_) {} move(e); });
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", function () { last = null; });
    cv.addEventListener("pointercancel", function () { last = null; });
    cv.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") last = null; });

    btn.addEventListener("click", function () {
      if (done) { reset(); return; }
      touched = true; box.classList.add("is-touched");
      var rows = 6, t0 = performance.now(), dur = 1700, prev = null;
      (function step(n) {
        var p = Math.min((n - t0) / dur, 1), seg = p * rows, row = Math.min(rows - 1, Math.floor(seg)), f = seg - row;
        var x = row % 2 ? w * (1 - f) : w * f, y = h * (row + 0.5) / rows;
        if (prev && prev.row === row) cut(prev.x, prev.y, x, y); else if (prev) cut(prev.x, prev.y, x, y);
        prev = { x: x, y: y, row: row };
        if (p < 1) requestAnimationFrame(step); else finish();
      })(t0);
    });

    size();
    var to; addEventListener("resize", function () { clearTimeout(to); to = setTimeout(size, 200); });
  }

  function boot() {
    if (hasGsap()) gsap.registerPlugin(ScrollTrigger);
    safe(initWA, "wa");
    safe(initDock, "dock");
    safe(initStatus, "status");
    safe(initReveal, "reveal");
    safe(initCount, "count");
    safe(initChars, "chars");
    safe(initShave, "shave");
    safe(initBigword, "bigword");
    addEventListener("load", function () { if (hasGsap()) ScrollTrigger.refresh(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
