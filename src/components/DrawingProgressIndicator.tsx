/**
 * @component DrawingProgressIndicator
 * Shows progressive drawing step progress and errors.
 */

import React from 'react';
import type { StepProgress } from '@/modules/leafer-renderer/types';

interface DrawingProgressIndicatorProps {
  progress: StepProgress | null;
  error: string | null;
  onRetry?: () => void;
}

export const DrawingProgressIndicator: React.FC<DrawingProgressIndicatorProps> = ({
  progress,
  error,
  onRetry,
}) => {
  if (error) {
    return (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/80 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg max-w-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-red-200 text-sm font-medium">绘图失败</span>
        </div>
        <p className="text-white text-xs mb-2">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-xs rounded transition-colors"
          >
            重试当前步
          </button>
        )}
      </div>
    );
  }

  if (!progress || !progress.isDrawing) return null;

  const pct = progress.totalSteps > 0
    ? Math.round((progress.currentStep / progress.totalSteps) * 100)
    : 0;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg min-w-[240px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-sm font-medium">
          第 {progress.currentStep}/{progress.totalSteps} 步
        </span>
        <span className="text-gray-400 text-xs">{pct}%</span>
      </div>
      <p className="text-gray-300 text-xs mb-2">{progress.message}</p>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-talkart-primary h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
