// Security: hostile files must not run script, load anything from the network, or break out of a label.
// Covers label HTML (XSS and mutation XSS), link schemes, inline CSS, CSS injection through shape styles,
// prototype pollution through style keys, page names, editing a hostile label, and every export format.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const net = [];
await pg.setRequestInterception(true);
pg.on('request', r => { const u = r.url(); if (!/^(file|data|blob|about):/.test(u)) { net.push(u); r.abort(); } else r.continue(); });
await pg.evaluate(() => { window.__x = 0; });

const X = 'window.__x++';
const htmlPayloads = [
  `<img src=x onerror="${X}">`, `<svg><script>${X}</script></svg>`, `<svg onload="${X}"></svg>`,
  `<a href="java&#9;script:${X}">tab</a>`, `<a href=" JaVaScRiPt:${X}">case</a>`, `<a href="&#106;avascript:${X}">entity</a>`,
  `<a href="vbscript:msgbox(1)">vb</a>`, `<a href="data:text/html,<script>${X}</script>">data</a>`,
  `<iframe srcdoc="<script>parent.__x++</script>"></iframe>`, `<object data="javascript:${X}"></object>`, `<embed src="javascript:${X}">`,
  `<math><mtext><table><mglyph><style><img src=x onerror="${X}">`, `<noscript><p title="</noscript><img src=x onerror=${X}>">`,
  `<form><math><mtext></form><form><mglyph><style></math><img src onerror=${X}>`,
  `<svg></p><style><a id="</style><img src=1 onerror=${X}>">`, `<details open ontoggle="${X}">d</details>`,
  `<template><img src=x onerror="${X}"></template>`, `<textarea><img src=x onerror="${X}"></textarea>`,
  `<base href="https://evil.example/">`, `<link rel=stylesheet href="https://evil.example/s.css">`, `<meta http-equiv="refresh" content="0;url=javascript:${X}">`,
  `<div style="background:url(https://evil.example/bg.png)">bg</div>`, `<span style="position:fixed;inset:0;background:red">cover</span>`,
  `<span style="background-image:image-set('https://evil.example/is.png' 1x)">is</span>`, `<p style="color:red;background:u\\72l(https://evil.example/esc.png)">esc</p>`,
  `<font color="red;background:url(https://evil.example/c.png)">c</font>`, `<font face="x';background:url(https://evil.example/face.png)">f</font>`,
  `<b onmouseover="${X}" onclick="${X}">b</b>`, `<a href="#" onfocus="${X}" autofocus>focus</a>`
];
const styleAttacks = [
  `fontColor=red;background:url(https://evil.example/f1.png)`, `fontFamily=x';background:url(https://evil.example/f2.png);'`,
  `align=center;background:url(https://evil.example/f3.png)`, `labelBackgroundColor=red;background:url(https://evil.example/f4.png)`,
  `__proto__=polluted`, `__proto__`, `constructor=1`, `prototype=1`
];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '&#xa;');
let cells = '', y = 0, id = 10;
for (const p of htmlPayloads) { cells += `<mxCell id="h${id++}" value="${esc(p)}" style="html=1;whiteSpace=wrap;" vertex="1" parent="1"><mxGeometry x="0" y="${y += 70}" width="200" height="60" as="geometry"/></mxCell>\n`; }
cells += `<mxCell id="plain" value="${esc(`<img src=x onerror="${X}">`)}" style="whiteSpace=wrap;" vertex="1" parent="1"><mxGeometry x="300" y="0" width="200" height="60" as="geometry"/></mxCell>\n`;
// a style value cannot contain ';' inside the file, so the attacks that need one are injected through the file's raw style string
for (const s of styleAttacks) cells += `<mxCell id="s${id++}" value="styled" style="html=1;${esc(s)};" vertex="1" parent="1"><mxGeometry x="300" y="${y += 70}" width="200" height="60" as="geometry"/></mxCell>\n`;
cells += `<mxCell id="e1" value="${esc(`<img src=x onerror="${X}">edge`)}" style="html=1;" edge="1" parent="1" source="h10" target="plain"><mxGeometry relative="1" as="geometry"/></mxCell>\n`;
const xml = `<mxfile><diagram name="${esc(`<img src=x onerror="${X}">`)}" id="p1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>\n${cells}</root></mxGraphModel></diagram></mxfile>`;

