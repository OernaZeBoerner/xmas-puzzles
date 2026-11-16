/* Rätsel – Das Gitter (crossword). Edit the CONFIG block in the HTML page, not this file. */
(function () {
  'use strict';
  XMAS.init(CONFIG);

  const SOL = CONFIG.solution.map(r => Array.from(String(r).toUpperCase()));
  const ROWS = SOL.length;
  const COLS = Math.max.apply(null, SOL.map(r => r.length));
  const DIRS = { across: [0, 1], down: [1, 0] };
  const other = d => (d === 'across' ? 'down' : 'across');
  const isLetter = (r, c) =>
    r >= 0 && r < ROWS && c >= 0 && c < COLS && SOL[r][c] !== undefined && SOL[r][c] !== '.';

  /* ---------- words from the clue list (+ warnings for editing) ---------- */
  const words = [];
  ['across', 'down'].forEach(dir => {
    const [dr, dc] = DIRS[dir];
    (CONFIG.clues[dir] || []).forEach(cl => {
      const cells = [];
      let r = cl.row, c = cl.col;
      while (isLetter(r, c)) { cells.push([r, c]); r += dr; c += dc; }
      if (!cells.length) { console.warn('[Kreuzworträtsel] Clue starts on a black square:', cl); return; }
      if (isLetter(cl.row - dr, cl.col - dc)) console.warn('[Kreuzworträtsel] Clue does not start at the beginning of its word:', cl);
      if (cells.length < 2) console.warn('[Kreuzworträtsel] Word is only one letter long:', cl);
      words.push({ dir, row: cl.row, col: cl.col, clue: cl.clue, cells });
    });
  });
  ['across', 'down'].forEach(dir => {
    const [dr, dc] = DIRS[dir];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isLetter(r, c) && !isLetter(r - dr, c - dc) && isLetter(r + dr, c + dc) &&
            !words.some(w => w.dir === dir && w.row === r && w.col === c)) {
          console.warn('[Kreuzworträtsel] Missing ' + dir + ' clue for the word starting at row ' + r + ', col ' + c + '.');
        }
      }
    }
  });

  // numbers in reading order
  const starts = {};
  let n = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (words.some(w => w.row === r && w.col === c)) starts[r + ',' + c] = ++n;
    }
  }
  words.forEach(w => { w.num = starts[w.row + ',' + w.col]; });

  /* ---------- build the grid ---------- */
  const grid = document.getElementById('cw-grid');
  const bar = document.getElementById('cw-current');
  grid.style.setProperty('--cols', COLS);
  const cell = [];
  let active = null, dir = 'across', done = false;

  for (let r = 0; r < ROWS; r++) {
    cell.push([]);
    for (let c = 0; c < COLS; c++) {
      const box = document.createElement('div');
      box.className = 'cw-cell';
      if (!isLetter(r, c)) {
        box.classList.add('block');
        grid.appendChild(box);
        cell[r].push(null);
        continue;
      }
      if (starts[r + ',' + c]) {
        const num = document.createElement('span');
        num.className = 'cw-num';
        num.textContent = starts[r + ',' + c];
        box.appendChild(num);
      }
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.autocomplete = 'off';
      inp.spellcheck = false;
      inp.setAttribute('autocapitalize', 'characters');
      inp.setAttribute('autocorrect', 'off');
      inp.setAttribute('aria-label', 'Zeile ' + (r + 1) + ', Spalte ' + (c + 1));
      box.appendChild(inp);
      grid.appendChild(box);
      const cl = { r, c, box, input: inp, across: null, down: null, wasActive: false };
      cell[r].push(cl);
      wireInput(cl);
    }
  }
  words.forEach(w => w.cells.forEach(([r, c]) => { cell[r][c][w.dir] = w; }));
  const allCells = cell.flat().filter(Boolean);

  /* ---------- clue lists ---------- */
  ['across', 'down'].forEach(d => {
    const ol = document.getElementById('cw-' + d);
    words.filter(w => w.dir === d).sort((a, b) => a.num - b.num).forEach(w => {
      const li = document.createElement('li');
      const b = document.createElement('b');
      b.textContent = w.num;
      const s = document.createElement('span');
      s.textContent = w.clue;
      li.append(b, s);
      li.addEventListener('click', () => {
        if (done) return;
        const first = w.cells.find(([r, c]) => !cell[r][c].input.value) || w.cells[0];
        focusCell(cell[first[0]][first[1]], w.dir);
      });
      w.li = li;
      ol.appendChild(li);
    });
  });

  /* ---------- navigation ---------- */
  function setActive(cl, preferDir) {
    active = cl;
    if (preferDir && cl[preferDir]) dir = preferDir;
    else if (!cl[dir]) dir = other(dir);
    highlight();
  }

  function focusCell(cl, preferDir) {
    setActive(cl, preferDir);
    cl.input.focus();
    cl.input.select();
  }

  function highlight() {
    allCells.forEach(cl => cl.box.classList.remove('hl', 'cur'));
    words.forEach(w => w.li && w.li.classList.remove('active'));
    const w = active && active[dir];
    if (w) {
      w.cells.forEach(([r, c]) => cell[r][c].box.classList.add('hl'));
      w.li.classList.add('active');
      bar.innerHTML = '';
      const b = document.createElement('b');
      b.textContent = w.num + (w.dir === 'across' ? ' →' : ' ↓');
      const s = document.createElement('span');
      s.textContent = w.clue;
      bar.append(b, s);
    }
    if (active) active.box.classList.add('cur');
  }

  function advance(step) {
    const w = active && active[dir];
    if (!w) return null;
    const i = w.cells.findIndex(([r, c]) => r === active.r && c === active.c);
    const j = i + step;
    if (j < 0 || j >= w.cells.length) return null;
    const next = cell[w.cells[j][0]][w.cells[j][1]];
    focusCell(next);
    return next;
  }

  function move(dr, dc) {
    if (!active) return;
    let r = active.r + dr, c = active.c + dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      if (cell[r][c]) { focusCell(cell[r][c], dc ? 'across' : 'down'); return; }
      r += dr; c += dc;
    }
  }

  function clearMarks(cl) { cl.box.classList.remove('correct', 'wrong'); }

  function wireInput(cl) {
    const inp = cl.input;
    inp.addEventListener('focus', () => {
      if (done) return;
      if (active !== cl) setActive(cl);
      inp.select();
    });
    // tapping the already active cell switches between across and down
    inp.addEventListener('pointerdown', () => {
      cl.wasActive = active === cl && document.activeElement === inp;
    });
    inp.addEventListener('click', () => {
      if (done) return;
      if (cl.wasActive && cl.across && cl.down) { dir = other(dir); highlight(); }
      cl.wasActive = false;
      inp.select();
    });
    inp.addEventListener('input', e => {
      let v = (e.data && /\p{L}/u.test(e.data)) ? e.data : inp.value;
      v = v.toUpperCase().replace(/[^A-ZÄÖÜ]/g, '').slice(-1);
      inp.value = v;
      clearMarks(cl);
      if (v) advance(1);
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value) {
        e.preventDefault();
        const prev = advance(-1);
        if (prev) { prev.input.value = ''; clearMarks(prev); }
      } else if (e.key === 'ArrowRight') { e.preventDefault(); move(0, 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); move(0, -1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(1, 0); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1, 0); }
    });
  }

  /* ---------- check ---------- */
  function check() {
    if (done) return;
    let filled = true, correct = true;
    allCells.forEach(cl => {
      const want = SOL[cl.r][cl.c];
      const got = (cl.input.value || '').toUpperCase();
      clearMarks(cl);
      if (!got) { filled = false; correct = false; return; }
      if (got === want) cl.box.classList.add('correct');
      else { cl.box.classList.add('wrong'); correct = false; }
    });
    if (correct) {
      done = true;
      allCells.forEach(cl => { cl.input.readOnly = true; });
      if (document.activeElement) document.activeElement.blur();
      active = null;
      highlight();
      bar.innerHTML = '<span class="muted">Alles richtig ausgefüllt! ✨</span>';
      XMAS.hideMsg('msg');
      XMAS.solved();
    } else if (filled) {
      XMAS.showMsg('msg', 'lose', '<strong>Fast!</strong> Ein paar Buchstaben stimmen noch nicht – sie sind rot markiert.');
    } else {
      XMAS.showMsg('msg', 'info', '<strong>Noch nicht fertig.</strong> Fülle alle Felder aus und prüfe dann nochmal. ' +
        'Falsche Buchstaben sind rot markiert.');
    }
  }
  document.getElementById('cw-check').addEventListener('click', check);
})();
