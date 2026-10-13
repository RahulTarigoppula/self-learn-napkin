"""Subset the four Napkin faces into public/fonts/ and assert the font budget.

Sources: @fontsource-variable/{bricolage-grotesque,inter,jetbrains-mono} (OFL-1.1) and
fonts-src/Excalifont-Regular-latin.woff2 (OFL-1.1, the Latin chunk Excalidraw ships).
Run:  python scripts/subset-fonts.py   (needs: pip install "fonttools[woff]" brotli)
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
FS = ROOT / "node_modules" / "@fontsource-variable"
OUT = ROOT / "src" / "assets" / "fonts"
UNICODES = "U+0020-007E,U+00A0-00FF,U+2013-2026,U+2190-21FF,U+2200-22FF,U+00B2,U+00B3,U+207F,U+2080-2089,U+00B7"

FACES = [
    # (source, output, weight range or None, keep ligatures)
    (FS / "bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2", "Bricolage.woff2", (500, 800), True),
    (FS / "inter/files/inter-latin-wght-normal.woff2", "Inter.woff2", (400, 700), True),
    (FS / "inter/files/inter-greek-wght-normal.woff2", "InterGreek.woff2", (400, 700), True),
    (FS / "jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2", "JetBrainsMono.woff2", (400, 700), False),
    (ROOT / "fonts-src/Excalifont-Regular-latin.woff2", "Excalifont.woff2", None, True),
]
MAX_EACH, MAX_TOTAL = 50_000, 140_000


def build(src: Path, name: str, wght: tuple[int, int] | int | None, liga: bool) -> int:
    font = TTFont(src)
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern", "liga", "calt"] if liga else ["kern"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.desubroutinize = True
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=subset.parse_unicodes("U+0370-03FF" if "Greek" in name else UNICODES))
    sub.subset(font)
    if wght and "fvar" in font:
        # Round-trip through bytes so the instancer sees fully decompiled tables.
        buf = io.BytesIO()
        font.save(buf)
        buf.seek(0)
        font = instancer.instantiateVariableFont(TTFont(buf), {"wght": wght})
    out = OUT / name
    font.flavor = "woff2"
    font.save(out)
    return out.stat().st_size


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    ok = True
    print(f"{'face':<22}{'bytes':>9}")
    for src, name, wght, liga in FACES:
        size = build(src, name, wght, liga)
        total += size
        flag = "" if size <= MAX_EACH else "  <-- over 50 kB"
        ok &= size <= MAX_EACH
        print(f"{name:<22}{size:>9}{flag}")
    print(f"{'total':<22}{total:>9}  (budget {MAX_TOTAL})")
    if total > MAX_TOTAL or not ok:
        print("font budget exceeded", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
