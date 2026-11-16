/* Rätsel – Der Adventskranz (emoji riddles). Edit the CONFIG block in the HTML page, not this file. */
(function () {
  'use strict';
  XMAS.init(CONFIG);

  const RIDDLES = CONFIG.riddles || [];
  const N = RIDDLES.length;
  const list = document.getElementById('riddles');
  const candles = buildWreath(document.getElementById('wreath'), N);
  let solvedCount = 0;

  /* ---------- answer matching ---------- */
  function lev(a, b) {
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }
  function matches(input, answers) {
    const v = XMAS.normalize(input);
    if (!v) return false;
    return answers.some(a => {
      const t = XMAS.normalize(a);
      if (v === t) return true;
      if (CONFIG.typoTolerance === false) return false;
      const allowed = t.length >= 12 ? 2 : t.length >= 6 ? 1 : 0; // small typos are ok
      return allowed > 0 && lev(v, t) <= allowed;
    });
  }

  /* ---------- riddle cards ---------- */
  RIDDLES.forEach((rd, i) => {
    const card = document.createElement('div');
    card.className = 'riddle';
    card.innerHTML =
      '<div class="riddle-top"><span class="riddle-no">' + (i + 1) + '</span><span class="riddle-emoji"></span></div>' +
      '<form class="riddle-form" autocomplete="off">' +
      '<input class="input" type="text" placeholder="Deine Antwort …" spellcheck="false" autocorrect="off">' +
      '<button class="btn primary" type="submit">Prüfen</button></form>' +
      '<div class="riddle-msg" aria-live="polite"></div>';
    card.querySelector('.riddle-emoji').textContent = rd.emoji;
    const form = card.querySelector('form');
    const input = card.querySelector('input');
    const msg = card.querySelector('.riddle-msg');
    input.setAttribute('aria-label', 'Antwort für Rätsel ' + (i + 1));

    if (rd.tip) {
      const det = document.createElement('details');
      det.className = 'riddle-tip';
      const sum = document.createElement('summary');
      sum.textContent = 'Tipp anzeigen';
      const p = document.createElement('p');
      p.textContent = rd.tip;
      det.append(sum, p);
      card.appendChild(det);
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (card.classList.contains('done')) return;
      if (matches(input.value, rd.answers || [])) {
        card.classList.add('done');
        input.value = rd.answers[0];
        input.readOnly = true;
        input.blur();
        form.querySelector('button').hidden = true;
        const c = candles[solvedCount];
        if (c) c.classList.add('lit');
        solvedCount++;
        msg.textContent = solvedCount === N ? '✓ Richtig! Alle Kerzen brennen.' : '✓ Richtig! Eine Kerze brennt.';
        if (solvedCount === N) setTimeout(() => XMAS.solved(), 1000);
      } else {
        XMAS.shake(card);
        msg.textContent = input.value.trim()
          ? 'Noch nicht ganz … versuch es nochmal.'
          : 'Schreib deine Antwort in das Feld.';
      }
    });
    list.appendChild(card);
  });

  /* ---------- the wreath (drawn in code, so it fits any number of candles) ---------- */
  function buildWreath(box, count) {
    const NS = 'http://www.w3.org/2000/svg';
    const W = 320, H = 150, CX = 160, CY = 108, RX = 128, RY = 26;
    const greens = ['#174d2f', '#1d5e3a', '#24703f', '#2f8a4e'];
    let seed = 11; // fixed seed: the wreath looks the same on every visit
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

    const layer = z => {
      const s = document.createElementNS(NS, 'svg');
      s.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      s.setAttribute('class', 'wr-layer');
      s.setAttribute('aria-hidden', 'true');
      s.style.zIndex = z;
      box.appendChild(s);
      return s;
    };
    const shape = (svg, tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      svg.appendChild(el);
    };
    const leaf = (svg, x, y, ang, len) => shape(svg, 'ellipse', {
      cx: x.toFixed(1), cy: y.toFixed(1), rx: len.toFixed(1), ry: (len * 0.34).toFixed(1),
      fill: greens[Math.floor(rnd() * greens.length)],
      transform: 'rotate(' + ang.toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')'
    });
    const berry = (svg, x, y, r, fill) => {
      shape(svg, 'circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: r.toFixed(1), fill });
      shape(svg, 'circle', { cx: (x - r * 0.35).toFixed(1), cy: (y - r * 0.35).toFixed(1), r: (r * 0.3).toFixed(1), fill: 'rgba(255,255,255,.55)' });
    };

    const back = layer(0), front = layer(2), top = layer(4);

    // greenery around the ring: back half behind the candles, front half in front
    const LEAVES = 96;
    for (let k = 0; k < LEAVES; k++) {
      const a = (k / LEAVES) * Math.PI * 2;
      const off = (rnd() - 0.5) * 18;
      const x = CX + (RX + off) * Math.cos(a);
      const y = CY + (RY + off * 0.25) * Math.sin(a);
      const tangent = Math.atan2(RY * Math.cos(a), -RX * Math.sin(a)) * 180 / Math.PI;
      leaf(Math.sin(a) < 0 ? back : front, x, y, tangent + (rnd() - 0.5) * 70, 11 + rnd() * 6);
    }
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + rnd() * 0.3;
      const x = CX + RX * Math.cos(a), y = CY + RY * Math.sin(a) + (rnd() - 0.5) * 6;
      berry(Math.sin(a) < 0 ? back : front, x, y, 3 + rnd() * 1.6, k % 3 === 2 ? '#e0b85a' : '#c8202c');
    }

    // candles, evenly around the ring. The 22.5° turn keeps front and back
    // candles from standing exactly behind each other.
    const list = [];
    for (let i = 0; i < count; i++) {
      const a = (112.5 * Math.PI / 180) + i * (2 * Math.PI / count);
      const x = CX + RX * Math.cos(a), y = CY + RY * Math.sin(a);
      const isFront = Math.sin(a) > 0.01;
      const scale = isFront ? 1 : 0.88;
      const cw = 20 * scale, ch = 58 * scale;
      const el = document.createElement('div');
      el.className = 'candle';
      el.style.left = ((x - cw / 2) / W * 100).toFixed(2) + '%';
      el.style.top = ((y - ch + 4) / H * 100).toFixed(2) + '%';
      el.style.width = (cw / W * 100).toFixed(2) + '%';
      el.style.height = (ch / H * 100).toFixed(2) + '%';
      el.style.zIndex = isFront ? 3 : 1;
      el.innerHTML = '<span class="glow"></span><span class="flame"><i></i></span>';
      box.appendChild(el);
      // a few leaves in front of the candle foot
      for (let k = 0; k < 5; k++) {
        leaf(isFront ? top : front, x + (k - 2) * 6 + (rnd() - 0.5) * 3, y + 3 + rnd() * 3,
          (k - 2) * 18 + (rnd() - 0.5) * 30, 9 + rnd() * 4);
      }
      list.push({ el, x });
    }
    list.sort((p, q) => p.x - q.x); // light them from left to right
    return list.map(c => c.el);
  }
})();
