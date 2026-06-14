/**
 * Spatial alignment scoring for multi-step animal drawings.
 */

function center(bounds) {
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function gapBetween(a, b) {
  const dx = Math.max(0, Math.max(a.minX - b.maxX, b.minX - a.maxX));
  const dy = Math.max(0, Math.max(a.minY - b.maxY, b.minY - a.maxY));
  return Math.hypot(dx, dy);
}

function classifyStep(label) {
  const t = label.toLowerCase();
  if (/身体|轮廓|躯干|body|torso/.test(t)) return 'body';
  if (/头|head|face/.test(t)) return 'head';
  if (/耳|ear/.test(t)) return 'ear';
  if (/腿|脚|爪|leg|foot|paw/.test(t)) return 'leg';
  if (/尾|tail/.test(t)) return 'tail';
  if (/斑|spot|点/.test(t)) return 'spot';
  if (/眼|鼻|嘴|face|eye|nose|mouth/.test(t)) return 'face';
  return 'other';
}

function pick(steps, role) {
  return steps.filter((s) => classifyStep(s.label) === role);
}

/**
 * @param {Array<{ stepIndex: number; label: string; bounds: { minX:number; minY:number; maxX:number; maxY:number }; summary: string }>} stepLayouts
 * @param {{ width: number; height: number }} canvas
 */
export function scoreSpatialAlignment(stepLayouts, canvas) {
  const issues = [];
  let score = 100;

  if (stepLayouts.length === 0) {
    return { score: 0, issues: ['无步骤'], details: {} };
  }

  const body = pick(stepLayouts, 'body')[0];
  const head = pick(stepLayouts, 'head')[0];
  const ears = pick(stepLayouts, 'ear');
  const legs = pick(stepLayouts, 'leg');
  const tail = pick(stepLayouts, 'tail')[0];
  const spots = pick(stepLayouts, 'spot');

  const details = {};

  if (body && head) {
    const g = gapBetween(body.bounds, head.bounds);
    const verticalGap = body.bounds.minY - head.bounds.maxY;
    const hc = center(head.bounds);
    const bc = center(body.bounds);
    details.headBodyGap = Math.round(g);
    details.headBodyVerticalGap = Math.round(verticalGap);
    details.headAboveBody = hc.y < bc.y;
    details.headOverlapsBody = head.bounds.maxY >= body.bounds.minY - 5;

    if (g > 25) {
      score -= 30;
      issues.push(`头身分离: 间距 ${Math.round(g)}px`);
    } else if (g > 10) {
      score -= 18;
      issues.push(`头身间距偏大: ${Math.round(g)}px`);
    } else if (verticalGap > 8) {
      score -= 15;
      issues.push(`头未贴合身体: 垂直空隙 ${Math.round(verticalGap)}px`);
    }

    if (!details.headAboveBody) {
      score -= 25;
      issues.push('头部不在身体上方');
    }
  } else {
    score -= 10;
    if (!body) issues.push('缺少身体步骤');
    if (!head) issues.push('缺少头部步骤');
  }

  if (head && ears.length) {
    let earScore = 0;
    for (const ear of ears) {
      const g = gapBetween(head.bounds, ear.bounds);
      if (g < 60) earScore += 1;
      else {
        score -= 8;
        issues.push(`「${ear.label}」离头部过远: ${Math.round(g)}px`);
      }
    }
    details.earsNearHead = `${earScore}/${ears.length}`;
  }

  if (body && legs.length) {
    let legOk = 0;
    const bodyH = body.bounds.maxY - body.bounds.minY;
    for (const leg of legs) {
      const lc = center(leg.bounds);
      const attachGap = leg.bounds.minY - body.bounds.maxY;
      const legH = leg.bounds.maxY - leg.bounds.minY;
      const below = attachGap >= -5 && attachGap <= 20;
      const horizontalOk =
        lc.x >= body.bounds.minX - 40 && lc.x <= body.bounds.maxX + 40;
      const sizeOk = legH >= bodyH * 0.12;
      if (below && horizontalOk && sizeOk) legOk += 1;
      else {
        score -= 10;
        issues.push(
          `「${leg.label}」未接在身体下方 (gap=${Math.round(attachGap)}px, hOk=${sizeOk})`,
        );
      }
    }
    details.legsUnderBody = `${legOk}/${legs.length}`;
  }

  if (body && tail) {
    const g = gapBetween(body.bounds, tail.bounds);
    const attachGap = tail.bounds.minX - body.bounds.maxX;
    details.tailBodyGap = Math.round(g);
    details.tailAttachGap = Math.round(attachGap);
    if (g > 35) {
      score -= 15;
      issues.push(`尾巴离身体过远: ${Math.round(g)}px`);
    } else if (attachGap > 15) {
      score -= 10;
      issues.push(`尾巴未接在身体侧面: 横向空隙 ${Math.round(attachGap)}px`);
    }
  }

  if (body && spots.length) {
    let onBody = 0;
    for (const spot of spots) {
      const sc = center(spot.bounds);
      const inside =
        sc.x >= body.bounds.minX - 30 &&
        sc.x <= body.bounds.maxX + 30 &&
        sc.y >= body.bounds.minY - 30 &&
        sc.y <= body.bounds.maxY + 30;
      if (inside) onBody += 1;
      else {
        score -= 4;
        issues.push(`斑点「${spot.label}」不在身体区域`);
      }
    }
    details.spotsOnBody = `${onBody}/${spots.length}`;
  }

  // Overall spread — parts should cluster, not scatter across canvas
  let union = { ...stepLayouts[0].bounds };
  for (const s of stepLayouts.slice(1)) {
    union = {
      minX: Math.min(union.minX, s.bounds.minX),
      minY: Math.min(union.minY, s.bounds.minY),
      maxX: Math.max(union.maxX, s.bounds.maxX),
      maxY: Math.max(union.maxY, s.bounds.maxY),
    };
  }
  const spreadW = union.maxX - union.minX;
  const spreadH = union.maxY - union.minY;
  details.compositionSize = `${Math.round(spreadW)}×${Math.round(spreadH)}`;
  if (spreadW > canvas.width * 0.85 || spreadH > canvas.height * 0.85) {
    score -= 8;
    issues.push('整体构图过于分散');
  }

  return {
    score: Math.max(0, Math.round(score)),
    visualGrade: Math.max(1, Math.min(10, Math.round(score / 10))),
    issues,
    details,
  };
}

export function leaferJsonToSvg(steps, width, height) {
  const shapes = [];

  function walk(node, ox = 0, oy = 0) {
    if (!node || typeof node !== 'object') return;
    const tag = node.tag;
    const x = (node.x ?? 0) + ox;
    const y = (node.y ?? 0) + oy;
    const fill = node.fill ?? 'none';
    const stroke = node.stroke ?? 'none';
    const sw = node.strokeWidth ?? 0;

    if (tag === 'Ellipse' && node.width && node.height) {
      shapes.push(
        `<ellipse cx="${x}" cy="${y}" rx="${node.width / 2}" ry="${node.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`,
      );
    } else if (tag === 'Rect' && node.width && node.height) {
      shapes.push(
        `<rect x="${x}" y="${y}" width="${node.width}" height="${node.height}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`,
      );
    } else if (tag === 'Line') {
      const toX = node.toX ?? node.to?.x ?? x;
      const toY = node.toY ?? node.to?.y ?? y;
      shapes.push(
        `<line x1="${x}" y1="${y}" x2="${toX + ox}" y2="${toY + oy}" stroke="${stroke || fill || '#ccc'}" stroke-width="${sw || 1}"/>`,
      );
    }

    if (Array.isArray(node.children)) {
      for (const c of node.children) walk(c, x, y);
    }
  }

  for (const step of steps) walk(step.json);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#1a1a2e"/>${shapes.join('\n')}</svg>`;
}
