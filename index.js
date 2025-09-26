// OASIS VR ZONE – App JS (dropdown, infinite slider, ticker, anchors, onscroll FX, mobile menu, partials-safe)
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // ===== Footer year (idempotent, chạy lại khi partials sẵn sàng) =====
  function setFooterYear(){
    const y = $("#y");
    if (y) y.textContent = new Date().getFullYear();
  }
  setFooterYear();
  document.addEventListener("oasis:partials-ready", setFooterYear);

  // ===== Contact dropdown (idempotent + re-init khi partials) =====
  function initContactDropdown() {
    const wrap = $(".dropdown");
    if (!wrap || wrap.dataset.bound === "1") return;
    wrap.dataset.bound = "1";

    const btn = $("#contactBtn");
    const menu = wrap.querySelector(".dropdown-menu");
    let openState = false;

    const close = () => {
      if (!openState) return;
      openState = false;
      btn?.setAttribute("aria-expanded", "false");
      menu?.classList.remove("open");
    };
    const open = () => {
      if (openState) return;
      openState = true;
      btn?.setAttribute("aria-expanded", "true");
      menu?.classList.add("open");
    };

    btn?.addEventListener("click", (e) => {
      openState ? close() : open();
      e.stopPropagation();
    });

    document.addEventListener("click", (e) => { if (!wrap.contains(e.target)) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { close(); btn?.focus(); } });
  }
  initContactDropdown();
  document.addEventListener("oasis:partials-ready", initContactDropdown);

  // ===== EVENTS: Infinite triple slider (3/2/1) =====
  (function tripleSliderInfinite() {
    const root = $("#events3");
    if (!root) return;
    const viewport = root.querySelector(".viewport");
    const track = root.querySelector(".track");
    const prev = root.querySelector(".prev");
    const next = root.querySelector(".next");
    const dotsWrap = root.querySelector(".dots");

    const sourceSlides = $$(".slide3", track).map((s) => s.cloneNode(true));

    let nShow = 3;
    let gap = 16;
    let idx = 0;
    let slideW = 0;
    let auto = null;
    let isAnimating = false;
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const computeNShow = () => (innerWidth < 640 ? 1 : innerWidth < 1024 ? 2 : 3);

    function setWidths() {
      const w = viewport.clientWidth;
      gap = parseFloat(getComputedStyle(track).gap) || 16; // lấy gap từ CSS
      slideW = (w - gap * (nShow - 1)) / nShow;
      $$(".slide3", track).forEach((s) => (s.style.width = slideW + "px"));
      track.style.transform = `translateX(${-idx * (slideW + gap)}px)`;
    }

    function build() {
      track.innerHTML = "";
      const headClones = sourceSlides.slice(0, nShow).map((n) => n.cloneNode(true));
      const tailClones = sourceSlides.slice(-nShow).map((n) => n.cloneNode(true));
      [...tailClones, ...sourceSlides.map((n) => n.cloneNode(true)), ...headClones].forEach(
        (n) => track.appendChild(n)
      );
      idx = nShow;
      setWidths();
      jump(idx);
      renderDots();
      restart();
    }

    function pages() { return sourceSlides.length; }
    function activeIndex() {
      const len = sourceSlides.length;
      let a = (idx - nShow) % len;
      if (a < 0) a += len;
      return a;
    }

    function renderDots() {
      if (!dotsWrap) return;
      const len = pages();
      dotsWrap.innerHTML = new Array(len)
        .fill(0)
        .map((_, i) => `<span class="dot${i === activeIndex() ? " active" : ""}" data-i="${i}" role="button" tabindex="0" aria-label="Đi tới slide ${i + 1}"></span>`)
        .join("");
      $$(".dot", dotsWrap).forEach((d) => {
        const goTo = () => go(nShow + parseInt(d.dataset.i, 10));
        d.addEventListener("click", goTo);
        d.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goTo(); }
        });
      });
    }

    function transformTo(i, animate = true) {
      isAnimating = true;
      track.style.transition = animate ? "transform .6s cubic-bezier(.2,.7,.2,1)" : "none";
      track.style.transform = `translateX(${-i * (slideW + gap)}px)`;
    }
    function jump(i) {
      transformTo(i, false);
      requestAnimationFrame(() => { isAnimating = false; });
    }
    function go(i) {
      if (isAnimating) return;
      idx = i;
      transformTo(idx, true);
      renderDots();
      restart();
    }

    track.addEventListener("transitionend", () => {
      const len = sourceSlides.length;
      if (idx >= len + nShow) { idx = nShow; jump(idx); }
      else if (idx < nShow)   { idx = len + nShow - 1; jump(idx); }
      else { isAnimating = false; }
    });

    const prevStep = () => go(idx - 1);
    const nextStep = () => go(idx + 1);

    function restart() {
      clearInterval(auto);
      if (prefersReduced) return;
      auto = setInterval(nextStep, 4200);
    }

    // Drag / swipe
    (function pointer() {
      let startX = null, startIdx = null, dragging = false;

      viewport.addEventListener("pointerdown", (e) => {
        startX = e.clientX; startIdx = idx; dragging = true;
        viewport.setPointerCapture(e.pointerId); clearInterval(auto);
      });
      viewport.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        track.style.transition = "none";
        track.style.transform = `translateX(${-(startIdx * (slideW + gap)) + dx}px)`;
      });
      const endDrag = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 40) { dx < 0 ? nextStep() : prevStep(); }
        else { go(startIdx); }
        startX = null; startIdx = null; dragging = false; restart();
      };
      viewport.addEventListener("pointerup", endDrag);
      viewport.addEventListener("pointercancel", endDrag);

      root.addEventListener("mouseenter", () => clearInterval(auto));
      root.addEventListener("mouseleave", restart);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) clearInterval(auto); else restart();
      });
    })();

    // Resize thông minh
    let lastNShow = computeNShow();
    nShow = lastNShow;
    const ro = new ResizeObserver(() => {
      const cur = computeNShow();
      if (cur !== lastNShow) { lastNShow = cur; nShow = cur; build(); }
      else { setWidths(); }
    });
    ro.observe(viewport);
    build();
    window.addEventListener("beforeunload", () => { clearInterval(auto); ro.disconnect(); });
  })();

  // ===== REVIEWS: running ticker =====
  (function reviewsTicker() {
    const rowA = $("#rowA"); const rowB = $("#rowB");
    if (!rowA || !rowB) return;
    const reviews = [
      { name: "Huy", text: "Headset cực mịn, passthrough quá đẹp!" },
      { name: "My", text: "Lắp đặt tận nơi nhanh gọn." },
      { name: "Khoa", text: "Haptics chân thật, đã tai đã mắt." },
      { name: "An", text: "Không gian shop quá xịn luôn." },
      { name: "Linh", text: "Tracking chính xác, không trôi tay." },
      { name: "shiro hakaku", text: "Tư vấn nhiệt tình, dễ hiểu." },
      { name: "Quang", text: "Giá hợp lý, nhiều combo." },
      { name: "Ngọc", text: "Sản Phẩm rất đáng tiền." },
      { name: "Nhi", text: "Thiết kế web nhìn mê luôn!" },
      { name: "Tuấn", text: "Sẽ quay lại trải nghiệm." }
    ];
    const star = () => `<svg class="star" viewBox="0 0 24 24" fill="gold" width="16" height="16" aria-hidden="true"><path d="M12 2l2.9 6.7 7.1.6-5.3 4.6 1.6 7-6.3-3.8-6.3 3.8 1.6-7L2 9.3l7.1-.6L12 2z"/></svg>`;
    function avatar(n) {
      const c = (n || "?").charAt(0).toUpperCase();
      return `<svg viewBox='0 0 40 40' width='20' height='20' aria-hidden="true"><defs><linearGradient id='g${c}' x1='0' x2='1'><stop stop-color='#00e6ff'/><stop offset='1' stop-color='#ff25ff'/></linearGradient></defs><circle cx='20' cy='20' r='19' fill='url(#g${c})' opacity='.35'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='#eaf7ff' font-family='Inter,system-ui' font-weight='800'>${c}</text></svg>`;
    }
    const rowHtml = () => reviews.map(r => `<span class='pill'>${star()}<span class='avatar'>${avatar(r.name)}</span><strong>${r.name}</strong> ★★★★★ – ${r.text}</span>`).join("");
    rowA.innerHTML = rowHtml() + rowHtml();
    rowB.innerHTML = rowHtml() + rowHtml();
    $$(".ticker .row").forEach(r => {
      r.addEventListener("mouseenter", () => (r.style.animationPlayState = "paused"));
      r.addEventListener("mouseleave", () => (r.style.animationPlayState = "running"));
    });
  })();

  // ===== Section in-view flag =====
  (function sectionInView() {
    const sections = $$(".fx-section");
    if (!sections.length) return;
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      sections.forEach((s) => s.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { e.isIntersecting ? e.target.classList.add("in") : e.target.classList.remove("in"); });
    }, { threshold: 0.2 });
    sections.forEach((s) => io.observe(s));
  })();

  // ===== Smooth anchors (delegation + offset header) =====
  (function smoothAnchors() {
    if (window.__oasisAnchorsBound) return;
    window.__oasisAnchorsBound = true;
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute("href"); if (!id || id === "#") return;
      const t = $(id); if (!t) return;
      e.preventDefault();
      const header = $(".header");
      const top = t.getBoundingClientRect().top + scrollY - (header?.offsetHeight || 0) - 12;
      window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
    });
  })();

  // ===== Mobile menu auto-build (idempotent + re-init khi partials) =====
  function initMobileMenu() {
    const BP = 640;
    const nav = document.querySelector('.nav');
    const inner = document.querySelector('.nav .nav-inner');
    const menu = document.querySelector('.nav .menu');
    const cta  = document.querySelector('.nav .cta');
    if (!nav || !inner || !menu || !cta) return;

    let btn = document.getElementById('mMenuBtn');
    let sheet = document.getElementById('mSheet');

    function build(){
      if (btn && sheet) return;
      if (!btn) {
        btn = document.createElement('button');
        btn.className = 'm-menu-btn';
        btn.type = 'button';
        btn.id = 'mMenuBtn';
        btn.setAttribute('aria-haspopup','true');
        btn.setAttribute('aria-expanded','false');
        btn.setAttribute('aria-controls','mSheet');
        btn.innerHTML = `<i aria-hidden="true"></i><span class="sr-only">Mở menu</span>`;
        inner.insertBefore(btn, cta);
      }
      if (!sheet) {
        sheet = document.createElement('div');
        sheet.className = 'm-sheet';
        sheet.id = 'mSheet';
        sheet.setAttribute('aria-labelledby','mMenuBtn');
        sheet.setAttribute('aria-hidden','true');
        sheet.innerHTML = `<nav class="m-panel" role="navigation" aria-label="Menu di động"></nav>`;
        nav.appendChild(sheet);
        const panel = sheet.querySelector('.m-panel');
        panel.innerHTML = '';
        menu.querySelectorAll('a').forEach(a => {
          const c = a.cloneNode(true);
          c.classList.add('m-item');
          panel.appendChild(c);
        });
        sheet.addEventListener('click', (e) => { const a = e.target.closest('a'); if (a) close(); });
      }

      function close(){
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded','false');
        sheet.classList.remove('open');
        sheet.setAttribute('aria-hidden','true');
        document.removeEventListener('click', outside);
        document.removeEventListener('keydown', esc);
      }
      function open(){
        btn.classList.add('open');
        btn.setAttribute('aria-expanded','true');
        sheet.classList.add('open');
        sheet.setAttribute('aria-hidden','false');
        document.addEventListener('click', outside);
        document.addEventListener('keydown', esc);
      }
      const outside = (e)=>{ if (!sheet.contains(e.target) && e.target !== btn) close(); };
      const esc = (e)=>{ if (e.key === 'Escape') { close(); btn.focus(); } };

      if (!btn.dataset.bound){
        btn.addEventListener('click', (e) => {
          const openState = btn.getAttribute('aria-expanded') === 'true';
          openState ? close() : open();
          e.stopPropagation();
        });
        btn.dataset.bound = '1';
      }

      function sync(){
        const isMobile = window.innerWidth <= BP;
        sheet.style.display = isMobile ? '' : 'none';
        btn.style.display = isMobile ? '' : 'none';
        if (!isMobile) { btn.classList.remove('open'); btn.setAttribute('aria-expanded','false'); sheet.classList.remove('open'); sheet.setAttribute('aria-hidden','true'); }
      }
      sync();
      if (!window.__oasisMobileResizeBound){
        window.addEventListener('resize', sync, { passive:true });
        window.__oasisMobileResizeBound = true;
      }
    }

    build();
  }
  initMobileMenu();
  document.addEventListener('oasis:partials-ready', initMobileMenu);

  // ===== ONSCROLL FX (như bản của bạn) =====
  (function onscrollFX() {
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const $ = (s, c = document) => c.querySelector(s);
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const FX = { once: true, threshold: 0.35, rootMargin: "0px 0px -15% 0px", baseDelay: 0, step: 150 };

    function addFx(el, type = "fade-up", order = 0) {
      if (!el) return;
      el.classList.add("fx-item", `fx-${type}`, "fx-hide");
      el.style.setProperty("--d", FX.baseDelay + order * FX.step + "ms");
    }

    function tag() {
      const hero = $("#home");
      if (hero) {
        addFx($(".hero-title", hero), "fade-down", 0);
        addFx($(".subtitle", hero), "fade-up", 1);
        $$(".hero-actions .btn", hero).forEach((b, i) => addFx(b, "zoom-in", i + 2));
      }
      const prod = $("#products");
      if (prod) {
        addFx($("h2.title", prod), "fade-up", 0);
        addFx($("p.subtitle", prod), "fade-up", 1);
        $$(".products-grid .card", prod).forEach((el, i) => addFx(el, "flip-left", i));
      }
      const about = $("#about");
      if (about) {
        addFx($(".about-media", about), "fade-right", 0);
        addFx($(".about-copy", about), "fade-left", 1);
        $$(".about-copy .bullets li", about).forEach((li, i) => addFx(li, "fade-up", i + 2));
        $$(".about-copy .actions .btn", about).forEach((b, i) => addFx(b, "zoom-in", i + 2));
      }
      const services = $("#services");
      if (services) {
        addFx($("h2.title", services), "fade-up", 0);
        addFx($("p.subtitle", services), "fade-up", 1);
        $$(".services-grid .card", services).forEach((el, i) => addFx(el, "zoom-in", i));
      }
      const team = $("#team");
      if (team) {
        addFx($("h2.title", team), "fade-up", 0);
        $$(".team-grid .member", team).forEach((m, i) => addFx(m, "fade-up", i));
      }
      const gallery = $("#gallery");
      if (gallery) {
        addFx($("h2.title", gallery), "fade-up", 0);
        $$(".gallery-grid .card", gallery).forEach((f, i) => addFx(f, "fade-up", i));
      }
      const reviews = $("#reviews");
      if (reviews) {
        addFx($("h2.title", reviews), "fade-up", 0);
        addFx($("p.subtitle", reviews), "fade-up", 1);
      }
      const wiki = $("#wiki");
      if (wiki) {
        addFx($("h2.title", wiki), "fade-up", 0);
        $$(".wiki-grid .card", wiki).forEach((c, i) => addFx(c, "fade-up", i));
      }
      const map = $("#map");
      if (map) {
        addFx($("h2.title", map), "fade-up", 0);
        addFx($(".map", map), "zoom-in", 1);
      }
    }

    function observe() {
      const items = $$(".fx-item");
      if (!items.length) return;
      if (prefersReduced || !("IntersectionObserver" in window)) {
        items.forEach((el) => el.classList.remove("fx-hide"));
        return;
      }
      const seen = new WeakSet();
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("fx-show");
            e.target.classList.remove("fx-hide");
            if (FX.once) { seen.add(e.target); io.unobserve(e.target); }
          } else if (!FX.once) {
            e.target.classList.remove("fx-show");
            e.target.classList.add("fx-hide");
          }
        });
      }, { threshold: FX.threshold, rootMargin: FX.rootMargin });
      items.forEach((el) => io.observe(el));
      window.addEventListener("beforeunload", () => { items.forEach((el) => io.unobserve(el)); }, { once: true });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => { tag(); observe(); }, { once: true });
    } else { tag(); observe(); }
  })();
})();



//fix 


(async function includePartials(){
  const nodes = [...document.querySelectorAll('[data-include]')];
  // không có gì để làm
  if (!nodes.length) return;

  // tải & thay thế từng partial
  await Promise.all(nodes.map(async (el) => {
    const url = el.getAttribute('data-include');
    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      const html = await res.text();

      // chèn nội dung (giữ nguyên scope CSS của trang)
      const tpl = document.createElement('template');
      tpl.innerHTML = html.trim();
      el.replaceWith(tpl.content);   // thay <div data-include> bằng nội dung partial
    } catch (err) {
      console.error('[include]', url, err);
      el.outerHTML = `<!-- include failed: ${url} -->`;
    }
  }));

  // báo cho các script khác biết partials đã sẵn sàng (3.js của bạn đang lắng nghe sự kiện này)
  document.dispatchEvent(new CustomEvent('oasis:partials-ready'));
})();




// js cua san pham 








//js cua wiki

