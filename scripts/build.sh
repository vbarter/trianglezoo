#!/usr/bin/env bash
# Build dist/index.html from src/original.html by applying the patch steps in order.
set -euo pipefail
cd "$(dirname "$0")/.."
B=build; mkdir -p "$B" dist
python3 src/patches/port.py   src/original.html "$B/base.html"   # portrait layout, CrazyGames SDK, English only
python3 src/patches/zoo.py    "$B/base.html"    "$B/zoo.html"    # animal boards, art, album
python3 src/patches/levels.py "$B/zoo.html"     "$B/lv.html"     # level select and replay
python3 src/patches/foot.py   "$B/lv.html"      "$B/index.html"  # menu footer (My Zoo + sound)
cp "$B/index.html" dist/index.html
echo "built dist/index.html ($(wc -c < dist/index.html) bytes)"
