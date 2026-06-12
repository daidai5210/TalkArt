/**
 * Normalize LLM-generated tool args to match our drawing tool APIs.
 * Models often use fillColor/points/point2 instead of style/start/end.
 */

type PointLike = { x?: number; y?: number; unit?: string };

export interface NormalizedStep {
  tool: string;
  args: Record<string, unknown>;
}

function buildStyle(args: Record<string, unknown>): Record<string, unknown> | undefined {
  const style: Record<string, unknown> = {
    ...((args.style as Record<string, unknown>) ?? {}),
  };

  if (args.fillColor) style.fill = args.fillColor;
  if (args.color) style.fill = args.color;
  if (args.fill) style.fill = args.fill;
  if (args.strokeColor) style.stroke = args.strokeColor;
  if (args.stroke) style.stroke = args.stroke;
  if (args.strokeWidth !== undefined) style.strokeWidth = args.strokeWidth;

  return Object.keys(style).length > 0 ? style : undefined;
}

function stripStyleAliases(args: Record<string, unknown>): Record<string, unknown> {
  const next = { ...args };
  delete next.fillColor;
  delete next.strokeColor;
  delete next.color;
  return next;
}

/**
 * Normalize a single plan step before dispatch.
 */
export function normalizePlanStep(
  tool: string,
  rawArgs: Record<string, unknown>,
): NormalizedStep {
  let args: Record<string, unknown> = { ...rawArgs };
  const style = buildStyle(args);
  if (style) args.style = style;
  const styleStroke = style?.stroke as string | undefined;
  args = stripStyleAliases(args);

  // drawLine with points[] → drawLine (2 pts) or drawPolyline (3+ pts)
  if (tool === 'drawLine' && Array.isArray(args.points)) {
    const points = args.points as PointLike[];
    const stroke = (args.stroke as string) ?? styleStroke ?? '#333333';
    const strokeWidth = (args.strokeWidth as number) ?? 2;

    if (points.length >= 3) {
      return {
        tool: 'drawPolyline',
        args: { points, stroke, strokeWidth },
      };
    }
    if (points.length === 2) {
      return {
        tool: 'drawLine',
        args: {
          start: points[0],
          end: points[1],
          stroke,
          strokeWidth,
        },
      };
    }
  }

  if (tool === 'drawLine') {
    if (args.from && !args.start) {
      args.start = args.from;
      delete args.from;
    }
    if (args.to && !args.end) {
      args.end = args.to;
      delete args.to;
    }
    if (!args.stroke && args.strokeColor) args.stroke = args.strokeColor;
  }

  // drawTriangle with custom vertices (point1/2/3 or position+point2/3)
  if (tool === 'drawTriangle' && args.point2 && args.point3) {
    const p1 = (args.point1 ?? args.position) as PointLike;
    const p2 = args.point2 as PointLike;
    const p3 = args.point3 as PointLike;
    const unit = p1?.unit ?? 'mm';
    args.vertices = [
      { x: p1.x, y: p1.y, unit },
      { x: p2.x, y: p2.y, unit: p2.unit ?? unit },
      { x: p3.x, y: p3.y, unit: p3.unit ?? unit },
    ];
    delete args.point1;
    delete args.point2;
    delete args.point3;
    delete args.position;
    delete args.size;
  }

  if (tool === 'drawPolyline' && !args.stroke && args.strokeColor) {
    args.stroke = args.strokeColor;
  }

  if (tool === 'drawLine' || tool === 'drawPolyline') {
    const s = args.style as Record<string, unknown> | undefined;
    if (!args.stroke && s?.stroke) args.stroke = s.stroke;
    if (args.strokeWidth === undefined && s?.strokeWidth !== undefined) {
      args.strokeWidth = s.strokeWidth;
    }
  }

  return { tool, args };
}
