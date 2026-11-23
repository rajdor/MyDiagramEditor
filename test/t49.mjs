// Ctrl+C, Ctrl+X and Ctrl+V through the browser's own clipboard events: copied shapes reach the system clipboard as
// draw.io XML with no permission asked, and come back from it; draw.io XML copied anywhere else pastes as shapes; what was
// last copied here pastes from the editor's own copy, stepped aside each time; typing in a box still copies text.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (name, cond, detail) => { if (!cond) fail(name + (detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); };
await sleep(1200);
try { await b.defaultBrowserContext().overridePermissions('file://', ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']); } catch (e) { }
const key = async (k) => { await pg.keyboard.down('Control'); await pg.keyboard.press(k); await pg.keyboard.up('Control'); await sleep(250); };
const clip = () => pg.evaluate(() => navigator.clipboard.readText());
const setClip = (t) => pg.evaluate((t) => navigator.clipboard.writeText(t), t);
const cells = () => pg.evaluate(() => DiagramEditor.S.doc.pages[DiagramEditor.S.pi].cells.filter(c => !c.e && !c.isEdgeLabel).map(c => ({ v: c.value, x: c.x, y: c.y })));
const XML = '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="a" value="Alpha" style="rounded=1;html=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="144" height="64" as="geometry"/></mxCell></root></mxGraphModel>';
await pg.evaluate(() => { const S = DiagramEditor.S; S.doc = DiagramEditor.newDoc(); S.pi = 0; S.sel = []; S.undo = []; DiagramEditor.clearCache(); document.activeElement && document.activeElement.blur && document.activeElement.blur(); });
await setClip(XML); await pg.mouse.click(600, 400); await sleep(100);
await key('v');
ok('Ctrl+V adds draw.io XML from the system clipboard', JSON.stringify((await cells()).map(c => c.v)) === '["Alpha"]', await cells());
const undo1 = await pg.evaluate(() => DiagramEditor.S.undo.length);
ok('the paste is one undo step', undo1 === 1, undo1);
await pg.evaluate(() => { DiagramEditor.runCommand('selectAll'); }); await sleep(100);
await setClip('unrelated'); await key('c');
const c1 = await clip();
ok('Ctrl+C puts the selected shapes on the system clipboard as draw.io XML', /<mxGraphModel/.test(c1) && /value="Alpha"/.test(c1), c1.slice(0, 80));
await key('v'); await key('v');
const after = await cells();
ok('Ctrl+V after Ctrl+C pastes from the editor\'s own copy, each paste stepped aside', after.length === 3 && after[1].x !== after[0].x && after[2].x !== after[1].x, after);
await setClip('just some words'); await key('v');
ok('words on the clipboard that are not draw.io XML paste the shapes last copied here', (await cells()).length === 4);
await pg.evaluate(() => { const S = DiagramEditor.S; S.sel = [S.doc.pages[S.pi].cells.filter(c => !c.e)[0].id]; DiagramEditor.requestRender && DiagramEditor.requestRender(); }); await sleep(100);
await key('x');
ok('Ctrl+X removes the shape and puts it on the clipboard', (await cells()).length === 3 && /value="Alpha"/.test(await clip()));
// typing in a box: the browser copies the text as usual
await pg.evaluate(() => { const i = document.createElement('input'); i.id = 'tin'; i.value = 'hello box'; document.body.appendChild(i); i.focus(); i.select(); });
await key('c');
ok('in a text box Ctrl+C copies the text, not shapes', (await clip()) === 'hello box', await clip());
await pg.evaluate(() => document.getElementById('tin').remove());
ok('no page errors', !errors.length, errors);
if (!process.exitCode) console.log('Clipboard checks passed');
await b.close();
