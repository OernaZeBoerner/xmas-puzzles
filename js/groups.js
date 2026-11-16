/* Rätsel – Die Gruppen (Connections). Edit the CONFIG block in the HTML page, not this file. */
(function () {
  'use strict';
  XMAS.init(CONFIG);

  // "STROH|STERN": the | marks where a long word may break onto a second line
  const SOFT_HYPHEN = String.fromCharCode(173);
  const LABEL = {};
  const GROUPS = CONFIG.groups.map((g, i) => ({
    name: g.name,
    color: i % 4,
    words: g.words.map(w => {
      const raw = String(w).toUpperCase().trim();
      const key = raw.replace(/\|/g, '');
      LABEL[key] = raw.split('|').join(SOFT_HYPHEN);
      return key;
    })
  }));
  const MAX = CONFIG.mistakes || 4;

  // help while editing: shows problems in the browser console (F12)
  (function check() {
    const all = GROUPS.flatMap(g => g.words);
    if (GROUPS.some(g => g.words.length !== 4)) console.warn('[Gruppen] Every group needs exactly 4 words.');
    const dup = all.filter((w, i) => all.indexOf(w) !== i);
    if (dup.length) console.warn('[Gruppen] These words appear twice:', dup);
  })();

  const grid = document.getElementById('g-grid');
  const solvedList = document.getElementById('g-solved');
  const status = document.getElementById('g-status');
  const btnShuffle = document.getElementById('g-shuffle');
  const btnClear = document.getElementById('g-clear');
  const btnSubmit = document.getElementById('g-submit');

  let remaining = [], sel = [], mistakes = 0, solvedCount = 0, over = false, tried = new Set();

  function build() {
    remaining = XMAS.shuffle(GROUPS.flatMap(g => g.words.slice()));
    sel = []; mistakes = 0; solvedCount = 0; over = false; tried = new Set();
    solvedList.innerHTML = '';
    XMAS.hideMsg('msg');
    renderTiles();
    renderStatus();
    updateButtons();
  }

  function renderTiles() {
    grid.innerHTML = '';
    remaining.forEach(w => {
      const t = document.createElement('button');
      t.type = 'button';
      t.className = 'g-tile' + (sel.includes(w) ? ' sel' : '');
      t.textContent = LABEL[w];
      t.dataset.word = w;
      t.setAttribute('aria-pressed', sel.includes(w) ? 'true' : 'false');
      t.addEventListener('click', () => toggle(t));
      grid.appendChild(t);
    });
    fitAll();
  }

  // make every word fit its tile: shrink a little, then try a hyphenated
  // two-line version for long words, and only then shrink further
  const fits = t => t.scrollWidth <= t.clientWidth && t.scrollHeight <= t.clientHeight;
  function shrink(t, from, to) {
    let size = from;
    t.style.fontSize = size + 'px';
    while (!fits(t) && size > to) { size -= 0.5; t.style.fontSize = size + 'px'; }
    return size;
  }
  function fit(t) {
    t.classList.remove('wrap');
    if (shrink(t, 15, 11.5) && fits(t)) return;
    t.classList.add('wrap');
    if (shrink(t, 13, 11) && fits(t)) return;
    t.classList.remove('wrap'); // browser can't hyphenate here – use one small line
    shrink(t, 11.5, 7);
  }
  function fitAll() {
    grid.querySelectorAll('.g-tile').forEach(fit);
  }

  function renderStatus() {
    let dots = '';
    for (let i = 0; i < MAX; i++) dots += '<span class="g-dot' + (i >= MAX - mistakes ? ' gone' : '') + '"></span>';
    status.innerHTML = 'Fehlversuche übrig: ' + dots;
  }

  function toggle(t) {
    if (over) return;
    const w = t.dataset.word;
    if (sel.includes(w)) sel = sel.filter(x => x !== w);
    else if (sel.length < 4) sel.push(w);
    else return;
    const on = sel.includes(w);
    t.classList.toggle('sel', on);
    t.setAttribute('aria-pressed', on ? 'true' : 'false');
    updateButtons();
  }

  function updateButtons() {
    btnSubmit.disabled = over || sel.length !== 4;
    btnClear.disabled = over || sel.length === 0;
    btnShuffle.disabled = over;
  }

  function submit() {
    if (over || sel.length !== 4) return;
    const match = GROUPS.find(g => g.words.every(w => sel.includes(w)));
    if (match) {
      const bar = document.createElement('div');
      bar.className = 'g-solved c' + match.color;
      const name = document.createElement('strong');
      name.textContent = match.name;
      const list = document.createElement('span');
      list.textContent = match.words.join(' · ');
      bar.append(name, list);
      solvedList.appendChild(bar);
      remaining = remaining.filter(w => !match.words.includes(w));
      sel = [];
      solvedCount++;
      XMAS.hideMsg('msg');
      renderTiles();
      updateButtons();
      if (solvedCount === GROUPS.length) { over = true; updateButtons(); XMAS.solved(); }
      return;
    }

    const key = sel.slice().sort().join('|');
    if (tried.has(key)) {
      XMAS.showMsg('msg', 'info', 'Diese Kombination hast du schon probiert.');
      return;
    }
    tried.add(key);
    mistakes++;
    renderStatus();
    grid.querySelectorAll('.g-tile.sel').forEach(t => XMAS.shake(t));
    if (mistakes >= MAX) { over = true; updateButtons(); lose(); return; }
    const oneAway = GROUPS.some(g => g.words.filter(w => sel.includes(w)).length === 3);
    XMAS.showMsg('msg', 'info', oneAway
      ? '<strong>Einer fehlt noch!</strong> Drei davon gehören zusammen.'
      : 'Das ist leider keine Gruppe – versuch es weiter.');
  }

  function lose() {
    XMAS.showMsg('msg', 'lose',
      '<strong>Die Kärtchen purzeln durcheinander.</strong><br>Zu viele Fehlversuche – ' +
      'aber du kannst einfach nochmal von vorn anfangen.<br>' +
      '<button type="button" class="btn primary" id="retry">Neu mischen</button>');
    document.getElementById('retry').onclick = build;
  }

  btnShuffle.addEventListener('click', () => { remaining = XMAS.shuffle(remaining); renderTiles(); });
  btnClear.addEventListener('click', () => { sel = []; renderTiles(); updateButtons(); });
  btnSubmit.addEventListener('click', submit);

  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fitAll, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  build();
})();
