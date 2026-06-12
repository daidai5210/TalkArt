/**
 * @module voice-input/__tests__/MimoSTTEngine.test
 */

import { describe, it, expect } from 'vitest';
import { SILENCE_FINALIZE_MS } from '../MimoSTTEngine';

describe('MimoSTTEngine', () => {
  it('auto-stops 1.5s after speech ends (silence threshold)', () => {
    expect(SILENCE_FINALIZE_MS).toBe(1500);
  });
});