await pg.evaluate((x) => DiagramEditor.loadText(x, 'hostile.drawio'), xml);
await sleep(600);
// edit every label (puts the label HTML into the editor box), then leave without changes
await pg.evaluate(() => { const E = DiagramEditor; for (const c of E.page().cells.filter(c => c.v)) { E.S.sel = [c.id]; E.startEdit(c); E.finishEdit(); } });
await sleep(300);
const dom = await pg.evaluate(() => {
  const bad = [];
  for (const e of document.querySelectorAll('#content *, #htmlLayer *, #tabs *')) {
    for (const a of e.attributes) if (/^on/i.test(a.name)) bad.push(e.tagName + ' ' + a.name);
    if (/^(SCRIPT|IFRAME|OBJECT|EMBED|BASE|LINK|META|IMG|TEMPLATE|STYLE)$/.test(e.tagName) && e.closest('foreignObject')) bad.push('tag ' + e.tagName);
    if (e.tagName === 'A' && e.hasAttribute('href') && !DiagramEditor.safeUrl(e.getAttribute('href'))) bad.push('href ' + e.getAttribute('href'));
    const st = e.getAttribute('style') || '';
    if (/url\(|position\s*:\s*fixed|image-set/i.test(st)) bad.push('style ' + st);
  }
  const tab = document.querySelector('#tabs .tab').textContent;
  return { bad, tab, proto: ({}).polluted, protoNull: Object.getPrototypeOf(DiagramEditor.parseStyle('__proto__;a=1')) === Object.prototype };
});
if (dom.bad.length) fail('unsafe DOM after load: ' + dom.bad.slice(0, 10).join(' | '));
if (!dom.tab.includes('<img')) fail('page name was not shown as plain text');
if (dom.proto !== undefined || !dom.protoNull) fail('style keys reached Object.prototype');

// exports: SVG text must be clean; PNG must render (a tainted canvas would throw); draw.io round trip stays escaped
const ex = await pg.evaluate(async () => {
  const E = DiagramEditor, svg = E.buildExportSvg(E.page()).svg;
  let png = 'ok'; try { const r = await E.renderToCanvas(E.buildExportSvg(E.page()), 1); r.canvas.toDataURL('image/png'); } catch (e) { png = String(e); }
  const x1 = E.serializeDoc(E.S.doc), d2 = await E.parseDrawio(x1), x2 = E.serializeDoc(d2);
  return { svg, png, stable: x1 === x2, script: /<script/i.test(x1) };
});
if (/<script|\son[a-z]+=|javascript:|url\(https?:/i.test(ex.svg)) fail('exported SVG contains active content: ' + (ex.svg.match(/<script|\son[a-z]+=|javascript:|url\(https?:[^)]*/i) || [])[0]);
if (ex.png !== 'ok') fail('PNG export failed on the hostile file: ' + ex.png);
if (!ex.stable) fail('draw.io round trip of the hostile file is not stable');
if (ex.script) fail('saved file contains an unescaped <script>');

// the sanitiser keeps ordinary formatting
const keep = await pg.evaluate(() => {
  const s = DiagramEditor.sanitizeHtml;
  return [s('<b>bold</b> <i>it</i>'), s('<a href="https://example.com/x">w</a>'), s('<a href="mailto:a@b.c">m</a>'), s('<a href="#top">t</a>'),
    s('<font color="#ff0000" face="Georgia">f</font>'), s('<span style="color: red; font-size: 14px">c</span>'), s('a<br>b'), s('<ul><li>one</li></ul>')];
});
const want = ['<b>bold</b> <i>it</i>', '<a href="https://example.com/x">w</a>', '<a href="mailto:a@b.c">m</a>', '<a href="#top">t</a>',
  '<font color="#ff0000" face="Georgia">f</font>', '<span style="color: red;font-size: 14px">c</span>', 'a<br>b', '<ul><li>one</li></ul>'];
keep.forEach((k, i) => { if (k !== want[i]) fail('sanitiser changed safe HTML: ' + JSON.stringify(k) + ' expected ' + JSON.stringify(want[i])); });
// colour and URL checks
const chk = await pg.evaluate(() => {
  const E = DiagramEditor;
  return { good: ['#fff', '#A1B2C3', '#11223344', 'red', 'none', 'rgb(1, 2, 3)', 'rgba(1,2,3,0.5)', 'hsl(120deg 50% 50%)', 'light-dark(#000000,#ffffff)'].every(E.safeColour),
    bad: ['red;x:y', 'url(x)', 'expression(alert(1))', 'rgb(1,2,3);background:red', '#fff}', ''].some(E.safeColour),
    urlsOk: ['https://a.b', 'http://a', 'mailto:x', 'tel:1', '#a', '/rel', 'rel/x'].every(E.safeUrl),
    urlsBad: ['javascript:1', ' javascript:1', 'java\tscript:1', 'JAVASCRIPT:1', 'vbscript:1', 'data:text/html,x', 'file:///etc/passwd', '\u0001javascript:1'].some(E.safeUrl) };
});
if (!chk.good) fail('a valid colour was rejected');
if (chk.bad) fail('an unsafe colour was accepted');
if (!chk.urlsOk) fail('a safe link was rejected');
if (chk.urlsBad) fail('an unsafe link was accepted');

await sleep(400);
const ran = await pg.evaluate(() => window.__x);
if (ran) fail('injected script ran ' + ran + ' time(s)');
if (net.length) fail('network requests were made: ' + [...new Set(net)].join(', '));
// defence in depth: the page's Content Security Policy blocks all network access
const csp = await pg.evaluate(async () => {
  const m = document.querySelector('meta[http-equiv="Content-Security-Policy"]'); if (!m) return { has: false };
  let blocked = false; try { await fetch('https://evil.example/x'); } catch (e) { blocked = true; }
  return { has: true, blocked, none: /default-src 'none'/.test(m.content), noConnect: !/connect-src[^;]*https?:/.test(m.content) };
});
if (!csp.has || !csp.none || !csp.noConnect) fail('Content Security Policy missing or allows the network');
if (!csp.blocked) fail('fetch to the network was not blocked');
console.log(errors.join('\n') || 'no errors');
console.log(process.exitCode ? 'Security test FAILED' : 'Security test passed (' + htmlPayloads.length + ' HTML payloads, ' + styleAttacks.length + ' style attacks)');
await b.close();
