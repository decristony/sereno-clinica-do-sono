(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const nav = document.querySelector('.nav');
  const clockT = document.getElementById('clockT');
  const clockB = document.getElementById('clockB');
  const daySecs = [...document.querySelectorAll('.morning, .dawn, .foot')];

  // menu + relógio da noite (22h → 7h conforme a página desce)
  function onScroll() {
    const y = scrollY;
    nav.classList.toggle('solid', y > 10);
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, y / max) : 0;
    const mins = 22 * 60 + Math.round(p * 9 * 60 / 15) * 15;
    const h = Math.floor(mins / 60) % 24, m = mins % 60;
    clockT.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    clockB.style.setProperty('--p', p.toFixed(3));
    const day = daySecs.some(s => { const r = s.getBoundingClientRect(); return r.top < 70 && r.bottom > 70; });
    nav.classList.toggle('day', day);
    const mid = daySecs.some(s => { const r = s.getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; });
    document.body.classList.toggle('is-day', mid);
  }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

  // revelar
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  // HERO: a luz segue o cursor (desktop) ou o dedo (mobile); parada, ela "respira" sobre o rosto
  const hero = document.querySelector('.hero');
  const mobile = matchMedia('(max-width: 760px)');
  const rest = () => mobile.matches ? [innerWidth * .52, hero.offsetHeight * .3] : [innerWidth * .615, hero.offsetHeight * .33];
  let [tx, ty] = rest(), cx = tx, cy = ty, raf = null, idle;
  const set = () => { hero.style.setProperty('--x', cx + 'px'); hero.style.setProperty('--y', cy + 'px'); };
  set();
  function loop() {
    cx += (tx - cx) * .12; cy += (ty - cy) * .12; set();
    raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > .3) ? requestAnimationFrame(loop) : null;
  }
  function move(x, y) {
    const r = hero.getBoundingClientRect();
    tx = x - r.left; ty = y - r.top;
    hero.classList.remove('breath');
    clearTimeout(idle);
    idle = setTimeout(() => { if (!reduce) hero.classList.add('breath'); }, 1800);
    if (reduce) { cx = tx; cy = ty; set(); return; }
    if (!raf) raf = requestAnimationFrame(loop);
  }
  hero.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') move(e.clientX, e.clientY); });
  hero.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && !e.target.closest('a,button')) move(e.clientX, e.clientY); });
  hero.addEventListener('touchmove', e => { const t = e.touches[0]; if (t && !e.target.closest('.hero-copy')) move(t.clientX, t.clientY); }, { passive: true });
  hero.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { [tx, ty] = rest(); if (!raf && !reduce) raf = requestAnimationFrame(loop); } });
  addEventListener('resize', () => { [tx, ty] = rest(); cx = tx; cy = ty; set(); });
  if (!reduce) hero.classList.add('breath');

  // janelas que acendem
  const lamps = [...document.querySelectorAll('.lamp:not(.lamp-cta)')];
  if (hover) {
    lamps.forEach(l => {
      l.addEventListener('pointermove', e => { const r = l.getBoundingClientRect(); l.style.setProperty('--lx', (e.clientX - r.left) + 'px'); l.style.setProperty('--ly', (e.clientY - r.top) + 'px'); l.classList.add('on'); });
      l.addEventListener('pointerleave', () => l.classList.remove('on'));
    });
  } else {
    const lo = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('on', e.isIntersecting)), { rootMargin: '-30% 0px -30% 0px' });
    lamps.forEach(l => lo.observe(l));
  }

  // vídeo da manhã
  const vid = document.querySelector('.mn-video');
  if (vid) {
    if (reduce) { vid.removeAttribute('autoplay'); vid.pause(); }
    else new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? vid.play().catch(() => {}) : vid.pause()), { threshold: .2 }).observe(vid);
  }

  // ciclos de sono + hipnograma
  const wake = document.getElementById('wake'), wakeOut = document.getElementById('wakeOut');
  const chips = document.getElementById('chips');
  const svg = document.getElementById('hypno');
  const bedT = document.getElementById('bedT'), cycN = document.getElementById('cycN'), sleepT = document.getElementById('sleepT');
  const fmt = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  let sel = 5;
  function draw(n) {
    const W = mobile.matches ? 380 : 600, H = mobile.matches ? 200 : 220, L = 66, R = 10, T = 14, B = 34;
    const total = 15 + n * 90; const sx = m => L + m / total * (W - L - R);
    const st = (H - B - T) / 4, lv = [0, 1, 2, 3, 4].map(i => T + i * st); // acordado, REM, leve(N1), N2, profundo
    let pts = [[0, 0], [15, 0]];
    for (let c = 0; c < n; c++) {
      const s = 15 + c * 90, deep = Math.max(.15, .5 - c * .1), rem = .1 + c * .045;
      const d1 = 90 * (1 - rem - deep) / 2;
      pts.push([s + 2, 2], [s + 8, 3], [s + 8 + d1 * .5, 3], [s + 10 + d1 * .5, 4], [s + 10 + d1 * .5 + 90 * deep, 4], [s + 12 + d1 * .5 + 90 * deep, 3], [s + 90 * (1 - rem) - 2, 3], [s + 90 * (1 - rem), 1], [s + 89, 1]);
      if (c === n - 1) pts.push([s + 90, 0]);
    }
    let d = '';
    pts.forEach(([m, l], i) => { const x = sx(m).toFixed(1), y = lv[l]; d += (i ? (' H' + x + ' V' + y) : ('M' + x + ' ' + y)); });
    const area = d + ` V${H - B} H${L} Z`;
    let grid = '', lbls = '';
    for (let c = 0; c <= n; c++) { const x = sx(15 + c * 90).toFixed(1); grid += `<line x1="${x}" x2="${x}" y1="${T}" y2="${H - B}"/>`; }
    const bed = +wake.value - total;
    for (let c = 0; c <= n; c += (n > 4 || mobile.matches ? 2 : 1)) lbls += `<text x="${sx(15 + c * 90)}" y="${H - 12}" text-anchor="middle">${fmt(bed + 15 + c * 90)}</text>`;
    ['Acordado', 'REM', 'Leve', 'Médio', 'Profundo'].forEach((t, i) => lbls += `<text x="0" y="${lv[i] + 4}">${t}</text>`);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `<defs><linearGradient id="hg" x1="0" x2="1"><stop offset="0" stop-color="#9BA6DA"/><stop offset="1" stop-color="#FFCF94"/></linearGradient><linearGradient id="ha" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9BA6DA" stop-opacity=".0"/><stop offset="1" stop-color="#9BA6DA" stop-opacity=".22"/></linearGradient></defs><g class="grid">${grid}</g><path class="area" d="${area}"/><path class="curve" d="${d}"/><g class="lbls">${lbls}</g>`;
    const path = svg.querySelector('.curve'); const len = path.getTotalLength(); path.style.setProperty('--len', len);
    bedT.textContent = fmt(bed); cycN.textContent = n; const sl = n * 90; sleepT.textContent = Math.floor(sl / 60) + 'h' + String(sl % 60).padStart(2, '0');
  }
  function render() {
    const w = +wake.value; wakeOut.textContent = fmt(w);
    wake.style.setProperty('--f', ((w - 300) / 240 * 100) + '%');
    chips.innerHTML = '';
    [6, 5, 4].forEach(n => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip' + (n === 5 ? ' best' : ''); b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', n === sel);
      b.innerHTML = `${fmt(w - n * 90 - 15)}<small>${n} ciclos · ${Math.floor(n * 1.5)}h${n % 2 ? '30' : ''}</small>`;
      b.addEventListener('click', () => { sel = n; render(); });
      chips.appendChild(b);
    });
    draw(sel);
  }
  wake.addEventListener('input', render);
  render();
})();
