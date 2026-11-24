"""Generate printable QR codes for the five puzzle pages.

Usage:
    uv run make_qr.py                      # uses the default GitHub Pages URL
    uv run make_qr.py --base http://192.168.0.10:8000/   # e.g. for local testing

Writes one PNG (with a caption) and one SVG per puzzle into ./qr/.
"""
import argparse
from pathlib import Path

import qrcode
import qrcode.image.svg
from PIL import Image, ImageDraw, ImageFont

BASE_URL = "https://oernazeboerner.github.io/xmas-puzzles/"

PUZZLES = [
    ("Rätsel 1", "zimtstern.html"),
    ("Rätsel 2", "lebkuchen.html"),
    ("Rätsel 3", "spekulatius.html"),
    ("Rätsel 4", "vanillekipferl.html"),
    ("Rätsel 5", "dominostein.html"),
]


def make_qr(url: str) -> qrcode.QRCode:
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_M,  # tolerates ~15% damage
        box_size=20,  # pixels per module -> large enough for print
        border=4,     # quiet zone (4 is the spec minimum)
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr


def add_caption(img: Image.Image, text: str) -> Image.Image:
    try:
        font = ImageFont.truetype("arial.ttf", 60)
    except OSError:
        font = ImageFont.load_default()
    w, h = img.size
    out = Image.new("RGB", (w, h + 90), "white")
    out.paste(img, (0, 0))
    draw = ImageDraw.Draw(out)
    tw = draw.textlength(text, font=font)
    draw.text(((w - tw) / 2, h - 10), text, fill="black", font=font)
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default=BASE_URL, help="base URL of the pages")
    parser.add_argument("--out", default="qr", help="output folder")
    args = parser.parse_args()

    base = args.base if args.base.endswith("/") else args.base + "/"
    out_dir = Path(args.out)
    out_dir.mkdir(exist_ok=True)

    for label, page in PUZZLES:
        url = base + page
        qr = make_qr(url)
        stem = Path(page).stem

        png = qr.make_image(fill_color="black", back_color="white").convert("RGB")
        add_caption(png, label).save(out_dir / f"{stem}.png")

        svg = qr.make_image(image_factory=qrcode.image.svg.SvgPathImage)
        svg.save(out_dir / f"{stem}.svg")

        print(f"{label}: {url} -> {out_dir / stem}.png/.svg")


if __name__ == "__main__":
    main()
