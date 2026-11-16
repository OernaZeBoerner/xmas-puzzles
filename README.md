# xmas-puzzles

Five Christmas puzzles, each on its own page, so every puzzle gets its own QR code.
No page links to another one. When a puzzle is solved, its page shows a message you
write yourself (e.g. where the next QR code or present is hidden).

| # | Page | Puzzle |
|---|------|--------|
| 1 | `zimtstern.html` | **Das Wort**: guess the word (Wordle style) |
| 2 | `lebkuchen.html` | **Die Gruppen**: find 4 groups of 4 |
| 3 | `spekulatius.html` | **Das Gitter**: crossword |
| 4 | `vanillekipferl.html` | **Der Adventskranz**: emoji riddles, each answer lights a candle |
| 5 | `dominostein.html` | **Das Schiebepuzzle**: sliding picture puzzle |

The page names are cookie names rather than `1.html … 5.html`, so the next URL can't be
guessed by changing a number. `index.html` is a neutral "Frohe Weihnachten" page without links.

## Editing the content

Only edit the `CONFIG` block near the bottom of each HTML page. Every field is explained there.

* **`reward`**: the message shown after solving. **Replace the `[HIER DEINEN HINWEIS EINTRAGEN]` placeholders!**
  HTML works: `<b>bold</b>`, `<br>` for a new line, `<img src="img/foto.jpg">` for a picture.
* **`number`**: the "Rätsel N" label at the top. Change it if you hand them out in a different order.
* **Wordle**: `answer` can be 4–7 letters; Ä/Ö/Ü are allowed (they're on the on-screen keyboard).
* **Gruppen**: exactly 4 groups × 4 words, each word only once. Make sure the solution is unique.
  For long words, mark where they may break onto a second line with `|`, e.g. `"STROH|STERN"`.
* **Kreuzworträtsel**: `solution` is the filled grid (`.` = black square); clues are given by the
  row/column (from 0) where each word starts. Open the browser console (F12) after editing: it
  warns about clues that don't match the grid and about words without a clue.
* **Adventskranz**: list every accepted spelling in `answers` (the first one is displayed once solved).
  Case, spaces, umlauts and punctuation are ignored; small typos are accepted (`typoTolerance`).
* **Schiebepuzzle**: copy a photo into `img/` and set `image: "img/foto.jpg"`. Any aspect ratio works:
  it's cropped to the centre square. `size: 3` is a good difficulty; `4` is much harder.

The look (colours, fonts) is in `css/style.css`, the game logic in `js/`. You shouldn't need to touch them.

## Testing locally

```bash
cd xmas-puzzles
python -m http.server 8000
```

Then open e.g. <http://localhost:8000/zimtstern.html>. Use the server rather than double-clicking the
file, because cropping the photo in the sliding puzzle needs it.

Once a puzzle is solved, the browser remembers it and shows the message again at the top on the next
visit, so a reload doesn't lose the hint. To reset that while testing, add `?reset` to the URL, e.g.
`zimtstern.html?reset`.

To try it on your phone, open `http://<your-PC-IP>:8000/zimtstern.html` while both devices are on the same Wi-Fi.

## Publishing with GitHub Pages

1. Create an empty repository on GitHub, e.g. `xmas-puzzles`.
2. Push this folder:
   ```bash
   git add .
   git commit -m "Christmas puzzles"
   git remote add origin https://github.com/<account>/xmas-puzzles.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
4. After a minute the pages are online:

| QR code | URL |
|---------|-----|
| Rätsel 1 | `https://<account>.github.io/xmas-puzzles/zimtstern.html` |
| Rätsel 2 | `https://<account>.github.io/xmas-puzzles/lebkuchen.html` |
| Rätsel 3 | `https://<account>.github.io/xmas-puzzles/spekulatius.html` |
| Rätsel 4 | `https://<account>.github.io/xmas-puzzles/vanillekipferl.html` |
| Rätsel 5 | `https://<account>.github.io/xmas-puzzles/dominostein.html` |

Open every URL once yourself (and solve the puzzle) before printing the QR codes.
Then visit each page with `?reset` so your own browser starts fresh.
