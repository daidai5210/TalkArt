/**
 * @module canvas-renderer/DrawingProgress
 * 绘制进度/错误指示器组件
 */

import React from 'react';
import type { DrawingProgress } from './StreamingExecutor';
import type { ErrorReport } from './ErrorHandler';

interface DrawingProgressProps {
  progress: DrawingProgress | null;
  error: ErrorReport | null;
  onRetry?: () => void;
}

/**
 * 绘制进度/错误指示器
 */
export const DrawingProgressIndicator: React.FC<DrawingProgressProps> = ({
  progress,
  error,
  onRetry,
}) => {
  // 显示错误状态
  if (error) {
    return (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-900/80 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg max-w-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-red-200 text-sm font-medium">绘图失败</span>
        </div>
        <p className="text-white text-xs mb-1">{error.friendlyMessage}</p>
        <p className="text-gray-300 text-xs opacity-75">{error.suggestion}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-xs rounded transition-colors"
          >
            重试
          </button>
        )}
      </div>
    );
  }

  // 显示进度状态
  if (!progress || !progress.isDrawing) return null;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
      <div className="flex items-center gap-3">
        {/* 进度条 */}
        <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-talkart-primary transition-all duration-300 ease-out"
            style={{ width: `${progress.progress}%` }}
          />
        </div>

        {/* 进度文本 */}
        <span className="text-white text-xs font-medium whitespace-nowrap">
          {progress.message}
        </span>
      </div>
    </div>
  );
};
