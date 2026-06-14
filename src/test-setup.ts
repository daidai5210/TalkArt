import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@/modules/leafer-renderer/LeaferManager', () => ({
  getLeaferManager: () => ({
    clear: vi.fn(),
    undoLastStep: vi.fn(() => false),
    attach: vi.fn(),
    destroy: vi.fn(),
    addStepWithFadeIn: vi.fn(async () => 'step-0'),
    exportPNG: vi.fn(async () => 'data:image/png;base64,'),
    exportSVG: vi.fn(async () => '<svg></svg>'),
  }),
}));
