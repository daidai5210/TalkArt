/**
 * @module paper-renderer/PaperLayer
 * Paper.js 渲染层组件
 *
 * 在 Canvas 元素上运行 Paper.js 项目，
 * 支持执行 LLM 生成的 Paper.js 代码和预设模板。
 */

import React, { useRef, useEffect } from 'react';
import { useStore } from '@/store';
import paper from 'paper';
import { PaperCanvas } from './PaperCanvas';
import { Templates } from './Templates';

interface PaperLayerProps {
  visible?: boolean;
  zIndex?: number;
}

/**
 * Paper.js 渲染层
 */
export const PaperLayer: React.FC<PaperLayerProps> = ({
  visible = true,
  zIndex = 15, // 高于 SVG 和 Canvas 层
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paperCanvasRef = useRef<PaperCanvas | null>(null);

  // Store 状态
  const canvasWidth = useStore((state) => state.canvasWidth);
  const canvasHeight = useStore((state) => state.canvasHeight);
  const paperCode = useStore((state) => state.paperCode);
  const paperCodeVersion = useStore((state) => state.paperCodeVersion);
  const paperTemplates = useStore((state) => state.paperTemplates);

  // 初始化 Paper.js
  useEffect(() => {
    if (canvasRef.current && !paperCanvasRef.current) {
      paperCanvasRef.current = new PaperCanvas();
      paperCanvasRef.current.initialize(canvasRef.current);
    }

    return () => {
      // 清理 Paper.js 项目
      if (paperCanvasRef.current) {
        paperCanvasRef.current.clear();
      }
    };
  }, []);

  // 监听 Paper.js 代码变化
  useEffect(() => {
    if (!paperCanvasRef.current || !paperCode) return;

    try {
      paperCanvasRef.current.clear();

      // 执行 Paper.js 代码
      const codeFn = new Function('paper', paperCode);
      codeFn(paper);

      paper.view.update();
    } catch (error) {
      console.error('Paper.js 代码执行失败:', error);
    }
  }, [paperCode, paperCodeVersion]);

  // 监听模板变化
  useEffect(() => {
    if (!paperCanvasRef.current || paperTemplates.length === 0) return;

    try {
      paperCanvasRef.current.clear();

      // 渲染所有模板
      paperTemplates.forEach((tpl) => {
        Templates.render(tpl.template, {
          center: tpl.center,
          size: tpl.size,
          color: tpl.color,
          strokeColor: tpl.strokeColor,
        });
      });
    } catch (error) {
      console.error('Paper.js 模板渲染失败:', error);
    }
  }, [paperTemplates]);

  // Canvas 尺寸变化时调整
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasWidth;
      canvasRef.current.height = canvasHeight;

      if (paperCanvasRef.current) {
        paperCanvasRef.current.initialize(canvasRef.current);

        // 重新执行代码
        if (paperCode) {
          const codeFn = new Function('paper', paperCode);
          codeFn(paper);
          paper.view.update();
        }
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
        pointerEvents: 'none',
      }}
      className="paper-layer"
    />
  );
};