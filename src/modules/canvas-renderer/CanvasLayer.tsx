/**
 * @module canvas-renderer/CanvasLayer
 * Canvas 2D 渲染层组件
 *
 * 提供基于 Canvas 2D Context 的渲染能力，
 * 支持流式绘制、自动错误修复。
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import { RobustExecutor } from './RobustExecutor';
import { analyzeError, type ErrorReport } from './ErrorHandler';

interface CanvasLayerProps {
  /** 是否显示 Canvas 层 */
  visible?: boolean;
  /** Canvas 层叠顺序 */
  zIndex?: number;
}

/**
 * Canvas 渲染层组件
 *
 * 用于渲染 LLM 生成的 JS 代码绘制的图形，
 * 支持 Canvas 2D API 全部能力。
 */
export const CanvasLayer: React.FC<CanvasLayerProps> = ({
  visible = true,
  zIndex = 10,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const executorRef = useRef<RobustExecutor | null>(null);
  const repairAttemptedRef = useRef(false);

  // Store 状态
  const canvasWidth = useStore((state) => state.canvasWidth);
  const canvasHeight = useStore((state) => state.canvasHeight);
  const canvasCode = useStore((state) => state.canvasCode);
  const canvasCodeVersion = useStore((state) => state.canvasCodeVersion);
  const setDrawingProgress = useStore((state) => state.setDrawingProgress);
  const setLastError = useStore((state) => state.setLastError);

  // 初始化执行器
  useEffect(() => {
    if (canvasRef.current && !executorRef.current) {
      executorRef.current = new RobustExecutor();
      executorRef.current.attach(canvasRef.current);

      // 设置修复回调：当代码执行失败且可修复时，通过 LLM 修复
      executorRef.current.setOnRepairRequest(
        async (_code: string, _errorReport: ErrorReport): Promise<string> => {
          // 修复请求在 agent-slice 的 processErrorRepair 中处理
          // 这里只返回空字符串表示不使用自动修复
          console.warn('代码修复需要 LLM 参与，CanvasLayer 不直接处理');
          return '';
        },
      );
    }
  }, []);

  // 执行代码
  const executeCode = useCallback(async (code: string) => {
    if (!executorRef.current || !canvasRef.current) return;

    // 重置状态
    repairAttemptedRef.current = false;
    setLastError(null);
    setDrawingProgress({
      isDrawing: true,
      progress: 0,
      currentStep: 0,
      totalSteps: 3, // 最多 3 步：执行 + 2 次重试
      message: '开始绘制...',
    });

    const result = await executorRef.current.execute(code, {
      width: canvasWidth,
      height: canvasHeight,
      elements: [],
      selectedId: null,
    });

    if (result.success) {
      setDrawingProgress({
        isDrawing: false,
        progress: 100,
        currentStep: result.attempts,
        totalSteps: 3,
        message: result.attempts > 1 ? `修复后绘制完成（尝试 ${result.attempts} 次）` : '绘制完成!',
      });
    } else {
      const errorReport = result.errorReport || analyzeError(result.error || '');
      setLastError(errorReport);
      setDrawingProgress(null);
      console.error('Canvas 代码执行失败:', errorReport.friendlyMessage, errorReport.rawMessage);
    }
  }, [canvasCode, canvasWidth, canvasHeight, setLastError, setDrawingProgress]);

  // 监听代码变化，重新执行
  useEffect(() => {
    if (!executorRef.current || !canvasCode) return;
    executeCode(canvasCode);
  }, [canvasCode, canvasCodeVersion, executeCode]);

  // Canvas 尺寸变化时调整
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = canvasHeight;
      if (canvasCode && executorRef.current) {
        executeCode(canvasCode);
      }
    }
  }, [canvasWidth, canvasHeight, canvasCode, executeCode]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex,
        pointerEvents: 'none', // Canvas 层不响应鼠标事件
        borderRadius: 'inherit',
      }}
      className="canvas-layer"
    />
  );
};
