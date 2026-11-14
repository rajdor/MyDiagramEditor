// Builds a single self-contained HTML file from src/
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const { stencilXml } = require('./src/shapes.js');

const code = (name) => 'stencil(' + zlib.deflateRawSync(Buffer.from(encodeURIComponent(stencilXml(name)))).toString('base64') + ')';
const fontB64 = fs.readFileSync(path.join(__dirname, 'node_modules/@fontsource/architects-daughter/files/architects-daughter-latin-400-normal.woff2')).toString('base64');
const roughJs = fs.readFileSync(path.join(__dirname, 'node_modules/roughjs/bundled/rough.js'), 'utf8');
const roughLicense = '/* Rough.js 4.6.6 | MIT License | (c) Preet Shihn | https://roughjs.com */\n';

// Phosphor icons (MIT): regular, fill and duotone weights, grouped by Phosphor's own theme (figma_category).
// Themes most useful for workflow and architecture diagrams come first.
const PH_DIR = path.join(__dirname, 'node_modules/@phosphor-icons/core');
const phVersion = require(path.join(PH_DIR, 'package.json')).version;
const { icons: phIcons } = require(path.join(PH_DIR, 'dist/index.umd.js'));
const PH_THEME_ORDER = ['system & devices', 'technology & development', 'arrows', 'security & warnings', 'office & editing', 'communication',
  'people', 'time', 'math & finance', 'commerce', 'maps & travel', 'brands', 'design', 'media', 'education', 'health & wellness', 'weather & nature', 'games'];
function phosphorBlob() {
  const read = (w, n) => fs.readFileSync(path.join(PH_DIR, 'assets', w, n + (w === 'regular' ? '' : '-' + w) + '.svg'), 'utf8');
  const paths = (svg) => [...svg.matchAll(/<path([^>]*)\/>/g)].map(m => ({ d: (m[1].match(/ d="([^"]+)"/) || [])[1], op: /opacity=/.test(m[1]) }));
  const themes = [...new Set(phIcons.map(i => i.figma_category))].sort((a, b) => (PH_THEME_ORDER.indexOf(a) + 99 * (PH_THEME_ORDER.indexOf(a) < 0)) - (PH_THEME_ORDER.indexOf(b) + 99 * (PH_THEME_ORDER.indexOf(b) < 0)));
  const list = [];
  for (const i of phIcons.slice().sort((a, b) => a.name.localeCompare(b.name))) {
    const reg = paths(read('regular', i.name)), fil = paths(read('fill', i.name)), duo = paths(read('duotone', i.name));
    if (reg.length !== 1 || fil.length < 1) throw new Error('Unexpected Phosphor asset structure: ' + i.name);
    const bg = duo.filter(p => p.op).map(p => p.d).join(' '), fg = duo.filter(p => !p.op).map(p => p.d).join(' ');
    list.push([i.name, themes.indexOf(i.figma_category), i.tags.filter(t => !t.startsWith('*')).join(' '), reg[0].d, fil.map(p => p.d).join(' '), bg, fg === reg[0].d ? '' : fg]);
  }
  const json = JSON.stringify({ v: phVersion, themes, list });
  return { b64: zlib.deflateRawSync(Buffer.from(encodeURIComponent(json)), { level: 9 }).toString('base64'), count: list.length };
}
const ph = phosphorBlob();

const app = [
  "'use strict';", // first statement, so strict mode covers the whole app script
  src('shapes.js').replace(/^if \(typeof module.*$/m, ''),
  'const STENCIL_CODES = ' + JSON.stringify({ person: code('person'), people: code('people') }) + ';',
  'const FONT_B64 = "' + fontB64 + '";',
  'const PHOSPHOR_B64 = "' + ph.b64 + '";',
  src('core.js'), src('styles.js'), src('blueprint.js'), src('contrast.js'), src('icons.js'), src('mxroute.js'), src('render.js'), src('ui1.js'), src('ui2.js'), src('ui3.js'), src('embed.js')
].join('\n');

let html = src('index.html')
  .replace('/*CSS*/', () => src('style.css'))
  .replace('<!--GLOW-->', () => (src('render.js').match(/const GLOW_FILTER = '([^']+)'/) || [])[1])
  .replace('/*FONT_B64*/', () => fontB64)
  .replace('/*ROUGH*/', () => roughLicense + roughJs.replace(/<\/script/gi, '<\\/script'))
  .replace('/*APP*/', () => '(function(){\n' + app.replace(/<\/script/gi, '<\\/script') + '\n})();');

const out = path.join(__dirname, 'diagram-editor.html');
fs.writeFileSync(out, html);
console.log('Built', out, (html.length / 1024).toFixed(1) + ' KB');
console.log('person stencil:', stencilXml('person').length, 'chars; Phosphor ' + phVersion + ':', ph.count, 'icons,', (ph.b64.length / 1024).toFixed(0) + ' KB');
