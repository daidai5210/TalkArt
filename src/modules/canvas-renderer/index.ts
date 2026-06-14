/**
 * @module canvas-renderer
 * Canvas 2D 渲染模块 - 支持 JS 代码生成绘图
 *
 * 提供基于 Canvas 2D Context 的渲染能力，
 * 支持执行 LLM 生成的 JavaScript 绘图代码。
 */

export { CanvasLayer } from './CanvasLayer';
export { CodeExecutor, type ExecuteResult } from './CodeExecutor';
export { CanvasRenderer } from './CanvasRenderer';
export { StreamingExecutor, type DrawingProgress } from './StreamingExecutor';
export { DrawingProgressIndicator } from './DrawingProgress';
export { RobustExecutor, type RetryConfig, type RobustExecuteResult } from './RobustExecutor';
export { analyzeError, buildRepairPrompt, type ErrorReport } from './ErrorHandler';