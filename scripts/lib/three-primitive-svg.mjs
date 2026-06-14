/**
 * Render Three.js primitives to SVG for visual inspection in Node.js.
 * Used by iterative test scripts to produce viewable output without WebGL.
 */

function num(v, fallback = 0) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function colorStr(c) {
  if (!c || typeof c !== 'string') return '#cccccc';
  return c;
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/**
 * Render a single ThreePrimitive to SVG elements.
 * Mirrors ThreeStepBuilder.ts anchor logic projected to 2D.
 */
function primitiveToSvg(p) {
  const fill = colorStr(p.color);
  const opacity = num(p.opacity, 1);
  const stroke = 'none';
  const sw = 0;
  const style = `fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${sw}"`;

  switch (p.kind) {
    case 'plane': {
      const w = num(p.width, 100);
      const h = num(p.height, 100);
      // topLeft anchor (same as ThreeStepBuilder: position.set(x + w/2, -(y + h/2)))
      return `<rect x="${p.x}" y="${p.y}" width="${w}" height="${h}" ${style}/>`;
    }
    case 'circle': {
      const rx = num(p.width, num(p.radius, 20) * 2) / 2;
      const ry = num(p.height, rx * 2) / 2;
      // center anchor
      return `<ellipse cx="${p.x}" cy="${p.y}" rx="${rx}" ry="${ry}" ${style}/>`;
    }
    case 'box': {
      const w = num(p.width, 80);
      const h = num(p.height, 80);
      // topLeft anchor
      return `<rect x="${p.x}" y="${p.y}" width="${w}" height="${h}" ${style}/>`;
    }
    case 'sphere': {
      const r = num(p.radius, 40);
      // center anchor
      return `<ellipse cx="${p.x}" cy="${p.y}" rx="${r}" ry="${r}" ${style}/>`;
    }
    case 'cylinder': {
      const rTop = num(p.radiusTop, num(p.radius, 30));
      const h = num(p.height, 60);
      // top anchor: center-x, top-y
      return `<ellipse cx="${p.x}" cy="${p.y + h / 2}" rx="${rTop}" ry="${h / 2}" ${style}/>`;
    }
    case 'cone': {
      const r = num(p.radius, 30);
      const h = num(p.height, 60);
      // top anchor (vertex at x,y)
      return `<polygon points="${p.x},${p.y} ${p.x - r},${p.y + h} ${p.x + r},${p.y + h}" ${style}/>`;
    }
    case 'torus': {
      const r = num(p.radius, 40);
      const tube = num(p.tube, 12);
      // center anchor — approximate as ring
      return `<ellipse cx="${p.x}" cy="${p.y}" rx="${r + tube}" ry="${r + tube}" ${style}/>` +
             `<ellipse cx="${p.x}" cy="${p.y}" rx="${Math.max(0, r - tube)}" ry="${Math.max(0, r - tube)}" fill="#1a1a2e" fill-opacity="1"/>`;
    }
    case 'ring': {
      const inner = num(p.innerRadius, num(p.radius, 20) * 0.5);
      const outer = num(p.outerRadius, num(p.radius, 40));
      return `<ellipse cx="${p.x}" cy="${p.y}" rx="${outer}" ry="${outer}" ${style}/>` +
             `<ellipse cx="${p.x}" cy="${p.y}" rx="${inner}" ry="${inner}" fill="#1a1a2e" fill-opacity="1"/>`;
    }
    case 'line': {
      const toX = num(p.toX, p.x);
      const toY = num(p.toY, p.y);
      const lc = colorStr(p.color) || '#ffffff';
      return `<line x1="${p.x}" y1="${p.y}" x2="${toX}" y2="${toY}" stroke="${lc}" stroke-width="${num(p.strokeWidth, 2)}"/>`;
    }
    default:
      return '';
  }
}

/**
 * Render assembled primitives (with steps and layers) to a complete SVG.
 * @param {Array<{ stepIndex: number; label: string; layer: string; primitives: Array }>} steps
 * @param {number} width
 * @param {number} height
 */
export function renderStepsToSvg(steps, width, height) {
  // Sort by layer z (background first)
  const layerZ = { background: 0, ground: 2, structure: 8, detail: 14, foreground: 22 };
  const sorted = [...steps].sort(
    (a, b) => (layerZ[a.layer] ?? 8) - (layerZ[b.layer] ?? 8),
  );

  const shapes = [];
  for (const step of sorted) {
    shapes.push(`<!-- step ${step.stepIndex}: ${escapeXml(step.label)} (${step.layer}) -->`);
    for (const p of step.primitives) {
      shapes.push(primitiveToSvg(p));
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="#1a1a2e"/>
${shapes.join('\n')}
</svg>`;
}

/**
 * Compute bounds of a step's assembled primitives (same logic as primitive-bounds.ts).
 */
export function computeStepBounds(primitives) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const p of primitives) {
    let bMinX, bMinY, bMaxX, bMaxY;

    switch (p.kind) {
      case 'plane':
      case 'box': {
        const w = num(p.width, p.kind === 'box' ? 80 : 100);
        const h = num(p.height, p.kind === 'box' ? 80 : 100);
        bMinX = p.x; bMinY = p.y; bMaxX = p.x + w; bMaxY = p.y + h;
        break;
      }
      case 'circle':
      case 'sphere': {
        const rx = num(p.width, num(p.radius, 20) * 2) / 2;
        const ry = num(p.height, rx * 2) / 2;
        bMinX = p.x - rx; bMinY = p.y - ry; bMaxX = p.x + rx; bMaxY = p.y + ry;
        break;
      }
      case 'cylinder':
      case 'cone': {
        const r = num(p.radiusTop, num(p.radius, 30));
        const h = num(p.height, 60);
        bMinX = p.x - r; bMinY = p.y; bMaxX = p.x + r; bMaxY = p.y + h;
        break;
      }
      case 'torus':
      case 'ring': {
        const outer = p.kind === 'torus'
          ? num(p.radius, 40) + num(p.tube, 12)
          : num(p.outerRadius, num(p.radius, 40));
        bMinX = p.x - outer; bMinY = p.y - outer; bMaxX = p.x + outer; bMaxY = p.y + outer;
        break;
      }
      case 'line': {
        const toX = num(p.toX, p.x);
        const toY = num(p.toY, p.y);
        bMinX = Math.min(p.x, toX); bMinY = Math.min(p.y, toY);
        bMaxX = Math.max(p.x, toX); bMaxY = Math.max(p.y, toY);
        break;
      }
      default:
        continue;
    }

    minX = Math.min(minX, bMinX);
    minY = Math.min(minY, bMinY);
    maxX = Math.max(maxX, bMaxX);
    maxY = Math.max(maxY, bMaxY);
  }

  if (!isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}
