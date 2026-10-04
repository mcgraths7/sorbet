#!/bin/sh
# make-edges.sh <out-dir> — build, measure the rendered edges, rebuild with the measurements in the page.
set -e
S=/private/tmp/claude-501/-Users-homelab/06652a5c-23e2-4a00-8579-52c3b446d84b/scratchpad
OUT="$1"; cd "$S"
rm -f "$OUT/edges-measure.json"; node build-edges.mjs "$OUT" "$2" >/dev/null
(cd pw && PLAYWRIGHT_BROWSERS_PATH="$S/pw/browsers" node edges-measure.mjs "$OUT/edges.html" "$OUT/edges-measure.json" >/dev/null)
node build-edges.mjs "$OUT" "$2"
