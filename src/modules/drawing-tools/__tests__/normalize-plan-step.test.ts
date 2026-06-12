import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizePlanStep } from '../normalize-plan-step';
import { ToolDispatcher } from '../../ai-agent/ToolDispatcher';

describe('normalizePlanStep', () => {
  it('maps fillColor to style.fill', () => {
    const { args } = normalizePlanStep('drawCircle', {
      position: { x: 10, y: 10, unit: 'mm' },
      r: 5,
      fillColor: '#FFD700',
    });
    expect(args.style).toEqual({ fill: '#FFD700' });
  });

  it('converts drawLine points[2] to start/end', () => {
    const { tool, args } = normalizePlanStep('drawLine', {
      points: [
        { x: 1, y: 2, unit: 'mm' },
        { x: 3, y: 4, unit: 'mm' },
      ],
      strokeColor: '#000',
    });
    expect(tool).toBe('drawLine');
    expect(args.start).toEqual({ x: 1, y: 2, unit: 'mm' });
    expect(args.stroke).toBe('#000');
  });

  it('converts drawLine points[3+] to drawPolyline', () => {
    const { tool } = normalizePlanStep('drawLine', {
      points: [
        { x: 1, y: 1, unit: 'mm' },
        { x: 2, y: 2, unit: 'mm' },
        { x: 3, y: 1, unit: 'mm' },
      ],
    });
    expect(tool).toBe('drawPolyline');
  });

  it('executes LLM-style cat plan with fill/stroke aliases and point1 triangles', () => {
    const planPath = join(process.cwd(), 'scripts/.last-cat-plan.json');
    if (!readFileSync(planPath, 'utf8')) return;
    const plan = JSON.parse(readFileSync(planPath, 'utf8')) as {
      steps: Array<{ tool: string; args: Record<string, unknown> }>;
    };
    if (!plan.steps?.length) return;

    const context = {
      width: 800,
      height: 600,
      defaultUnit: 'mm' as const,
      elements: [],
      selectedId: null,
    };
    const dispatcher = new ToolDispatcher(context);
    const result = dispatcher.execute('executeDrawingPlan', plan);

    expect(result.success).toBe(true);
    expect(result.planResult?.completedSteps).toBeGreaterThanOrEqual(8);
    expect(result.elements?.length).toBeGreaterThanOrEqual(8);

    const fills = result.elements?.map((el) => el.props.fill) ?? [];
    expect(fills.some((f) => String(f).toUpperCase() === '#FFD700')).toBe(true);
  });
});
