// OASIS VR ZONE – App JS (hamburger, infinite slider, section fade, dropdown, reviews, anchors)
(() => {
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

    // ===== Footer year =====
    const y = $("#y");
    if (y) y.textContent = new Date().getFullYear();

    // ===== Contact dropdown (click/escape/outside) =====
    (function contactDropdown() {
        const wrap = $(".dropdown");
        if (!wrap) return;
        const btn = $("#contactBtn");
        const menu = wrap.querySelector(".dropdown-menu");
        let openState = false;
        function close() {
            openState = false;
            btn?.setAttribute("aria-expanded", "false");
            menu?.classList.remove("open");
        }
        function open() {
            openState = true;
            btn?.setAttribute("aria-expanded", "true");
            menu?.classList.add("open");
        }
        btn?.addEventListener("click", (e) => {
            openState ? close() : open();
            e.stopPropagation();
        });
        document.addEventListener("click", (e) => {
            if (!wrap.contains(e.target)) close();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") close();
        });
    })();

    // ===== Mobile hamburger / drawer =====
    (function mobileMenu() {
        const btn = $("#hamburger");
        const drawer = $("#mobileMenu");
        if (!btn || !drawer) return;
        function set(open) {
            btn.setAttribute("aria-expanded", open ? "true" : "false");
            drawer.classList.toggle("open", open);
        }
        btn.addEventListener("click", (e) => {
            const open = btn.getAttribute("aria-expanded") !== "true";
            set(open);
            e.stopPropagation();
        });
        // close on outside / Esc / link click
        document.addEventListener("click", (e) => {
            if (!drawer.contains(e.target) && e.target !== btn) {
                set(false);
            }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") set(false);
        });
        $$("#mobileMenu a").forEach((a) =>
            a.addEventListener("click", () => set(false))
        );
    })();

    // ===== EVENTS: Infinite triple slider (3/2/1) =====
    (function tripleSliderInfinite() {
        const root = $("#events3");
        if (!root) return;
        const viewport = root.querySelector(".viewport");
        const track = root.querySelector(".track");
        const prev = root.querySelector(".prev");
        const next = root.querySelector(".next");
        const dotsWrap = root.querySelector(".dots");

        // Keep an immutable copy of original slides
        const sourceSlides = $$(".slide3", track).map((s) => s.cloneNode(true));

        let nShow = 3,
            gap = 16,
            idx = 0,
            sw = 0,
            auto = null,
            isAnimating = false;

        function calcShow() {
            nShow = innerWidth < 640 ? 1 : innerWidth < 1024 ? 2 : 3;
        }

        function setWidths() {
            const w = viewport.clientWidth;
            sw = (w - gap * (nShow - 1)) / nShow;
            $$(".slide3", track).forEach((s) => (s.style.width = sw + "px"));
        }

        function build() {
            // Wipe track and rebuild with clones to enable infinite loop
            track.innerHTML = "";
            calcShow();
            // clones: tail + originals + head
            const headClones = sourceSlides
                .slice(0, nShow)
                .map((n) => n.cloneNode(true));
            const tailClones = sourceSlides
                .slice(-nShow)
                .map((n) => n.cloneNode(true));
            [
                ...tailClones,
                ...sourceSlides.map((n) => n.cloneNode(true)),
                ...headClones,
            ].forEach((n) => track.appendChild(n));
            setWidths();
            // Start at first real slide offset (after tail clones)
            idx = nShow;
            jump(idx);
            renderDots();
            restart();
        }

        function pages() {
            return sourceSlides.length;
        }

        function activeIndex() {
            // 0..(len-1)
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
                .map(
                    (_, i) =>
                        `<span class="dot${
                            i === activeIndex() ? " active" : ""
                        }" data-i="${i}"></span>`
                )
                .join("");
            $$(".dot", dotsWrap).forEach((d) =>
                d.addEventListener("click", () =>
                    go(nShow + parseInt(d.dataset.i))
                )
            );
        }

        function transformTo(i, animate = true) {
            isAnimating = true;
            track.style.transition = animate
                ? "transform .6s cubic-bezier(.2,.7,.2,1)"
                : "none";
            track.style.transform = `translateX(${-i * (sw + gap)}px)`;
        }

        function jump(i) {
            transformTo(i, false);
            requestAnimationFrame(() => {
                isAnimating = false;
            });
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
            if (idx >= len + nShow) {
                // passed last head clone → wrap to first real
                idx = nShow;
                jump(idx);
            } else if (idx < nShow) {
                // passed first tail clone → wrap to last real
                idx = len + nShow - 1;
                jump(idx);
            } else {
                isAnimating = false;
            }
        });

        function prevStep() {
            go(idx - 1);
        }
        function nextStep() {
            go(idx + 1);
        }

        function restart() {
            clearInterval(auto);
            auto = setInterval(nextStep, 4200);
        }

        // Drag / swipe
        (function pointer() {
            let startX = null,
                startIdx = null;
            viewport.addEventListener("pointerdown", (e) => {
                startX = e.clientX;
                startIdx = idx;
                viewport.setPointerCapture(e.pointerId);
                clearInterval(auto);
            });
            viewport.addEventListener("pointermove", (e) => {
                if (startX == null) return;
                const dx = e.clientX - startX;
                track.style.transition = "none";
                track.style.transform = `translateX(${
                    -(startIdx * (sw + gap)) + dx
                }px)`;
            });
            viewport.addEventListener("pointerup", (e) => {
                if (startX == null) return;
                const dx = e.clientX - startX;
                if (Math.abs(dx) > 40) {
                    dx < 0 ? nextStep() : prevStep();
                } else {
                    go(startIdx);
                }
                startX = null;
                startIdx = null;
                restart();
            });
            root.addEventListener("mouseenter", () => clearInterval(auto));
            root.addEventListener("mouseleave", restart);
        })();

        prev?.addEventListener("click", prevStep);
        next?.addEventListener("click", nextStep);
        window.addEventListener("resize", () => build());
        build();
    })();

    // ===== REVIEWS: running ticker (loop + pause on hover) =====
    (function reviewsTicker() {
        const rowA = $("#rowA");
        const rowB = $("#rowB");
        if (!rowA || !rowB) return;
        const reviews = [
            { name: "Huy", text: "Headset cực mịn, passthrough quá đẹp!" },
            { name: "My", text: "Lắp đặt tận nơi nhanh gọn." },
            { name: "Khoa", text: "Haptics chân thật, đã tai đã mắt." },
            { name: "An", text: "Không gian demo đúng vibe Night City." },
            { name: "Linh", text: "Tracking chính xác, không trôi tay." },
            { name: "Minh", text: "Tư vấn nhiệt tình, dễ hiểu." },
            { name: "Quang", text: "Giá hợp lý, nhiều combo." },
            { name: "Ngọc", text: "Workshop Unity rất đáng tiền." },
            { name: "Nhi", text: "Thiết kế web nhìn mê luôn!" },
            { name: "Tuấn", text: "Sẽ quay lại trải nghiệm." },
        ];
        function star() {
            return `<svg class="star" viewBox="0 0 24 24" fill="gold" width="16" height="16"><path d="M12 2l2.9 6.7 7.1.6-5.3 4.6 1.6 7-6.3-3.8-6.3 3.8 1.6-7L2 9.3l7.1-.6L12 2z"/></svg>`;
        }
        function avatar(n) {
            const c = (n || "?").charAt(0).toUpperCase();
            return `<svg viewBox='0 0 40 40' width='20' height='20'><defs><linearGradient id='g${c}' x1='0' x2='1'><stop stop-color='#00e6ff'/><stop offset='1' stop-color='#ff25ff'/></linearGradient></defs><circle cx='20' cy='20' r='19' fill='url(#g${c})' opacity='.35'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='#eaf7ff' font-family='Inter,system-ui' font-weight='800'>${c}</text></svg>`;
        }
        function rowHtml() {
            return reviews
                .map(
                    (r) =>
                        `<span class='pill'>${star()}<span class='avatar'>${avatar(
                            r.name
                        )}</span><strong>${r.name}</strong> ★★★★★ – ${
                            r.text
                        }</span>`
                )
                .join("");
        }
        rowA.innerHTML = rowHtml() + rowHtml();
        rowB.innerHTML = rowHtml() + rowHtml();

        $$(".ticker .row").forEach((r) => {
            r.addEventListener(
                "mouseenter",
                () => (r.style.animationPlayState = "paused")
            );
            r.addEventListener(
                "mouseleave",
                () => (r.style.animationPlayState = "running")
            );
        });
    })();

    // ===== Section fade-in/out (no movement) =====
    (function sectionFade() {
        const sections = $$(".fx-section");
        if (!sections.length) return;
        if (!("IntersectionObserver" in window)) {
            sections.forEach((s) => s.classList.add("in"));
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add("in");
                    } else {
                        e.target.classList.remove("in");
                    }
                });
            },
            { threshold: 0.2 }
        );
        sections.forEach((s) => io.observe(s));
    })();

    // ===== Smooth anchor scroll (accounts for fixed header height) =====
    (function smoothAnchors() {
        $$('a[href^="#"]').forEach((a) =>
            a.addEventListener("click", (e) => {
                const id = a.getAttribute("href");
                const t = id && $(id);
                if (!t) return;
                e.preventDefault();
                const header = $(".header");
                const top =
                    t.getBoundingClientRect().top +
                    scrollY -
                    (header?.offsetHeight || 0) -
                    12;
                scrollTo({ top, behavior: "smooth" });
            })
        );
    })();
})();


// ===== MOBILE NAV: toggle hamburger/drawer =====
(() => {
  const btn = document.getElementById('hamburger');
  const drawer = document.getElementById('mobileMenu');
  if(!btn || !drawer) return;

  function close() {
    btn.setAttribute('aria-expanded','false');
    drawer.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }
  function open() {
    btn.setAttribute('aria-expanded','true');
    drawer.classList.add('open');
    document.body.classList.add('no-scroll');
  }

  btn.addEventListener('click', (e) => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    isOpen ? close() : open();
    e.stopPropagation();
  });

  // click ngoài để đóng
  document.addEventListener('click', (e)=>{
    if (!drawer.contains(e.target) && !btn.contains(e.target)) close();
  });

  // bấm link trong drawer thì đóng
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  // ESC để đóng
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
})();
