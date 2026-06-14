function esc(value) {
  return String(value).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
}

function style(mark) {
  const stroke = mark.stroke ?? '#222222';
  const width = mark.width ?? 3;
  const opacity = mark.opacity ?? 1;
  return `stroke="${esc(stroke)}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"`;
}

function pointAttr([x, y]) {
  return `${Math.round(x * 100) / 100},${Math.round(y * 100) / 100}`;
}

function curvePath(points) {
  if (points.length < 2) return '';
  if (points.length === 2) return `M ${pointAttr(points[0])} L ${pointAttr(points[1])}`;
  let d = `M ${pointAttr(points[0])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    d += ` Q ${x1},${y1} ${(x1 + x2) / 2},${(y1 + y2) / 2}`;
  }
  d += ` T ${pointAttr(points[points.length - 1])}`;
  return d;
}

function markToSvg(mark) {
  switch (mark.kind) {
    case 'line':
      return `<line x1="${mark.from[0]}" y1="${mark.from[1]}" x2="${mark.to[0]}" y2="${mark.to[1]}" ${style(mark)} fill="none"/>`;
    case 'polyline':
      return `<polyline points="${mark.points.map(pointAttr).join(' ')}" ${style(mark)} fill="none"/>`;
    case 'curve':
      return `<path d="${curvePath(mark.points)}" ${style(mark)} fill="none"/>`;
    case 'ellipse':
      return `<ellipse cx="${mark.center[0]}" cy="${mark.center[1]}" rx="${mark.rx}" ry="${mark.ry}" ${style(mark)} fill="${esc(mark.fill ?? 'none')}"/>`;
    case 'polygon':
      return `<polygon points="${mark.points.map(pointAttr).join(' ')}" ${style(mark)} fill="${esc(mark.fill ?? 'none')}"/>`;
    case 'dot':
      return `<circle cx="${mark.center[0]}" cy="${mark.center[1]}" r="${mark.r}" fill="${esc(mark.fill ?? '#222222')}" opacity="${mark.opacity ?? 1}"/>`;
    default:
      return '';
  }
}

export function renderSketchStepsToSvg(steps, width, height) {
  const groups = steps.map((step) => {
    const marks = step.marks.map(markToSvg).filter(Boolean).join('\n');
    return `<g id="step-${step.stepIndex}" data-label="${esc(step.label)}">\n${marks}\n</g>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="#fffef8"/>
${groups.join('\n')}
</svg>`;
}
