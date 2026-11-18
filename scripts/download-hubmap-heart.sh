#!/usr/bin/env bash
# Downloads the HuBMAP HRA 3D Reference Organ: Heart, Male (VH_M_Heart, v1.2 model, CC BY 4.0)
# plus the ASCT+B -> 3D crosswalk that maps mesh node names to Uberon IDs.
# Primary host (cdn.humanatlas.io) is used first; the GitHub mirror (ccf-releases) is the fallback.
set -euo pipefail
OUT="${1:-data/raw/hubmap}"
mkdir -p "$OUT"
CDN=https://cdn.humanatlas.io/hra-releases/v1.3/models
GH=https://raw.githubusercontent.com/hubmapconsortium/ccf-releases/main/v1.3/models
fetch() { curl -fsSL --max-time 120 -o "$OUT/$2" "$CDN/$1" || curl -fsSL --max-time 120 -o "$OUT/$2" "$GH/$1"; }
fetch VH_M_Heart.glb VH_M_Heart.glb
fetch asct-b-3d-models-mapping.csv asct-b-3d-models-mapping.v1.3.csv
EXPECTED=b1237e7e765178e9357fd2ea7ccf19d55d0bf9ca55e187886635febe28244c70
ACTUAL=$(sha256sum "$OUT/VH_M_Heart.glb" | cut -d' ' -f1)
[ "$ACTUAL" = "$EXPECTED" ] || { echo "SHA-256 mismatch for VH_M_Heart.glb: $ACTUAL"; exit 1; }
ls -l "$OUT"
