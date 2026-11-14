/* Shape definitions shared by the editor and the build script. */
const STENCIL_DEFS = {
  person: {
    w: 100, h: 120,
    prims: [
      { t: 'ellipse', x: 30, y: 2, w: 40, h: 40 },
      { t: 'path', d: [['M', 8, 120], ['C', 8, 76, 28, 50, 50, 50], ['C', 72, 50, 92, 76, 92, 120], ['Z']] }
    ]
  },
  people: {
    w: 160, h: 120,
    prims: [
      { t: 'ellipse', x: 18, y: 8, w: 32, h: 32 },
      { t: 'path', d: [['M', 2, 104], ['C', 2, 66, 18, 46, 34, 46], ['C', 50, 46, 66, 66, 66, 104], ['Z']] },
      { t: 'ellipse', x: 110, y: 8, w: 32, h: 32 },
      { t: 'path', d: [['M', 94, 104], ['C', 94, 66, 110, 46, 126, 46], ['C', 142, 46, 158, 66, 158, 104], ['Z']] },
      { t: 'ellipse', x: 60, y: 22, w: 40, h: 40 },
      { t: 'path', d: [['M', 36, 120], ['C', 36, 82, 56, 66, 80, 66], ['C', 104, 66, 124, 82, 124, 120], ['Z']] }
    ]
  }
};

function stencilXml(name) {
  const def = STENCIL_DEFS[name];
  const prim = (p) => {
    if (p.t === 'ellipse') return '<ellipse x="' + p.x + '" y="' + p.y + '" w="' + p.w + '" h="' + p.h + '"/>';
    let s = '<path>';
    for (const c of p.d) {
      if (c[0] === 'M') s += '<move x="' + c[1] + '" y="' + c[2] + '"/>';
      else if (c[0] === 'L') s += '<line x="' + c[1] + '" y="' + c[2] + '"/>';
      else if (c[0] === 'C') s += '<curve x1="' + c[1] + '" y1="' + c[2] + '" x2="' + c[3] + '" y2="' + c[4] + '" x3="' + c[5] + '" y3="' + c[6] + '"/>';
      else if (c[0] === 'Z') s += '<close/>';
    }
    return s + '</path>';
  };
  let xml = '<shape name="' + name + '" w="' + def.w + '" h="' + def.h + '" aspect="variable" strokewidth="inherit">';
  xml += '<background>' + prim(def.prims[0]) + '</background><foreground><fillstroke/>';
  for (let i = 1; i < def.prims.length; i++) xml += prim(def.prims[i]) + '<fillstroke/>';
  xml += '</foreground></shape>';
  return xml;
}

if (typeof module !== 'undefined') module.exports = { STENCIL_DEFS, stencilXml };
