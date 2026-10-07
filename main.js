/* Yash Agarwal - portfolio interactions & animations */

(function () {
  'use strict';

  // -- Always open at the top (hero) on load/reload ------------------------
  // In-page links scroll smoothly without adding #section to the address,
  // so a reload never jumps back to the last section visited.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);
  window.addEventListener('pageshow', () => window.scrollTo(0, 0));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target && id !== 'top') return;
    e.preventDefault();
    if (id === 'top' || !target) window.scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // -- Sticky nav state ----------------------------------------------------
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (window.scrollY > 8) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // -- Reveal on scroll ----------------------------------------------------
  const reveals = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = parseInt(el.dataset.delay || '0', 10);
        setTimeout(() => el.classList.add('is-visible'), delay);
        io.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  reveals.forEach((el) => io.observe(el));

  // -- Counter animations --------------------------------------------------
  const counters = document.querySelectorAll('[data-counter]');
  const formatNum = (n, fmt) => {
    if (fmt === 'comma') return Math.round(n).toLocaleString('en-US');
    return Math.round(n).toString();
  };
  const animateCounter = (el) => {
    const target = parseFloat(el.dataset.counter);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const fmt = el.dataset.format || '';
    const dur = 1600;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const v = target * ease(t);
      el.textContent = prefix + formatNum(v, fmt) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + formatNum(target, fmt) + suffix;
    };
    requestAnimationFrame(tick);
  };
  const counterIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterIO.unobserve(entry.target);
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((c) => counterIO.observe(c));

  // -- Magnetic-ish CTA hover (subtle) -------------------------------------
  document.querySelectorAll('.btn--primary').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // -- Process rail: scroll-driven fill -----------------------------------
  const railList = document.querySelector('.process__list--v2');
  if (railList) {
    const updateRail = () => {
      const rect = railList.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progress: 0 when top of list reaches 70% viewport; 1 when bottom reaches 30% viewport
      const start = vh * 0.7;
      const end = vh * 0.3;
      const total = (rect.height) + (start - end);
      const traveled = start - rect.top;
      const p = Math.max(0, Math.min(1, traveled / total));
      // Map progress to actual fill height in px (matches the ::after geometry)
      const fillMax = rect.height - 108; // top 54 + bottom 54
      const fillPx = Math.max(0, fillMax * p);
      railList.style.setProperty('--rail-progress', fillPx + 'px');
      if (p > 0.01 && p < 0.99) railList.classList.add('is-rail-active');
      else railList.classList.remove('is-rail-active');
    };
    updateRail();
    window.addEventListener('scroll', updateRail, { passive: true });
    window.addEventListener('resize', updateRail);
  }

  // -- Screenshot placeholders --------------------------------------------
  // Each .shot shows its <img> when the file exists in images/work/,
  // and falls back to the dashed placeholder when it doesn't.
  document.querySelectorAll('.shot').forEach((shot) => {
    const img = shot.querySelector('.shot__img');
    if (!img) return;
    const markEmpty = () => shot.classList.add('is-empty');
    const markLoaded = () => {
      shot.classList.remove('is-empty');
      shot.classList.add('is-loaded');
    };
    img.addEventListener('error', markEmpty);
    img.addEventListener('load', markLoaded);
    if (img.complete) {
      if (img.naturalWidth === 0) markEmpty();
      else markLoaded();
    }
  });

  // -- Live funnel links ---------------------------------------------------
  // Work links still set to the "#" placeholder do nothing when clicked,
  // instead of opening a blank tab. Real URLs open in a new tab as normal.
  document.querySelectorAll('.work a[href="#"]').forEach((a) => {
    a.addEventListener('click', (e) => e.preventDefault());
  });

  // -- Contact: copy buttons ----------------------------------------------
  document.querySelectorAll('.gs-copy').forEach((btn) => {
    const original = btn.innerHTML;
    const tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy || '');
        btn.classList.add('is-copied');
        btn.innerHTML = tick;
        setTimeout(() => {
          btn.classList.remove('is-copied');
          btn.innerHTML = original;
        }, 1600);
      } catch (err) { /* clipboard unavailable: the link itself still works */ }
    });
  });

  // -- Contact: booking card shows next week's Mon-Fri dates ---------------
  const schedDays = document.querySelectorAll('#schedDays .sched__day b');
  if (schedDays.length === 5) {
    const d = new Date();
    const toNextMonday = ((8 - d.getDay()) % 7) || 7;
    d.setDate(d.getDate() + toNextMonday);
    schedDays.forEach((b, i) => {
      const day = new Date(d);
      day.setDate(d.getDate() + i);
      b.textContent = day.getDate();
    });
  }

  // -- Footer year ---------------------------------------------------------
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
