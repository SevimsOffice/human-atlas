#!/usr/bin/env bash
# Downloads the raw source data for Milestone 1 into data/raw/ (git-ignored).
#  - HuBMAP HRA 3D Reference Organs (CC BY 4.0), release folder v1.3:
#      VH_M_Heart.glb             (Heart, Male v1.2, doi:10.48539/HBM373.VSTV.568)
#      VH_M_Blood_Vasculature.glb (Blood Vasculature, Male)
#      asct-b-3d-models-mapping.csv (mesh node -> Uberon crosswalk)
#  - Uberon ontology (CC BY 3.0): uberon.obo (labels, definitions, part_of)
# Primary hosts first, publisher GitHub mirrors as fallback. HRA files are SHA-256 pinned.
set -euo pipefail
OUT="${1:-data/raw}"
mkdir -p "$OUT/hubmap" "$OUT/uberon"
CDN=https://cdn.humanatlas.io/hra-releases/v1.3/models
GH=https://raw.githubusercontent.com/hubmapconsortium/ccf-releases/main/v1.3/models
get() { # url-primary url-fallback dest
  [ -s "$3" ] && return 0
  curl -fsSL --max-time 300 -o "$3" "$1" 2>/dev/null || curl -fsSL --max-time 300 -o "$3" "$2"
}
check() { echo "$2  $1" | sha256sum -c --quiet - || { echo "SHA-256 mismatch: $1"; exit 1; }; }

get "$CDN/VH_M_Heart.glb" "$GH/VH_M_Heart.glb" "$OUT/hubmap/VH_M_Heart.glb"
check "$OUT/hubmap/VH_M_Heart.glb" b1237e7e765178e9357fd2ea7ccf19d55d0bf9ca55e187886635febe28244c70
get "$CDN/VH_M_Blood_Vasculature.glb" "$GH/VH_M_Blood_Vasculature.glb" "$OUT/hubmap/VH_M_Blood_Vasculature.glb"
check "$OUT/hubmap/VH_M_Blood_Vasculature.glb" a31ebed6d527b1cff31942e3e50d7c074c30b574337f68c4b89e9c88e4309d0d
get "$CDN/asct-b-3d-models-mapping.csv" "$GH/asct-b-3d-models-mapping.csv" "$OUT/hubmap/asct-b-3d-models-mapping.v1.3.csv"
get "http://purl.obolibrary.org/obo/uberon.obo" "https://raw.githubusercontent.com/obophenotype/uberon/master/uberon.obo" "$OUT/uberon/uberon.obo"
grep -m1 '^data-version' "$OUT/uberon/uberon.obo" || true
ls -l "$OUT/hubmap" "$OUT/uberon"
