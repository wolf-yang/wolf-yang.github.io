(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('has-js');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const map = document.querySelector('.research-map');
  const description = document.getElementById('lens-description');
  const lenses = document.querySelectorAll('[data-lens]');
  lenses.forEach((button) => {
    button.addEventListener('click', () => {
      lenses.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      if (map) map.dataset.focus = button.dataset.lens;
      if (description) description.textContent = button.dataset.description;
    });
  });

  // A manual pause lasts for this tab, including when switching languages.
  let paused = false;
  try { paused = sessionStorage.getItem('motion-paused') === 'true'; } catch (_) { /* Storage is optional. */ }
  const motionButton = document.querySelector('.motion-button');
  const syncMotion = () => {
    root.classList.toggle('motion-paused', paused || reducedMotion.matches);
    if (!motionButton) return;
    const label = paused ? motionButton.dataset.resumeLabel : motionButton.dataset.pauseLabel;
    motionButton.setAttribute('aria-label', label);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.querySelector('.motion-label').textContent = label;
    motionButton.querySelector('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';
  };
  syncMotion();
  motionButton?.addEventListener('click', () => {
    paused = !paused;
    try { sessionStorage.setItem('motion-paused', String(paused)); } catch (_) { /* Storage is optional. */ }
    syncMotion();
  });

  // Keep content visible without JavaScript, and reveal offscreen sections once.
  let observer;
  const reveals = document.querySelectorAll('.reveal');
  const revealAll = () => {
    observer?.disconnect();
    reveals.forEach((item) => item.classList.add('is-visible'));
  };
  if ('IntersectionObserver' in window && !reducedMotion.matches && !paused) {
    try {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.08 });
      reveals.forEach((item) => {
        if (item.getBoundingClientRect().top < window.innerHeight * 0.94) return;
        item.classList.add('will-reveal');
        observer.observe(item);
      });
    } catch (_) { revealAll(); }
  }
  const motionChange = () => {
    syncMotion();
    if (reducedMotion.matches) revealAll();
  };
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', motionChange);
  else if (reducedMotion.addListener) reducedMotion.addListener(motionChange);

  // Update a small reading indicator at most once per rendered scroll frame.
  let framePending = false;
  const updateProgress = () => {
    const distance = root.scrollHeight - window.innerHeight;
    const progress = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    root.style.setProperty('--progress', progress.toFixed(4));
    framePending = false;
  };
  const queueProgress = () => {
    if (framePending) return;
    framePending = true;
    window.requestAnimationFrame(updateProgress);
  };
  window.addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', queueProgress, { passive: true });
  window.addEventListener('load', queueProgress, { once: true });
  updateProgress();

  // A soft light follows the pointer; the diagram itself stays still and readable.
  const stage = document.querySelector('.graph-stage');
  let pointerFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  stage?.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || paused || event.pointerType !== 'mouse') return;
    const bounds = stage.getBoundingClientRect();
    pointerX = event.clientX - bounds.left;
    pointerY = event.clientY - bounds.top;
    if (pointerFrame) return;
    pointerFrame = window.requestAnimationFrame(() => {
      stage.style.setProperty('--glow-x', `${pointerX}px`);
      stage.style.setProperty('--glow-y', `${pointerY}px`);
      pointerFrame = 0;
    });
  }, { passive: true });
  stage?.addEventListener('pointerleave', () => {
    if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    stage.style.removeProperty('--glow-x');
    stage.style.removeProperty('--glow-y');
  });
})();
