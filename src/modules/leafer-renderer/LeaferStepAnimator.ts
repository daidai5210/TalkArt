import type { LeaferStepJSON } from './types';

const FADE_DURATION = 0.7;

/** Attach fade-in animation config to a Leafer JSON step. */
export function withFadeInAnimation(stepJson: LeaferStepJSON): LeaferStepJSON {
  return {
    ...stepJson,
    opacity: 0,
    animation: {
      keyframes: [{ opacity: 0 }, { opacity: 1 }],
      duration: FADE_DURATION,
      easing: 'ease-out',
    },
  };
}

export function stepDelayMs(): number {
  return 200;
}
