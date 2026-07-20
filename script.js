(() => {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const heroBoard = document.querySelector('#hero-board');
  const lensToggle = document.querySelector('.lens-toggle');
  const choicePanel = document.querySelector('#choice-panel');
  const decisionReveal = document.querySelector('#decision-reveal');
  const yourCall = document.querySelector('#your-call');
  const resetDecision = document.querySelector('#reset-decision');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const setHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  const closeMenu = () => {
    if (!menuToggle || !nav) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.querySelector('.sr-only').textContent = 'Open navigation';
    nav.classList.remove('open');
    header?.classList.remove('nav-open');
    document.body.classList.remove('menu-open');
  };

  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.querySelector('.sr-only').textContent = open ? 'Close navigation' : 'Open navigation';
    nav?.classList.toggle('open', open);
    header?.classList.toggle('nav-open', open);
    document.body.classList.toggle('menu-open', open);
  });

  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  lensToggle?.addEventListener('click', () => {
    const active = !heroBoard.classList.contains('lens-active');
    heroBoard.classList.toggle('lens-active', active);
    lensToggle.setAttribute('aria-pressed', String(active));
    lensToggle.querySelector('b').textContent = active ? 'ON' : 'OFF';
  });

  document.querySelectorAll('[data-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      const choice = button.dataset.choice;
      document.querySelectorAll('[data-choice]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      yourCall.textContent = choice === 'bank'
        ? 'You banked the 184 points. That protects your lead and removes the next-roll risk.'
        : 'You rolled again. That keeps the upside alive—but every one of those 184 points stays exposed.';
      choicePanel.hidden = true;
      decisionReveal.hidden = false;
      decisionReveal.focus?.();
    });
  });

  resetDecision?.addEventListener('click', () => {
    decisionReveal.hidden = true;
    choicePanel.hidden = false;
    document.querySelectorAll('[data-choice]').forEach((item) => item.removeAttribute('aria-pressed'));
    choicePanel.querySelector('button')?.focus();
  });

  const revealItems = document.querySelectorAll('[data-reveal]');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('revealed'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -35px' });
    revealItems.forEach((item) => observer.observe(item));
  }

  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
