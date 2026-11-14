import { open } from './harness.mjs';
const { b, pg, errors } = await open();
await pg.evaluate(() => DiagramEditor.runCommand('testDiagram'));
await new Promise(r => setTimeout(r, 500));
const shot = async (name, x, y, z, pi) => {
  await pg.evaluate((x, y, z, pi) => { const S = DiagramEditor.S; if (pi !== undefined && S.pi !== pi) { document.querySelectorAll('#tabs .tab')[pi].click(); } S.zoom = z; S.tx = -x * z; S.ty = -y * z; window.dispatchEvent(new Event('resize')); }, x, y, z, pi);
  await new Promise(r => setTimeout(r, 500));
  await pg.screenshot({ path: 'test/out/' + name + '.png', clip: { x: 216, y: 98, width: 956, height: 770 } });
};
await shot('z_shapes', 20, 0, 1.0, 0);
await shot('z_lines', 20, 640, 1.1, 0);
await shot('z_routing', 540, 650, 1.0, 0);
await shot('z_points', 20, 1030, 0.8, 0);
await shot('z_sketch_shapes', 20, 0, 1.0, 1);
await shot('z_sketch_lines', 20, 640, 1.0, 1);
console.log(errors.join('\n') || 'no errors');
await b.close();
