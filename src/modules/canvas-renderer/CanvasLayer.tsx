/**
 * @module canvas-renderer/CanvasLayer
 * Canvas 渲染层组件
 *
 * 提供基于 Canvas 2D Context 的渲染能力，
 * 与现有 SVG Canvas 并存，支持复杂图形绘制。
 */

import React, { useRef, useEffect } from 'react';
import { useStore } from '@/store';
import { CodeExecutor } from './CodeExecutor';

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
  const executorRef = useRef<CodeExecutor | null>(null);

  // Store 状态
  const canvasWidth = useStore((state) => state.canvasWidth);
  const canvasHeight = useStore((state) => state.canvasHeight);
  const canvasCode = useStore((state) => state.canvasCode);
  const canvasCodeVersion = useStore((state) => state.canvasCodeVersion);

  // 初始化执行器
  useEffect(() => {
    if (canvasRef.current && !executorRef.current) {
      executorRef.current = new CodeExecutor();
      executorRef.current.attach(canvasRef.current);
    }
  }, []);

  // 监听代码变化，重新执行
  useEffect(() => {
    if (!executorRef.current || !canvasCode) return;

    const result = executorRef.current.execute(canvasCode, {
      width: canvasWidth,
      height: canvasHeight,
      elements: [],
      selectedId: null,
    });

    if (!result.success) {
      console.error('Canvas 代码执行失败:', result.error);
      // TODO: 设置错误状态到 store
    }
  }, [canvasCode, canvasCodeVersion, canvasWidth, canvasHeight]);

  // Canvas 尺寸变化时调整
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = canvasHeight;
      // 重新执行代码以适应新尺寸
      if (canvasCode && executorRef.current) {
        executorRef.current.execute(canvasCode, {
          width: canvasWidth,
          height: canvasHeight,
          elements: [],
          selectedId: null,
        });
      }
    }
  }, [canvasWidth, canvasHeight]);

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