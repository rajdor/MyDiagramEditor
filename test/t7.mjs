import { open } from './harness.mjs';
import fs from 'fs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await pg.evaluate(() => {
  window.__dl = [];
  const orig = URL.createObjectURL; window.__blobs = new Map();
  URL.createObjectURL = (blob) => { const u = orig(blob); window.__blobs.set(u, blob); return u; };
  HTMLAnchorElement.prototype.click = function () { const blob = window.__blobs.get(this.href); window.__dl.push({ name: this.download, blob }); };
});
const getDl = async (i) => pg.evaluate(async (i) => { const d = window.__dl[i]; if (!d) return null; const buf = new Uint8Array(await d.blob.arrayBuffer()); let s = ''; for (let k = 0; k < buf.length; k += 8192) s += String.fromCharCode.apply(null, buf.subarray(k, k + 8192)); return { name: d.name, size: buf.length, b64: btoa(s) }; }, i);
await pg.evaluate(() => DiagramEditor.runCommand('testDiagram'));
await sleep(600);
// exports
await pg.evaluate(() => DiagramEditor.runCommand('exportSvg')); await sleep(300);
await pg.evaluate(async () => { await (async () => { })(); });
await pg.evaluate(() => { document.querySelector('.modalBack') && document.querySelector('.modalBack').remove(); });
await pg.evaluate(() => DiagramEditor.runCommand('exportPng'));  // opens dialog
await sleep(200);
await pg.evaluate(() => { const bs = Array.from(document.querySelectorAll('.modal footer .btn')); bs[bs.length - 1].click(); });
await sleep(2500);
await pg.evaluate(() => DiagramEditor.runCommand('exportPdf')); await sleep(3000);
await pg.evaluate(() => DiagramEditor.runCommand('exportGliffy')); await sleep(500);
const rep = await pg.evaluate(() => document.querySelector('.modal .body') ? document.querySelector('.modal .body').innerText : 'no modal');
console.log('GLIFFY REPORT:\n' + rep.slice(0, 1200));
for (let i = 0; i < 4; i++) { const d = await getDl(i); if (!d) { console.log('missing download', i); continue; } fs.writeFileSync('test/out/out_' + d.name, Buffer.from(d.b64, 'base64')); const min = { svg: 20000, png: 100000, pdf: 100000, drawio: 100000 }[d.name.split('.').pop()] || 1000;
  if (!(d.size > min)) { console.log('FAIL: ' + d.name + ' is only ' + d.size + ' bytes'); process.exitCode = 1; }
  console.log('download', d.name, 'over', min, 'bytes'); }
console.log(errors.join('\n') || 'no errors');
await b.close();
