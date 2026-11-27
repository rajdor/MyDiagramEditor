// Entity card (Containers): a draw.io swimlane with a solid header band (white title), the outline in the header colour, a
// light tint of it as the body, rounded corners, and its text as a text shape inside it. The outline and tint follow the header
// colour until set on their own; resizing fits the text to the body; the card keeps its colours in every diagram style.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (name, cond, detail) => { if (!cond) fail(name + (detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); };
await sleep(1200);
const r = await pg.evaluate(async () => {
  const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; E.clearCache();
  const def = E.SHAPE_LIB.find(s => s.key === 'entityCard');
  E.insertShape(def, { x: 200, y: 160 });
  const card = E.page().cells.find(c => c.style.deCard === '1'), body = E.page().cells.find(c => c.style.deCardBody === '1');
  const out = { group: def.group, card: { sw: card.style.swimlane !== undefined, head: card.style.fillColor, stroke: card.style.strokeColor, tint: card.style.swimlaneFillColor, font: card.style.fontColor, round: card.style.rounded },
    body: { inside: body.parent === card.id, fits: body.x === card.x && body.y === card.y + 34 && body.w === card.w && body.h === card.h - 34, text: body.value }, tintIsComputed: card.style.swimlaneFillColor === E.cardTint('#1E3A5F') };
  // header colour: outline and tint follow
  E.mutate(() => E.setColourKey(card, 'fillColor', '#0F6E56'));
  out.follow = [card.style.strokeColor, card.style.swimlaneFillColor === E.cardTint('#0F6E56')];
  // a body colour set on its own stays
  E.mutate(() => { card.style.swimlaneFillColor = '#FFFFFF'; E.setColourKey(card, 'fillColor', '#534AB7'); });
  out.ownBody = card.style.swimlaneFillColor;
  // resize: the text fills the body again
  E.mutate(() => { card.w = 300; card.h = 200; E.fitCardBody(card); });
  out.resized = body.w === 300 && body.h === 166;
  // the drawing: header band, body tint, one outline
  await new Promise(r => setTimeout(r, 200));
  const g = document.querySelector('#content [data-id="' + card.id + '"]'), fills = [...g.querySelectorAll('path')].map(p => p.getAttribute('fill'));
  out.drawn = fills; out.labelInHead = (() => { const l = document.querySelector('[data-label="' + card.id + '"]'); return l && Math.round(+l.getAttribute('height')) <= 34; })();
  // saved and opened: still a card with its text inside, as draw.io writes it
  const x = E.serializeDoc(S.doc), d = await E.parseDrawio(x), p = d.pages[0], c2 = p.cells.find(c => c.style.deCard === '1'), b2 = p.cells.find(c => c.style.deCardBody === '1');
  out.xml = /swimlane;startSize=34/.test(x) && /swimlaneFillColor=/.test(x); out.reopen = !!c2 && !!b2 && b2.parent === c2.id;
  // exported picture: the band, the tint and the title
  const svg = E.buildExportSvg(E.page(), { fonts: false }).svg; out.export = svg.includes('fill="#534AB7"') && svg.includes('fill="#FFFFFF"') && />Entity</.test(svg);
  // diagram styles: the card keeps its colours; its font follows Blueprint
  const before = [card.style.fillColor, card.style.strokeColor, card.style.swimlaneFillColor, card.style.fontColor, card.style.dashed];
  E.runStyleSwitch(S.doc, 'outline', 'blueprint', E.styleOpts('blueprint'));
  out.blueprint = { same: JSON.stringify([card.style.fillColor, card.style.strokeColor, card.style.swimlaneFillColor, card.style.fontColor, card.style.dashed]) === JSON.stringify(before), font: card.style.fontFamily === E.BP.font };
  // a new card in a Blueprint diagram keeps the card look
  S.doc.mode = 'blueprint'; E.insertShape(def, { x: 600, y: 160 });
  const nc = E.page().cells.filter(c => c.style.deCard === '1').pop();
  out.newInBlueprint = [nc.style.fillColor, nc.style.swimlaneFillColor, nc.style.fontColor, nc.style.dashed || null];
  return out;
});
ok('the Entity card is in Containers', r.group === 'Containers', r.group);
ok('a swimlane: navy header band, white title, outline in the header colour, tinted body, rounded', r.card.sw && r.card.head === '#1E3A5F' && r.card.stroke === '#1E3A5F' && r.card.font === '#FFFFFF' && r.card.round === '1' && r.tintIsComputed, r.card);
ok('its text is a text shape inside the card, filling the body', r.body.inside && r.body.fits && r.body.text === 'Description', r.body);
ok('a new header colour carries the outline and the tint with it', r.follow[0] === '#0F6E56' && r.follow[1], r.follow);
ok('a body colour set on its own is kept', r.ownBody === '#FFFFFF', r.ownBody);
ok('resizing the card fits its text to the body again', r.resized);
ok('drawn as a tinted body and a header band (no fill on the outline)', r.drawn.includes('#FFFFFF') && r.drawn.includes('#534AB7'), r.drawn);
ok('the title sits in the header band', r.labelInHead);
ok('saved as a draw.io swimlane and opened again as a card with its text inside', r.xml && r.reopen);
ok('the exported picture has the band, the body and the title', r.export);
ok('switching to Blueprint keeps the card\'s colours; its font follows', r.blueprint.same && r.blueprint.font, r.blueprint);
ok('a card added to a Blueprint diagram keeps the card look', r.newInBlueprint[0] === '#1E3A5F' && r.newInBlueprint[1] === '#EAF3FF' && r.newInBlueprint[2] === '#FFFFFF' && r.newInBlueprint[3] === null, r.newInBlueprint);
if (errors.length) fail('console errors: ' + errors.join(' | '));
if (!process.exitCode) console.log('PASS t55 entity card');
await b.close();
