/* Rätsel – Das Wort (Wordle). Edit the CONFIG block in the HTML page, not this file. */
(function () {
  'use strict';
  XMAS.init(CONFIG);

  const ANSWER = Array.from(String(CONFIG.answer).toUpperCase().replace(/\s+/g, ''));
  const LEN = ANSWER.length;
  const ROWS = CONFIG.guesses || 6;
  const LAYOUT = [
    Array.from('QWERTZUIOPÜ'),
    Array.from('ASDFGHJKLÖÄ'),
    ['ENTER'].concat(Array.from('YXCVBNM'), ['BACK'])
  ];
  const FLIP = 130; // ms between two tiles flipping

  const grid = document.getElementById('wordle-grid');
  const kb = document.getElementById('keyboard');
  const hint = document.getElementById('hint');
  if (hint) hint.textContent = LEN + ' Buchstaben · ' + ROWS + ' Versuche';

  let row = 0, cur = [], over = false, busy = false, history = [];

  function build() {
    row = 0; cur = []; over = false; busy = false; history = [];
    grid.innerHTML = '';
    grid.style.setProperty('--len', LEN);
    for (let r = 0; r < ROWS; r++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'w-row';
      for (let c = 0; c < LEN; c++) {
        const cell = document.createElement('div');
        cell.className = 'w-cell';
        rowEl.appendChild(cell);
      }
      grid.appendChild(rowEl);
    }
    buildKeyboard();
    XMAS.hideMsg('msg');
  }

  function buildKeyboard() {
    kb.innerHTML = '';
    LAYOUT.forEach(keys => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      keys.forEach(k => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'key';
        b.dataset.key = k;
        if (k === 'ENTER') { b.textContent = 'Raten'; b.classList.add('wide'); }
        else if (k === 'BACK') { b.textContent = '⌫'; b.classList.add('wide'); b.setAttribute('aria-label', 'Löschen'); }
        else b.textContent = k;
        b.addEventListener('click', () => { press(k); b.blur(); });
        rowEl.appendChild(b);
      });
      kb.appendChild(rowEl);
    });
  }

  function press(k) {
    if (over || busy) return;
    if (k === 'ENTER') { submit(); return; }
    if (k === 'BACK') { cur.pop(); paint(); return; }
    if (cur.length < LEN) { cur.push(k); paint(); }
  }

  function paint() {
    const cells = grid.children[row].children;
    for (let c = 0; c < LEN; c++) {
      cells[c].textContent = cur[c] || '';
      cells[c].classList.toggle('filled', !!cur[c]);
    }
  }

  // two passes: exact hits first, then letters in the wrong place
  function score(guess) {
    const res = Array(LEN).fill('absent');
    const taken = Array(LEN).fill(false);
    for (let i = 0; i < LEN; i++) {
      if (guess[i] === ANSWER[i]) { res[i] = 'correct'; taken[i] = true; }
    }
    for (let i = 0; i < LEN; i++) {
      if (res[i] === 'correct') continue;
      for (let j = 0; j < LEN; j++) {
        if (!taken[j] && guess[i] === ANSWER[j]) { res[i] = 'present'; taken[j] = true; break; }
      }
    }
    return res;
  }

  function submit() {
    const rowEl = grid.children[row];
    if (cur.length !== LEN) {
      XMAS.shake(rowEl);
      XMAS.showMsg('msg', 'info', 'Das Wort hat ' + LEN + ' Buchstaben.');
      return;
    }
    XMAS.hideMsg('msg');
    busy = true;
    const guess = cur.slice();
    const res = score(guess);
    const cells = rowEl.children;
    guess.forEach((ch, i) => {
      setTimeout(() => {
        cells[i].classList.add('flip');
        setTimeout(() => cells[i].classList.add(res[i]), 220);
      }, i * FLIP);
    });
    history.push({ guess: guess, res: res });
    const won = guess.join('') === ANSWER.join('');
    row++; cur = [];
    setTimeout(() => {
      busy = false;
      updateKeys();
      if (won) { over = true; XMAS.solved(); }
      else if (row >= ROWS) { over = true; lose(); }
    }, LEN * FLIP + 280);
  }

  // Key colours only reflect what the guesses so far have revealed:
  // - known = fewest copies of a letter the word must contain (most hits in one guess,
  //   or the number of distinct green positions, whichever is larger)
  // - 'partial' (half green, half yellow) = some copies are placed, others are still missing
  function keyStates() {
    const info = {};
    history.forEach(({ guess, res }) => {
      const hits = {};
      guess.forEach((ch, i) => {
        const k = info[ch] || (info[ch] = { greens: new Set(), known: 0 });
        if (res[i] === 'correct') k.greens.add(i);
        if (res[i] !== 'absent') hits[ch] = (hits[ch] || 0) + 1;
      });
      Object.keys(hits).forEach(ch => { info[ch].known = Math.max(info[ch].known, hits[ch]); });
    });
    const states = {};
    Object.keys(info).forEach(ch => {
      const greens = info[ch].greens.size;
      const known = Math.max(info[ch].known, greens);
      if (known === 0) states[ch] = 'absent';
      else if (greens === 0) states[ch] = 'present';
      else states[ch] = greens < known ? 'partial' : 'correct';
    });
    return states;
  }

  function updateKeys() {
    const states = keyStates();
    kb.querySelectorAll('.key').forEach(b => {
      b.classList.remove('correct', 'present', 'absent', 'partial');
      const s = states[b.dataset.key];
      if (s) b.classList.add(s);
    });
  }

  function lose() {
    XMAS.showMsg('msg', 'lose',
      '<strong>Leider nicht geschafft.</strong><br>Alle Versuche sind aufgebraucht – ' +
      'aber keine Sorge, du kannst es einfach nochmal probieren.<br>' +
      '<button type="button" class="btn primary" id="retry">Nochmal versuchen</button>');
    document.getElementById('retry').onclick = build;
  }

  // physical keyboard
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea')) return;
    if (e.key === 'Enter') {
      if (t && t.closest && t.closest('button:not(.key)')) return; // e.g. "Nochmal versuchen"
      e.preventDefault();
      press('ENTER');
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      press('BACK');
    } else if (e.key.length === 1) {
      const k = e.key.toUpperCase();
      if (/^[A-ZÄÖÜ]$/.test(k)) press(k);
    }
  });

  build();
})();
