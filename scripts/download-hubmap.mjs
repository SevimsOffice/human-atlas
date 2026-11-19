// Downloads raw source data into data/raw/ (git-ignored), driven by scripts/models.config.json.
//  - HuBMAP HRA 3D Reference Organs (CC BY 4.0), release folder v1.3 (CDN first, publisher GitHub mirror second), SHA-256 pinned
//  - HRA ASCT+B -> 3D crosswalk (v1.3), Uberon ontology (CC BY 3.0)
// curl is used because it honours the HTTPS proxy configuration.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';

const OUT = process.argv[2] ?? 'data/raw';
const cfg = JSON.parse(readFileSync('scripts/models.config.json', 'utf8'));
const CDN = `https://cdn.humanatlas.io/hra-releases/${cfg.release}/models`;
const GH = `https://raw.githubusercontent.com/hubmapconsortium/ccf-releases/main/${cfg.release}/models`;
mkdirSync(`${OUT}/hubmap`, { recursive: true }); mkdirSync(`${OUT}/uberon`, { recursive: true });

function get(urls, dest) {
  if (existsSync(dest) && statSync(dest).size > 0) return;
  for (const u of urls) { try { execFileSync('curl', ['-fsSL', '--max-time', '300', '-o', dest, u], { stdio: 'ignore' }); return; } catch { /* next */ } }
  throw new Error(`download failed: ${dest}`);
}
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');

for (const m of cfg.models) {
  const dest = `${OUT}/hubmap/${m.raw}`;
  get([`${CDN}/${m.raw}`, `${GH}/${m.raw}`], dest);
  if (sha(dest) !== m.sha256) throw new Error(`SHA-256 mismatch: ${m.raw}`);
  console.log('ok', m.raw);
}
get([`${CDN}/asct-b-3d-models-mapping.csv`, `${GH}/asct-b-3d-models-mapping.csv`], `${OUT}/hubmap/asct-b-3d-models-mapping.v1.3.csv`);
get(['http://purl.obolibrary.org/obo/uberon.obo', 'https://raw.githubusercontent.com/obophenotype/uberon/master/uberon.obo'], `${OUT}/uberon/uberon.obo`);
console.log('crosswalk + uberon ok');
