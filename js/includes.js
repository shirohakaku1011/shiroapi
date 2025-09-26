// Nạp header/footer (partials), set active nav & thông báo đã sẵn sàng
(async () => {
  async function inject(el) {
    const src = el.getAttribute('data-include');
    const res = await fetch(src, { cache: 'no-store' });
    const html = await res.text();
    el.insertAdjacentHTML('afterend', html);
    el.remove();
  }

  async function includePartials() {
    const nodes = [...document.querySelectorAll('[data-include]')];
    await Promise.all(nodes.map(inject));
  }

  function setActiveNav() {
    const current = document.body.dataset.page; // home | products | services | wiki
    if (!current) return;
    document.querySelectorAll('.nav [data-nav]').forEach(a => {
      if (a.dataset.nav === current) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      } else {
        a.classList.remove('is-active');
        a.removeAttribute('aria-current');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await includePartials();
    setActiveNav();
    document.dispatchEvent(new CustomEvent('oasis:partials-ready'));
  });
})();
