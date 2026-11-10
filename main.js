(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const button = document.querySelector('.motion-button');
  const reveals = document.querySelectorAll('.reveal');
  const navLinks = [...document.querySelectorAll('.site-header nav a')];
  const sections = [...document.querySelectorAll('main > section[id]')];
  let paused = false;
  let observer;
  let scheduled = false;
  let activeSection = '';
  try { paused = sessionStorage.getItem('motion-paused') === 'true'; } catch (_) { /* Optional preference storage. */ }
  root.classList.add('has-js');

  const revealAll = () => {
    observer?.disconnect();
    reveals.forEach((item) => item.classList.add('is-visible'));
  };
  const syncMotion = () => {
    root.classList.toggle('motion-paused', paused || reduced.matches);
    if (paused || reduced.matches) revealAll();
    if (!button) return;
    const label = paused ? button.dataset.resumeLabel : button.dataset.pauseLabel;
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.setAttribute('aria-pressed', String(paused));
    button.querySelector('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';
  };
  syncMotion();
  button?.addEventListener('click', () => {
    paused = !paused;
    try { sessionStorage.setItem('motion-paused', String(paused)); } catch (_) { /* Optional preference storage. */ }
    syncMotion();
  });
  if (reduced.addEventListener) reduced.addEventListener('change', syncMotion);
  else if (reduced.addListener) reduced.addListener(syncMotion);

  // Content is visible by default, including without JavaScript.
  if ('IntersectionObserver' in window && !paused && !reduced.matches) {
    try {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.05 });
      reveals.forEach((item) => {
        if (item.getBoundingClientRect().top <= window.innerHeight * 0.94) return;
        item.classList.add('will-reveal');
        observer.observe(item);
      });
    } catch (_) { revealAll(); }
  }

  const updateReading = () => {
    const distance = root.scrollHeight - window.innerHeight;
    const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    root.style.setProperty('--progress', progress.toFixed(4));
    let current = sections[0]?.id || '';
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= Math.max(155, window.innerHeight * 0.28)) current = section.id;
    });
    if (current !== activeSection) {
      activeSection = current;
      navLinks.forEach((link) => {
        if (link.getAttribute('href') === `#${current}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    scheduled = false;
  };
  const queueReading = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateReading);
  };
  window.addEventListener('scroll', queueReading, { passive: true });
  window.addEventListener('resize', queueReading, { passive: true });
  window.addEventListener('load', queueReading, { once: true });
  document.querySelectorAll('.research-details').forEach((details) => details.addEventListener('toggle', queueReading));
  updateReading();
})();
