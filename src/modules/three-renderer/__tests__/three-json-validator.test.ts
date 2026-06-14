import { describe, it, expect } from 'vitest';
import { validateThreeJson, parseRenderThreeStep } from '../three-json-validator';

describe('three-json-validator', () => {
  it('validates a simple group with ellipse', () => {
    const result = validateThreeJson({
      tag: 'Group',
      children: [{ tag: 'Ellipse', x: 100, y: 100, width: 80, height: 60, color: '#fff' }],
    });
    expect(result.valid).toBe(true);
  });

  it('rejects unknown tags', () => {
    const result = validateThreeJson({ tag: 'Unknown' });
    expect(result.valid).toBe(false);
  });

  it('wraps single primitive in group', () => {
    const result = validateThreeJson({ tag: 'Sphere', x: 50, y: 50, radius: 30 });
    expect(result.valid).toBe(true);
    expect(result.normalized?.tag).toBe('Group');
  });

  it('parses renderThreeStep tool args', () => {
    const parsed = parseRenderThreeStep({
      stepIndex: 0,
      label: '身体',
      threeJson: { tag: 'Ellipse', x: 400, y: 300, width: 200, height: 120, color: '#fff' },
    });
    expect(parsed?.label).toBe('身体');
    expect(parsed?.threeJson.tag).toBe('Group');
  });
});
