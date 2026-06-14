/**
 * Step progress markers — circular bubbles with connectors.
 */

import React from 'react';
import { MaterialIcon } from './MaterialIcon';

export interface StepItem {
  index: number;
  label: string;
}

interface StepProgressBarProps {
  steps: StepItem[];
  /** 1-based current step while drawing; 0 = planning */
  currentStep: number;
  isPlanning?: boolean;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  steps,
  currentStep,
  isPlanning = false,
}) => {
  if (steps.length === 0) return null;

  return (
    <div
      className="flex items-center justify-center gap-3 md:gap-6 mt-4 w-full overflow-x-auto px-4 py-2"
      role="list"
      aria-label="绘制步骤进度"
    >
      {steps.map((step, i) => {
        const stepNum = i + 1;
        const isDone = !isPlanning && currentStep > stepNum;
        const isActive = isPlanning ? i === 0 : currentStep === stepNum;
        const isPending = !isDone && !isActive;

        return (
          <React.Fragment key={step.index}>
            {i > 0 && (
              <div
                className={`w-6 md:w-12 h-2 bg-surface-container-high rounded-full shrink-0 ${
                  isPending && !isActive ? 'opacity-60' : ''
                }`}
                aria-hidden
              />
            )}
            <div
              className={`flex flex-col items-center gap-2 shrink-0 ${
                isActive ? 'transform scale-110 origin-bottom' : isPending ? 'opacity-60' : ''
              }`}
              role="listitem"
              aria-current={isActive ? 'step' : undefined}
            >
              {isDone ? (
                <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center border-2 border-surface-container-lowest shadow-[0px_4px_0px_0px_#004883] tactile-active transition-transform">
                  <MaterialIcon name="check" weight={700} className="text-2xl" />
                </div>
              ) : isActive ? (
                <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-xl border-4 border-surface-container-lowest shadow-[0px_6px_0px_0px_#005e2d] tactile-active transition-transform relative">
                  {isPlanning ? (
                    <MaterialIcon name="hourglass_empty" className="text-3xl animate-spin" />
                  ) : (
                    <>
                      <div className="absolute inset-0 rounded-full border-4 border-primary-container animate-ping opacity-20" />
                      {stepNum}
                    </>
                  )}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-headline-lg border-2 border-surface-container-highest">
                  {stepNum}
                </div>
              )}
              <span
                className={`font-label-bold text-sm md:text-label-bold ${
                  isActive ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
