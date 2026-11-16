/* ==================================================================
   Shared helpers for all puzzle pages – nothing to edit here.
   Every page calls XMAS.init(CONFIG) once and XMAS.solved() on win.
   ================================================================== */
(function () {
  'use strict';

  const reduceMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let cfg = {};

  /* ---------- storage (may be blocked – never fail) ---------- */
  function store(action, key, value) {
    try {
      if (action === 'get') return window.localStorage.getItem(key);
      if (action === 'set') window.localStorage.setItem(key, value);
      if (action === 'del') window.localStorage.removeItem(key);
    } catch (e) { /* ignore */ }
    return null;
  }
  const solvedKey = () => 'xmas-solved-' + (cfg.id || location.pathname);

  /* ---------- small utilities ---------- */
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // "Kevin – allein zu Haus!" -> "KEVINALLEINZUHAUS", "Glühwein" -> "GLUEHWEIN"
  function normalize(s) {
    return String(s == null ? '' : s).toUpperCase()
      .replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ẞ/g, 'SS')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, '');
  }

  function showMsg(id, type, html) {
    const m = document.getElementById(id);
    if (!m) return;
    m.className = 'msg';
    void m.offsetWidth; // restart the fade animation
    m.className = 'msg show ' + (type || 'info');
    m.innerHTML = html;
  }
  function hideMsg(id) {
    const m = document.getElementById(id);
    if (m) { m.className = 'msg'; m.innerHTML = ''; }
  }
  function shake(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 450);
  }

  /* ---------- decoration ---------- */
  function buildLights() {
    const colors = ['#ff4d57', '#ffd36b', '#5ad685', '#fff4d6'];
    document.querySelectorAll('.lights').forEach(box => {
      if (box.childElementCount) return;
      box.setAttribute('aria-hidden', 'true');
      box.innerHTML = '<svg viewBox="0 0 100 20" preserveAspectRatio="none">' +
        '<path d="M0 2 Q50 22 100 2" fill="none" stroke="#3b4a3f" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>';
      const n = 13;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const b = document.createElement('i');
        b.style.left = (t * 100).toFixed(2) + '%';
        b.style.top = (2 + 40 * t * (1 - t)).toFixed(1) + 'px'; // follows the wire curve
        b.style.setProperty('--c', colors[i % colors.length]);
        b.style.animationDelay = '-' + ((i * 0.53) % 2.4).toFixed(2) + 's';
        box.appendChild(b);
      }
    });
  }

  function buildSnow() {
    if (reduceMotion) return;
    const box = document.createElement('div');
    box.className = 'snow';
    box.setAttribute('aria-hidden', 'true');
    const flakes = ['❄', '❅', '❆', '•', '•', '•'];
    for (let i = 0; i < 32; i++) {
      const f = document.createElement('span');
      f.textContent = flakes[i % flakes.length];
      f.style.left = (Math.random() * 100).toFixed(1) + '%';
      f.style.fontSize = (8 + Math.random() * 12).toFixed(0) + 'px';
      f.style.opacity = (0.3 + Math.random() * 0.5).toFixed(2);
      f.style.animationDuration = (10 + Math.random() * 12).toFixed(1) + 's';
      f.style.animationDelay = '-' + (Math.random() * 22).toFixed(1) + 's';
      f.style.setProperty('--drift', (Math.random() * 80 - 40).toFixed(0) + 'px');
      box.appendChild(f);
    }
    document.body.prepend(box);
  }

  function celebrate() {
    if (reduceMotion) return;
    const layer = document.createElement('div');
    layer.className = 'burst';
    layer.setAttribute('aria-hidden', 'true');
    const icons = ['✨', '⭐', '❄', '🎄', '🎁', '✦'];
    for (let i = 0; i < 30; i++) {
      const s = document.createElement('span');
      s.textContent = icons[i % icons.length];
      const ang = Math.random() * Math.PI * 2;
      const dist = 110 + Math.random() * 170;
      s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(0) + 'px');
      s.style.setProperty('--dy', (Math.sin(ang) * dist + 60).toFixed(0) + 'px');
      s.style.animationDelay = (Math.random() * 0.25).toFixed(2) + 's';
      s.style.fontSize = (14 + Math.random() * 16).toFixed(0) + 'px';
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 2400);
  }

  /* ---------- reward box ---------- */
  function rewardBox(head, showReplay) {
    let box = document.getElementById('xmas-reward');
    if (!box) {
      box = document.createElement('section');
      box.id = 'xmas-reward';
      box.className = 'reward';
      box.setAttribute('aria-live', 'polite');
      box.innerHTML =
        '<div class="reward-ribbon" aria-hidden="true">🎁</div>' +
        '<div class="reward-head"></div>' +
        '<div class="reward-body"></div>' +
        '<button type="button" class="btn reward-replay">Nochmal spielen</button>';
      box.querySelector('.reward-replay').addEventListener('click', () => {
        box.hidden = true;
        const game = document.getElementById('game');
        if (game) game.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    }
    box.querySelector('.reward-head').textContent = head;
    box.querySelector('.reward-body').innerHTML = cfg.reward || '';
    box.querySelector('.reward-replay').hidden = !showReplay;
    return box;
  }

  function init(config) {
    cfg = config || {};
    if (/[?&]reset\b/.test(location.search)) store('del', solvedKey());
    buildLights();
    buildSnow();
    const eb = document.getElementById('eyebrow');
    if (eb && cfg.number != null) eb.textContent = '✦ Rätsel ' + cfg.number + ' ✦';

    // Already solved earlier in this browser? Show the reward again at the top.
    if (cfg.id && store('get', solvedKey()) === '1') {
      const box = rewardBox('Schon gelöst 🎉', true);
      const header = document.querySelector('header');
      if (header) header.insertAdjacentElement('afterend', box);
      box.hidden = false;
    }
  }

  function solved() {
    store('set', solvedKey(), '1');
    const box = rewardBox('Geschafft! 🎉', false);
    const game = document.getElementById('game');
    if (game) game.insertAdjacentElement('afterend', box);
    else document.body.appendChild(box);
    box.hidden = false;
    box.classList.remove('pop');
    void box.offsetWidth;
    box.classList.add('pop');
    celebrate();
    setTimeout(() => box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }), 350);
  }

  window.XMAS = { shuffle, normalize, showMsg, hideMsg, shake, init, solved, reduceMotion };
})();
