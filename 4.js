/* ==========================================================
   OASIS VR ZONE — Pop Future JS (oasis-pop.js)
   Hiệu ứng & tương tác:
   - Dropdown liên hệ (trap focus)
   - Smooth scroll (data-scroll & anchor)
   - Carousel Events (3→2→1, infinite, drag, dots, keyboard, autoplay)
   - Reviews ticker (pausable)
   - Mobile menu sheet (clone nav) + scroll lock + trap
   - Side-rail active highlight
   - Hero FX: tilt device + glare, sparkles, stagger reveal
   ========================================================== */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  /* ---------- Footer year ---------- */
  const y = $("#y");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Contact dropdown (focus trap) ---------- */
  (function contactDropdown() {
    const btn = $("#contactBtn");
    const menu = $("#contactMenu");
    if (!btn || !menu) return;

    let open = false;
    menu.hidden = true;
    btn.setAttribute("aria-controls", "contactMenu");
    btn.setAttribute("aria-expanded", "false");

    const focusables = () =>
      $$("a,button,[tabindex]:not([tabindex='-1'])", menu).filter(el => !el.hasAttribute("disabled"));

    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key === "Tab" && open) {
        const items = focusables(); if (!items.length) return;
        const first = items[0], last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && open) {
        e.preventDefault();
        const items = focusables(); if (!items.length) return;
        let i = items.indexOf(document.activeElement);
        if (i === -1) i = 0;
        i = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
        items[i].focus();
      }
    };
    const onDocClick = (e) => { if (!menu.contains(e.target) && e.target !== btn) close(); };

    function openMenu() {
      if (open) return;
      open = true;
      menu.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      focusables()[0]?.focus();
      document.addEventListener("keydown", onKey);
      document.addEventListener("click", onDocClick);
    }
    function close() {
      if (!open) return;
      open = false;
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onDocClick);
      btn.focus();
    }

    btn.addEventListener("click", (e) => { (open ? close : openMenu)(); e.stopPropagation(); });
    menu.addEventListener("click", (e) => e.stopPropagation());
  })();

  /* ---------- Smooth scroll (offset sticky appbar) ---------- */
  (function smoothAnchors() {
    const header = $(".appbar");
    const getOffset = () => (header?.offsetHeight || 0) + 8;

    $$("[data-scroll]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const sel = btn.getAttribute("data-scroll");
        const t = sel && $(sel);
        if (!t) return;
        e.preventDefault();
        const top = t.getBoundingClientRect().top + scrollY - getOffset();
        window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
      });
    });

    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const t = $(id);
        if (!t) return;
        e.preventDefault();
        const top = t.getBoundingClientRect().top + scrollY - getOffset();
        window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
      });
    });
  })();

  /* ---------- Events Carousel (3→2→1, infinite, drag, autoplay) ---------- */
  (function eventsCarousel() {
    const root = $("#events");
    if (!root) return;
    const viewport = root.querySelector(".carousel__viewport");
    const track = root.querySelector(".carousel__track");
    const prev = root.querySelector(".ctrl.prev");
    const next = root.querySelector(".ctrl.next");
    const dotsWrap = root.querySelector(".dots");
    if (!viewport || !track) return;

    const originals = $$(".slide", track).map(s => s.cloneNode(true)); // immutable base
    let nShow = 3, gap = 16, idx = 0, slideW = 0;
    let auto = null, isAnimating = false;
    const computeNShow = () => (innerWidth < 640 ? 1 : innerWidth < 1024 ? 2 : 3);

    function setWidths() {
      const w = viewport.clientWidth;
      slideW = (w - gap * (nShow - 1)) / nShow;
      $$(".slide", track).forEach(s => (s.style.width = slideW + "px"));
      track.style.transform = `translateX(${-idx * (slideW + gap)}px)`;
      if (prefersReduced) track.style.transition = "none";
    }

    function build() {
      track.innerHTML = "";
      const head = originals.slice(0, nShow).map(n => n.cloneNode(true));
      const tail = originals.slice(-nShow).map(n => n.cloneNode(true));
      [...tail, ...originals.map(n => n.cloneNode(true)), ...head].forEach(n => track.appendChild(n));
      idx = nShow;
      setWidths(); jump(idx); renderDots(); restart();
    }

    function pages() { return originals.length; }
    function activeIndex() {
      const len = originals.length;
      let a = (idx - nShow) % len; if (a < 0) a += len; return a;
    }

    function renderDots() {
      if (!dotsWrap) return;
      const len = pages();
      dotsWrap.innerHTML = Array.from({ length: len }, (_, i) =>
        `<button type="button" class="dot${i === activeIndex() ? " active" : ""}" aria-label="Slide ${i + 1}"></button>`
      ).join("");
      $$(".dot", dotsWrap).forEach((d, i) => d.addEventListener("click", () => go(nShow + i)));
    }

    function transformTo(i, animate = true) {
      isAnimating = true;
      track.style.transition = animate && !prefersReduced ? "transform .6s cubic-bezier(.2,.7,.2,1)" : "none";
      track.style.transform = `translateX(${-i * (slideW + gap)}px)`;
    }
    function jump(i) { transformTo(i, false); isAnimating = false; }
    function go(i) {
      if (isAnimating) return;
      idx = i; transformTo(idx, true); renderDots(); restart();
    }
    const prevStep = () => go(idx - 1);
    const nextStep = () => go(idx + 1);

    track.addEventListener("transitionend", () => {
      const len = originals.length;
      if (idx >= len + nShow) { idx = nShow; jump(idx); }
      else if (idx < nShow) { idx = len + nShow - 1; jump(idx); }
      else { isAnimating = false; }
    });

    // Drag / swipe
    (function pointer() {
      let startX = null, startIdx = null, dragging = false, pid = 0;
      viewport.addEventListener("pointerdown", (e) => {
        startX = e.clientX; startIdx = idx; dragging = true; pid = e.pointerId;
        viewport.setPointerCapture(pid); clearInterval(auto); track.style.transition = "none";
      });
      viewport.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        track.style.transform = `translateX(${-(startIdx * (slideW + gap)) + dx}px)`;
      });
      function endDrag(e) {
        if (!dragging) return;
        const dx = e.clientX - startX;
        dragging = false; viewport.releasePointerCapture(pid);
        if (Math.abs(dx) > 40) (dx < 0 ? nextStep() : prevStep()); else go(startIdx);
        restart();
      }
      viewport.addEventListener("pointerup", endDrag);
      viewport.addEventListener("pointercancel", endDrag);
      root.addEventListener("mouseenter", () => clearInterval(auto));
      root.addEventListener("mouseleave", restart);
      document.addEventListener("visibilitychange", () => document.hidden ? clearInterval(auto) : restart());
    })();

    // Keyboard
    viewport.setAttribute("tabindex", "0");
    viewport.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); prevStep(); }
      if (e.key === "ArrowRight") { e.preventDefault(); nextStep(); }
    });

    function restart() {
      clearInterval(auto);
      if (prefersReduced) return;
      auto = setInterval(nextStep, 4200);
    }

    // Resize observer
    let lastNShow = computeNShow();
    nShow = lastNShow;
    const ro = new ResizeObserver(() => {
      const cur = computeNShow();
      if (cur !== lastNShow) { lastNShow = cur; nShow = cur; build(); }
      else setWidths();
    });
    ro.observe(viewport);
    build();
    window.addEventListener("beforeunload", () => { clearInterval(auto); ro.disconnect(); });
  })();

  /* ---------- Reviews ticker (demo data + pause on hover) ---------- */
  (function reviewsTicker() {
    const rowA = $("#rowA");
    const rowB = $("#rowB");
    if (!rowA || !rowB) return;

    const reviews = [
      { name: "Huy", text: "Headset cực mịn, passthrough quá đẹp!" },
      { name: "My", text: "Lắp đặt tận nơi nhanh gọn." },
      { name: "Khoa", text: "Haptics chân thật, đã tai đã mắt." },
      { name: "An", text: "Không gian demo đúng vibe Pop Future." },
      { name: "Linh", text: "Tracking chính xác, không trôi tay." },
      { name: "Minh", text: "Tư vấn nhiệt tình, dễ hiểu." },
      { name: "Quang", text: "Giá hợp lý, nhiều combo." },
      { name: "Ngọc", text: "Workshop Unity rất đáng tiền." },
      { name: "Nhi", text: "Thiết kế web nhìn mê luôn!" },
      { name: "Tuấn", text: "Sẽ quay lại trải nghiệm." }
    ];

    const star = () =>
      `<svg class="star" viewBox="0 0 24 24" fill="gold" width="16" height="16" aria-hidden="true"><path d="M12 2l2.9 6.7 7.1.6-5.3 4.6 1.6 7-6.3-3.8-6.3 3.8 1.6-7L2 9.3l7.1-.6L12 2z"/></svg>`;
    const avatar = (n) => {
      const c = (n || "?").charAt(0).toUpperCase();
      return `<svg viewBox='0 0 40 40' width='20' height='20' aria-hidden="true"><defs><linearGradient id='g${c}' x1='0' x2='1'><stop stop-color='#8af7ff'/><stop offset='1' stop-color='#ff8bd6'/></linearGradient></defs><circle cx='20' cy='20' r='19' fill='url(#g${c})' opacity='.35'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='#eaf7ff' font-family='Inter,system-ui' font-weight='800'>${c}</text></svg>`;
    };

    const rowHtml = () =>
      reviews
        .map((r) => `<span class='pill'>${star()}<span class='avatar'>${avatar(r.name)}</span><strong>${r.name}</strong> ★★★★★ – ${r.text}</span>`)
        .join("");

    rowA.innerHTML = rowHtml() + rowHtml();
    rowB.innerHTML = rowHtml() + rowHtml();

    $$(".ticker .ticker__row").forEach((r) => {
      r.addEventListener("mouseenter", () => (r.style.animationPlayState = "paused"));
      r.addEventListener("mouseleave", () => (r.style.animationPlayState = "running"));
    });
  })();

  /* ---------- Mobile menu sheet (clone nav) + scroll lock & trap ---------- */
  (function mobileMenu() {
    const header = $(".appbar");
    const inner = $(".appbar__inner");
    const list = $(".primary-nav .navlist");
    const btn = $("#mMenuBtn");
    if (!header || !inner || !list || !btn) return;

    let sheet = null, panel = null, outsideH = null, escH = null;
    const mkSheet = () => {
      if (sheet) return;
      sheet = document.createElement("div");
      sheet.className = "m-sheet";
      sheet.id = "mSheet";
      sheet.setAttribute("aria-labelledby", "mMenuBtn");
      sheet.setAttribute("aria-hidden", "true");
      sheet.innerHTML = `<nav class="m-panel" role="navigation" aria-label="Menu di động"></nav>`;
      header.appendChild(sheet);
      panel = sheet.querySelector(".m-panel");
      panel.innerHTML = "";
      $$("a", list).forEach((a) => {
        const c = a.cloneNode(true);
        c.classList.add("m-item");
        panel.appendChild(c);
      });
    };

    const lockScroll = (state) => {
      if (state) { document.body.dataset.prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
      else { document.body.style.overflow = document.body.dataset.prevOverflow || ""; delete document.body.dataset.prevOverflow; }
    };

    function close() {
      btn.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      sheet?.classList.remove("open");
      sheet?.setAttribute("aria-hidden", "true");
      document.removeEventListener("click", outsideH);
      document.removeEventListener("keydown", escH);
      lockScroll(false);
      btn.focus();
    }
    function open() {
      mkSheet();
      btn.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      sheet.classList.add("open");
      sheet.setAttribute("aria-hidden", "false");
      lockScroll(true);
      // focus trap
      const f = $$("a,button,[tabindex]:not([tabindex='-1'])", sheet);
      f[0]?.focus();
      outsideH = (e) => { if (!sheet.contains(e.target) && e.target !== btn) close(); };
      escH = (e) => {
        if (e.key === "Escape") close();
        if (e.key === "Tab") {
          const items = $$("a,button,[tabindex]:not([tabindex='-1'])", sheet);
          if (!items.length) return;
          const first = items[0], last = items.at(-1);
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      };
      document.addEventListener("click", outsideH);
      document.addEventListener("keydown", escH);
      sheet.addEventListener("click", (e) => {
        const a = e.target.closest("a");
        if (a) close();
      }, { once: false });
    }

    btn.addEventListener("click", (e) => { (btn.classList.contains("open") ? close : open)(); e.stopPropagation(); });
  })();

  /* ---------- Side-rail active highlight ---------- */
  (function railActive() {
    const links = $$(".rail .rail__link");
    if (!links.length) return;

    const map = new Map(links.map((a) => [a.getAttribute("href"), a]));
    const header = $(".appbar");
    const offset = () => (header?.offsetHeight || 0) + 10;
    const targets = ["#hero","#products","#events","#team","#gallery","#map"]
      .map(id => ({ id, el: $(id) }))
      .filter(x => x.el);

    function onScroll() {
      const topY = scrollY + offset() + 20;
      let current = targets[0]?.id;
      for (const t of targets) {
        const y = t.el.getBoundingClientRect().top + scrollY;
        if (y <= topY) current = t.id; else break;
      }
      links.forEach(l => l.classList.remove("is-active"));
      map.get(current)?.classList.add("is-active");
    }
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  })();

  /* ---------- Hero FX: tilt & sparkles & stagger reveal ---------- */
  (function heroFX() {
    const device = $(".hero .device");
    const bezel = $(".hero .device__bezel");
    const stage = $(".hero .hero__stage");
    const copy = $(".hero .hero__copy");
    if (!stage) return;

    // Tilt
    if (device && bezel && !prefersReduced) {
      const maxR = 8; // deg
      device.addEventListener("mousemove", (e) => {
        const r = device.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width;   // 0..1
        const cy = (e.clientY - r.top) / r.height;   // 0..1
        const rx = (0.5 - cy) * maxR;                // rotateX
        const ry = (cx - 0.5) * maxR;                // rotateY
        bezel.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      device.addEventListener("mouseleave", () => {
        bezel.style.transform = `rotateX(6deg) rotateY(-6deg)`;
      });
    }

    // Sparkles (Web Animations API)
    if (!prefersReduced) {
      const count = 16;
      for (let i = 0; i < count; i++) {
        const s = document.createElement("span");
        s.setAttribute("aria-hidden", "true");
        Object.assign(s.style, {
          position: "absolute",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,.95), rgba(255,255,255,0))",
          left: Math.random() * 100 + "%", top: Math.random() * 100 + "%",
          pointerEvents: "none", filter: "drop-shadow(0 0 6px rgba(255,255,255,.6))",
        });
        stage.appendChild(s);
        s.animate(
          [
            { transform: "translateY(0) scale(0.6)", opacity: 0.3 },
            { transform: "translateY(-10px) scale(1)", opacity: 0.9 },
            { transform: "translateY(0) scale(0.6)", opacity: 0.3 }
          ],
          { duration: 2400 + Math.random() * 1600, iterations: Infinity, direction: "alternate", delay: Math.random() * 1200, easing: "ease-in-out" }
        );
      }
    }

    // Stagger reveal for hero copy
    if (copy && !prefersReduced && "IntersectionObserver" in window) {
      const items = $$("[data-fx='stagger'] > *", copy);
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            items.forEach((el, i) => {
              el.animate([{opacity:0, transform:"translateY(10px)"},{opacity:1, transform:"none"}],
                { duration: 600, delay: i * 80, fill: "forwards", easing: "cubic-bezier(.22,1,.36,1)" });
            });
            io.disconnect();
          }
        });
      }, { threshold: 0.25 });
      io.observe(copy);
    }
  })();
})();
