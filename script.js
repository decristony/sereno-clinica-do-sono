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

/* TRANSIÇÕES v2 · Sereno Clínica do Sono · do escuro para a luz, sem pressa
   Entradas de textos, imagens e cartões + traço de passagem entre seções, com assinatura própria do nicho.
   Só roda com JS e sem prefers-reduced-motion; o conteúdo nunca fica escondido sem JS. */
(() => {
  const C = {"step": 0.16, "settle": 3.4, "imgFilter": "brightness(.12) saturate(.2)", "divider": "<svg viewBox=\"0 0 1200 28\"><path class=\"ln\" pathLength=\"1\" style=\"--ld:0.00s\" d=\"M600 20 H0\"/><path class=\"ln\" pathLength=\"1\" style=\"--ld:0.00s\" d=\"M600 20 H1200\"/><circle class=\"dot\" cx=\"330\" cy=\"4\" r=\"2.2\" style=\"--ld:1.0s\"/><circle class=\"dot\" cx=\"760\" cy=\"2\" r=\"1.6\" style=\"--ld:1.3s\"/><circle class=\"dot\" cx=\"980\" cy=\"7\" r=\"2\" style=\"--ld:1.6s\"/><circle class=\"dot\" cx=\"150\" cy=\"9\" r=\"1.4\" style=\"--ld:1.8s\"/></svg>", "words": false, wordDelay: (i) => i * .08, cardDelay: (n) => Math.min(n, 5) * .18};
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const html = document.documentElement;
  html.classList.add('fx');
  const mob = matchMedia('(max-width: 760px)').matches;
  const SKIP = '.hero, body > header, nav, footer, .nav, .wa, .whats, .wpp, [class*="whatsapp"], canvas, video, iframe, [data-nofx], [class*="marquee"], [class*="ticker"], [aria-hidden="true"]' + (C.skip ? ', ' + C.skip : '');
  const pinned = el => { for (let p = el; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p).position; if (s === 'sticky' || s === 'fixed') return true; } return false; };
  const F0 = new Map();
  if (C.imgFilter) document.querySelectorAll('section img').forEach(i => F0.set(i, getComputedStyle(i).filter));
  const sections = [...document.querySelectorAll('section')].filter(s => !s.parentElement.closest('section') && !s.matches(SKIP) && !s.closest(SKIP));

  // o sistema antigo de revelação (fade genérico) sai de cena fora da hero
  sections.forEach(s => s.querySelectorAll('.rv, .reveal').forEach(el => { el.classList.remove('rv', 'reveal'); el.style.transitionDelay = ''; }));
  sections.forEach(s => s.classList.remove('rv', 'reveal'));

  const items = []; // {el, kind}
  const taken = new Set();
  const isTaken = el => { for (const t of taken) if (t !== el && t.contains(el)) return true; return false; };

  sections.forEach(sec => {
    // 1. cartões: grupos de 3+ irmãos parecidos com imagem ou título
    const groups = [];
    sec.querySelectorAll('*').forEach(p => {
      const ch = [...p.children].filter(c => !['SCRIPT', 'TEMPLATE', 'BR'].includes(c.tagName));
      if (ch.length < 3 || p.closest(SKIP)) return;
      const sig = c => c.tagName + '.' + (c.classList[0] || '');
      const cnt = {}; ch.forEach(c => cnt[sig(c)] = (cnt[sig(c)] || 0) + 1);
      const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
      if (best[1] < 3 || best[1] < ch.length * .7) return;
      const cards = ch.filter(c => sig(c) === best[0]);
      if (!cards.every(c => c.querySelector('img, h3, h4, strong, summary, dt') && c.getBoundingClientRect().height > 50)) return;
      if (cards.some(c => pinned(c))) return;
      if (groups.some(g => g.some(c => c.contains(p)))) return;
      groups.push(cards);
    });
    groups.forEach(g => g.forEach((c, i) => { if (!isTaken(c)) { c.classList.add('fx-c'); c.style.setProperty('--n', i); taken.add(c); items.push({ el: c, kind: 'c', i }); } }));

    // 2. imagens soltas (fora de cartões, fundos fixos e áreas presas)
    sec.querySelectorAll('img').forEach(img => {
      if (img.closest(SKIP) || isTaken(img) || pinned(img)) return;
      let w = img.parentElement; if (w.tagName === 'PICTURE') w = w.parentElement;
      const ws = getComputedStyle(img);
      if (ws.position === 'absolute' && w === sec) return;
      const r = w.getBoundingClientRect(), rs = sec.getBoundingClientRect();
      if (r.width * r.height > rs.width * rs.height * .85) return; // foto de fundo da seção
      let target = w;
      if (w === sec || w.querySelector('h1, h2, h3, p, a, button') ) target = img;
      if (isTaken(target) || taken.has(target)) return;
      target.classList.add('fx-i'); if (target === img) target.classList.add('fx-self');
      if (getComputedStyle(target).clipPath !== 'none') target.classList.add('fx-noclip');
      taken.add(target); items.push({ el: target, kind: 'i' });
    });

    // 3. textos: títulos, parágrafos, listas de dados, botões e formulários, em cascata
    sec.querySelectorAll('h2, h3, h4, p, li, blockquote, dl, form, ' + (C.extraText || '.eyebrow') + ', a[class*="btn"], a[class*="cta"], button[class*="btn"]').forEach(el => {
      if (el.closest(SKIP) || isTaken(el) || taken.has(el) || pinned(el)) return;
      if (el.closest('form') && el.tagName !== 'FORM') return;
      if (!el.textContent.trim() && el.tagName !== 'FORM') return;
      if (el.tagName === 'H2' && C.words) splitWords(el);
      else el.classList.add('fx-t');
      taken.add(el); items.push({ el, kind: el.classList.contains('fx-ws') ? 'w' : 't' });
    });
  });

  function splitWords(h) {
    h.classList.add('fx-ws');
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(t => { if (!t) return; if (/^\s+$/.test(t)) frag.append(t); else { const s = document.createElement('span'); s.className = 'fx-w'; s.textContent = t; frag.append(s); } });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !/^(BR|SVG|IMG)$/i.test(n.tagName)) {
          const cs = getComputedStyle(n);
          if (cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text' || cs.display === 'block') { n.classList.add('fx-w'); return; }
          walk(n);
        }
      });
    };
    walk(h);
    [...h.querySelectorAll('.fx-w')].forEach((w, i, all) => w.style.setProperty('--wd', C.wordDelay(i, all.length) + 's'));
  }

  // filtro de cor de cada foto preservado: a entrada soma o efeito ao filtro original
  if (C.imgFilter) document.querySelectorAll('.fx-i img, img.fx-i, .fx-c img').forEach(img => {
    const f = F0.get(img); img.style.setProperty('--f0', (f && f !== 'none' ? f + ' ' : '') + C.imgFilter);
  });

  // 4. traço de passagem entre seções
  let nDiv = 0;
  sections.forEach((sec, k) => {
    if (nDiv >= (C.maxDiv || 7) || k === 0 && C.skipFirstDiv) return;
    if (sec.matches(C.noDiv || '.fixo, .window, .janela, .sky')) return;
    if (!sec.querySelector('h2')) return;
    if (getComputedStyle(sec).position === 'static') sec.style.position = 'relative';
    const box = document.createElement('div');
    box.className = 'fx-div'; box.setAttribute('aria-hidden', 'true');
    box.innerHTML = C.divider;
    sec.prepend(box); nDiv++;
    items.push({ el: box, kind: 'd' });
  });

  // entrada: os elementos que chegam juntos entram em cascata, na ordem do texto
  const step = C.step * (mob ? .7 : 1);
  const show = (el, d) => {
    el.style.transitionDelay = d + 's';
    el.style.setProperty('--dl', d + 's');
    el.classList.add('fx-on');
    setTimeout(() => { el.classList.add('fx-done'); el.style.transitionDelay = ''; }, (d + C.settle) * 1000);
  };
  // elementos recortados (clip-path) são observados pelo pai, porque o recorte zera a área visível
  const proxyOf = el => ((el.classList.contains('fx-i') && !el.classList.contains('fx-noclip')) || (C.textClip && el.classList.contains('fx-t'))) ? el.parentElement : el;
  const watch = new Map();
  items.forEach(({ el }) => { const p = proxyOf(el); if (!watch.has(p)) watch.set(p, []); watch.get(p).push(el); });
  const io = new IntersectionObserver(es => {
    const ins = es.filter(e => e.isIntersecting).flatMap(e => { io.unobserve(e.target); return watch.get(e.target) || []; })
      .sort((a, b) => a.compareDocumentPosition(b) & 2 ? 1 : -1);
    ins.forEach((el, i) => {
      const n = el.classList.contains('fx-c') ? C.cardDelay(+el.style.getPropertyValue('--n') || 0) : Math.min(i, 7) * step;
      show(el, n);
    });
  }, { threshold: .14, rootMargin: '0px 0px -7% 0px' });
  watch.forEach((_, p) => io.observe(p));
  // quem chega por âncora já encontra o que ficou acima pronto
  requestAnimationFrame(() => watch.forEach((els, p) => { if (p.getBoundingClientRect().bottom < 0) { io.unobserve(p); els.forEach(el => show(el, 0)); } }));
})();
