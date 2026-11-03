(() => {
  const intro = document.getElementById('logo-intro');
  const entrance = document.getElementById('entrance');
  const nav = document.querySelector('nav');
  // Refresh replays the entrance even after using a section link.
  // A fresh visit to a shared section URL still goes directly to that section.
  const isReload = performance.getEntriesByType('navigation')[0]?.type === 'reload';
  const hasDestination = location.hash.length > 1 && !isReload;
  if (isReload && location.hash) {
    history.replaceState(history.state, '', location.pathname + location.search);
  }
  if (!hasDestination) {
    history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
  let introTimer;
  let done = false;

  function finishIntro() {
    if (done) return;
    done = true;
    clearTimeout(introTimer);
    // Crossfade before the GIF loops; keep its original playback and colors.
    intro.classList.add('is-finished');
    document.body.classList.add('intro-revealing');
    let fadeFinished = false;
    const completeFade = () => {
      if (fadeFinished) return;
      fadeFinished = true;
      intro.hidden = true;
      document.body.classList.remove('intro-playing');
      for (const child of document.body.children) {
        if (child.dataset.introInert === 'true') { child.inert = false; delete child.dataset.introInert; }
      }
      entrance.inert = false;
      if (intro.contains(document.activeElement)) entrance.querySelector('a').focus({ preventScroll: true });
      render();
    };
    intro.addEventListener('transitionend', (event) => {
      if (event.target === intro && event.propertyName === 'opacity') completeFade();
    });
    // Fallback if the browser does not dispatch transitionend.
    setTimeout(completeFade, 1100);
  }
  entrance.hidden = false;
  const laptop = entrance.querySelector('.laptop');
  const screen = entrance.querySelector('.laptop-screen');
  const heading = entrance.querySelector('.entrance-heading');
  const hint = entrance.querySelector('.entrance-scroll');
  let queued = false;
  const clamp = (n) => Math.max(0, Math.min(1, n));

  function render() {
    queued = false;
    const rect = entrance.getBoundingClientRect();
    const stageHeight = entrance.querySelector('.entrance-stage').clientHeight;
    const progress = clamp(-rect.top / (entrance.offsetHeight - stageHeight));
    const zoom = progress * progress * (3 - 2 * progress);
    const scaleEnd = Math.max(innerWidth / screen.offsetWidth, stageHeight / screen.offsetHeight) * 1.12;
    laptop.style.transform = `translateY(${-zoom * stageHeight * .06}px) scale(${1 + zoom * (scaleEnd - 1)})`;
    heading.style.opacity = 1 - clamp(progress * 5);
    hint.style.opacity = 1 - clamp(progress * 5);
    hint.style.visibility = progress > .25 ? 'hidden' : 'visible';
    for (const child of screen.children) child.style.opacity = 1 - clamp((progress - .65) / .3);
    const active = rect.bottom > stageHeight + 2;
    document.body.classList.toggle('in-entrance', active);
    nav.inert = active;
  }
  function scheduleRender() { if (!queued) { queued = true; requestAnimationFrame(render); } }
  window.addEventListener('scroll', scheduleRender, { passive: true });
  window.addEventListener('resize', scheduleRender);
  window.addEventListener('pageshow', () => {
    if (!hasDestination && !done) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    scheduleRender();
  });

  render();
  // Preserve actual section links, but replay the entrance when refreshing home.
  if (hasDestination) { intro.hidden = true; done = true; return; }
  intro.hidden = false;
  document.body.classList.add('intro-playing');
  for (const child of document.body.children) {
    if (child !== intro && !child.inert && child.tagName !== 'SCRIPT') { child.inert = true; child.dataset.introInert = 'true'; }
  }
  const skip = document.getElementById('skip-intro');
  skip.focus({ preventScroll: true });
  skip.addEventListener('click', finishIntro);
  intro.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') finishIntro();
    if (event.key === 'Tab') { event.preventDefault(); skip.focus(); }
  });
  const logo = intro.querySelector('img');
  // Start the one-second fade before the 4,960 ms animation ends.
  const startTimer = () => { clearTimeout(introTimer); introTimer = setTimeout(finishIntro, 3900); };
  logo.addEventListener('error', finishIntro, { once: true });
  if (logo.complete) startTimer();
  else { logo.addEventListener('load', startTimer, { once: true }); introTimer = setTimeout(finishIntro, 20000); }
})();
