(() => {
  'use strict';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------------- Nav ---------------- */
  const nav = document.getElementById('siteNav');
  const navLinks = document.getElementById('navLinks');
  const navToggle = document.getElementById('navToggle');

  function onScrollNav(){
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!open));
    navLinks.classList.toggle('open', !open);
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
  }));

  /* ---------------- Smooth anchor scroll (incl. data-scroll-to buttons) ---------------- */
  function scrollToId(id){
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    el.classList.add('pulse-target');
    setTimeout(() => el.classList.remove('pulse-target'), 1200);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      scrollToId(id);
    });
  });
  document.querySelectorAll('[data-scroll-to]').forEach(btn => {
    btn.addEventListener('click', () => scrollToId(btn.dataset.scrollTo));
  });

  document.getElementById('scrollCue').addEventListener('click', () => {
    scrollToId('identite');
  });

  /* ---------------- Reveal on scroll ---------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------------- Animated counters ---------------- */
  const counters = document.querySelectorAll('[data-count]');
  function animateCount(el){
    const target = parseInt(el.dataset.count, 10);
    if (reduceMotion.matches || !target){ el.textContent = target || el.textContent; return; }
    const dur = 900;
    const start = performance.now();
    function tick(now){
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (counters.length){
    const cio = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting){ animateCount(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(el => cio.observe(el));
  }

  /* ---------------- Cursor glow (desktop only) ---------------- */
  const glow = document.getElementById('cursorGlow');
  if (matchMedia('(pointer:fine)').matches && glow){
    let gx = -9999, gy = -9999, cx = -9999, cy = -9999, raf = null;
    addEventListener('pointermove', e => {
      gx = e.clientX; gy = e.clientY;
      if (raf === null) raf = requestAnimationFrame(loop);
    }, { passive: true });
    function loop(){
      cx += (gx - cx) * 0.16;
      cy += (gy - cy) * 0.16;
      glow.style.left = cx + 'px';
      glow.style.top = cy + 'px';
      if (Math.abs(gx - cx) > 0.5 || Math.abs(gy - cy) > 0.5){
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }
  }

  /* ---------------- Hold-to-apply interactive ---------------- */
  const holdBtn = document.getElementById('holdBtn');
  const holdRing = document.getElementById('holdRing');
  const holdLabel = document.getElementById('holdLabel');
  const revealBlock = document.getElementById('revealBlock');
  const CIRC = 2 * Math.PI * 69;
  holdRing.style.strokeDasharray = String(CIRC);

  let holdRaf = null, holdStart = 0, holding = false, progress = 0, completed = false;
  const HOLD_MS = 1100;

  function setRing(p){
    holdRing.style.strokeDashoffset = String(CIRC * (1 - p));
  }

  function holdTick(now){
    if (!holding){ return; }
    const p = Math.min(1, (now - holdStart) / HOLD_MS);
    progress = p;
    setRing(p);
    if (p >= 1){
      finishHold();
      return;
    }
    holdRaf = requestAnimationFrame(holdTick);
  }

  function releaseEase(){
    if (holdRaf) cancelAnimationFrame(holdRaf);
    function ease(){
      progress *= 0.85;
      setRing(progress);
      if (progress > 0.01){
        requestAnimationFrame(ease);
      } else {
        progress = 0; setRing(0);
      }
    }
    if (!completed) ease();
  }

  function startHold(){
    if (completed) return;
    holding = true;
    holdStart = performance.now() - progress * HOLD_MS;
    if (reduceMotion.matches){ finishHold(); return; }
    holdRaf = requestAnimationFrame(holdTick);
  }
  function stopHold(){
    if (!holding) return;
    holding = false;
    releaseEase();
  }
  function finishHold(){
    holding = false; completed = true; progress = 1;
    setRing(1);
    holdBtn.classList.add('done');
    holdLabel.innerHTML = 'Candidature<br>ouverte';
    revealBlock.hidden = false;
    revealBlock.style.animation = 'none';
  }

  holdBtn.addEventListener('pointerdown', e => { e.preventDefault(); startHold(); });
  addEventListener('pointerup', stopHold);
  addEventListener('pointercancel', stopHold);
  holdBtn.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat){ e.preventDefault(); startHold(); }
  });
  holdBtn.addEventListener('keyup', e => {
    if (e.key === 'Enter' || e.key === ' '){ stopHold(); }
  });

  /* ---------------- Network canvas background ---------------- */
  const canvas = document.getElementById('netCanvas');
  if (canvas && !reduceMotion.matches){
    const ctx = canvas.getContext('2d');
    let w, h, dpr, points = [], animId = null, visible = true;

    function resize(){
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.round((w * h) / 22000));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18
      }));
    }

    function step(){
      if (!visible){ animId = null; return; }
      ctx.clearRect(0, 0, w, h);
      for (const p of points){
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      const maxDist = 140;
      for (let i = 0; i < points.length; i++){
        for (let j = i + 1; j < points.length; j++){
          const a = points[i], b = points[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist){
            ctx.strokeStyle = `rgba(95,196,255,${(1 - d / maxDist) * 0.18})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const p of points){
        ctx.fillStyle = 'rgba(95,196,255,.55)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2); ctx.fill();
      }
      animId = requestAnimationFrame(step);
    }

    resize();
    step();
    let resizeT;
    addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(resize, 200); });

    document.addEventListener('visibilitychange', () => {
      visible = document.visibilityState === 'visible';
      if (visible && animId === null) step();
    });

    const heroIo = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        visible = entry.isIntersecting && document.visibilityState === 'visible';
        if (visible && animId === null) step();
      });
    }, { threshold: 0 });
    heroIo.observe(document.getElementById('home'));
  }

  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches && canvas){
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  });
})();
