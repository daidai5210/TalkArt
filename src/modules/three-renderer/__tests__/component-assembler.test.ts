import { describe, it, expect } from 'vitest';
import { assembleComponentOnCanvas, normalizeToLocalCenter } from '../component-assembler';
import { extractPrimitiveBounds } from '../primitive-bounds';
import { resolveCompositionLayoutTarget, defaultSceneMeta } from '../scene-composition';

describe('component-assembler', () => {
  it('normalizes local primitives to center origin', () => {
    const local = normalizeToLocalCenter([
      { kind: 'plane', x: 100, y: 100, width: 80, height: 40, color: '#fff' },
    ]);
    const b = extractPrimitiveBounds(local);
    expect(b).not.toBeNull();
    const cx = (b!.minX + b!.maxX) / 2;
    expect(Math.abs(cx)).toBeLessThan(2);
  });

  it('assembles local gate onto ground line', () => {
    const scene = defaultSceneMeta(600);
    const layout = resolveCompositionLayoutTarget(
      {
        index: 3,
        label: '牌坊',
        description: 'gate',
        layer: 'structure',
        grounded: true,
        layout: { attachTo: 2, attachEdge: 'top', offsetY: -2, width: 280, height: 220 },
      },
      scene,
      [
        {
          stepIndex: 2,
          label: '道路',
          bounds: { minX: 250, minY: 420, maxX: 550, maxY: 500 },
          summary: 'road',
        },
      ],
      800,
      600,
    );

    const assembled = assembleComponentOnCanvas(
      [
        { kind: 'box', x: -120, y: -80, width: 24, height: 160, depth: 16, color: '#800' },
        { kind: 'box', x: 96, y: -80, width: 24, height: 160, depth: 16, color: '#800' },
      ],
      { layoutTarget: layout, layer: 'structure', coordinateMode: 'local' },
    );

    const b = extractPrimitiveBounds(assembled);
    expect(b).not.toBeNull();
    expect(assembled[0].z).toBe(8);
    // bottom should be near road top (~420)
    expect(b!.maxY).toBeGreaterThan(400);
    expect(b!.maxY).toBeLessThan(430);
  });
});
