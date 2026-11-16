/* Rätsel – Das Schiebepuzzle (sliding puzzle). Edit the CONFIG block in the HTML page, not this file. */
(function () {
  'use strict';
  XMAS.init(CONFIG);

  const N = Math.max(2, Math.min(6, parseInt(CONFIG.size, 10) || 3));
  const EMPTY = N * N - 1; // id of the missing tile (bottom right of the picture)
  const board = document.getElementById('board');
  const movesEl = document.getElementById('moves');
  const preview = document.getElementById('preview');
  const btnNumbers = document.getElementById('sl-numbers');
  const btnShuffle = document.getElementById('sl-shuffle');
  board.style.setProperty('--n', N);

  let state = [];  // state[position] = tile id
  let tiles = [];
  let moves = 0, done = false;

  /* ---------- image: centre-crop to a square so any photo works ---------- */
  function loadImage(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
  async function prepareImage() {
    const url = CONFIG.image;
    const img = await loadImage(url);
    if (!img) {
      XMAS.showMsg('msg', 'lose', 'Das Bild <b></b> wurde nicht gefunden.');
      document.querySelector('#msg b').textContent = url;
      return url;
    }
    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h || w === h) return url;
    try {
      const s = Math.min(w, h), out = Math.min(s, 1000);
      const cv = document.createElement('canvas');
      cv.width = cv.height = out;
      cv.getContext('2d').drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, out, out);
      return cv.toDataURL('image/jpeg', 0.88);
    } catch (e) {
      return url; // e.g. opened via file:// – falls back to the uncropped image
    }
  }

  /* ---------- board ---------- */
  function makeTiles() {
    board.innerHTML = '';
    tiles = [];
    for (let id = 0; id < N * N; id++) {
      const t = document.createElement('div');
      t.className = 'sl-tile' + (id === EMPTY ? ' last' : '');
      t.dataset.n = id + 1;
      const r = Math.floor(id / N), c = id % N;
      const face = document.createElement('div');
      face.style.backgroundPosition = (c / (N - 1) * 100) + '% ' + (r / (N - 1) * 100) + '%';
      t.appendChild(face);
      t.addEventListener('click', () => tap(id));
      board.appendChild(t);
      tiles.push(t);
    }
  }

  function place() {
    state.forEach((id, pos) => {
      tiles[id].style.left = ((pos % N) * 100 / N) + '%';
      tiles[id].style.top = (Math.floor(pos / N) * 100 / N) + '%';
    });
  }

  function neighbors(pos) {
    const r = Math.floor(pos / N), c = pos % N, out = [];
    if (r > 0) out.push(pos - N);
    if (r < N - 1) out.push(pos + N);
    if (c > 0) out.push(pos - 1);
    if (c < N - 1) out.push(pos + 1);
    return out;
  }

  const isSolved = () => state.every((id, pos) => id === pos);

  // random *legal* moves from the solved picture -> always solvable
  function shuffle() {
    state = Array.from({ length: N * N }, (_, i) => i);
    let empty = EMPTY, prev = -1;
    const steps = N * N * 20;
    for (let s = 0; s < steps || isSolved(); s++) {
      const opts = neighbors(empty).filter(p => p !== prev);
      const p = opts[Math.floor(Math.random() * opts.length)];
      [state[empty], state[p]] = [state[p], state[empty]];
      prev = empty;
      empty = p;
    }
    moves = 0;
    done = false;
    movesEl.textContent = '0';
    board.classList.remove('done', 'peek');
    XMAS.hideMsg('msg');
    place();
  }

  function tap(id) {
    if (board.classList.contains('peek')) { board.classList.remove('peek'); return; }
    if (done || id === EMPTY) return;
    const pos = state.indexOf(id), empty = state.indexOf(EMPTY);
    const pr = Math.floor(pos / N), pc = pos % N, er = Math.floor(empty / N), ec = empty % N;
    if (pr !== er && pc !== ec) return;
    // slides every tile between the tapped one and the gap
    const step = pr === er ? (pc < ec ? -1 : 1) : (pr < er ? -N : N);
    let e = empty;
    while (e !== pos) {
      const next = e + step;
      [state[e], state[next]] = [state[next], state[e]];
      e = next;
    }
    moves++;
    movesEl.textContent = moves;
    place();
    if (isSolved()) {
      done = true;
      setTimeout(() => board.classList.add('done'), 200);
      setTimeout(() => XMAS.solved(), 1100);
    }
  }

  btnNumbers.addEventListener('click', () => {
    const on = board.classList.toggle('numbers');
    btnNumbers.textContent = on ? 'Zahlen ausblenden' : 'Zahlen zeigen';
  });
  btnShuffle.addEventListener('click', shuffle);
  preview.addEventListener('click', () => { if (!done) board.classList.toggle('peek'); });
  board.addEventListener('click', e => {
    if (e.target === board) board.classList.remove('peek');
  });

  prepareImage().then(src => {
    // absolute URL, because relative URLs inside CSS variables resolve inconsistently
    const abs = /^data:/.test(src) ? src : new URL(src, location.href).href;
    const css = 'url("' + abs + '")';
    board.style.setProperty('--img', css);
    preview.style.backgroundImage = css;
    makeTiles();
    shuffle();
  });
})();
