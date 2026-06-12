# 测试范围：TalkArt v0.1.0-mvp

> **版本**: v0.1.0-mvp

---

## 测试范围

### 单元测试范围

| 模块 | 文件 | 优先级 |
|---|---|---|
| drawing-tools | basic-shapes.ts (6 个函数) | P0 |
| drawing-tools | element-ops.ts (6 个函数) | P0 |
| drawing-tools | canvas-ops.ts (3 个函数) | P0 |
| drawing-tools | coordinate-utils.ts | P0 |
| voice-input | WakeWordDetector.ts | P0 |
| voice-input | EndPhraseDetector.ts | P0 |
| svg-renderer | CanvasStore.ts (Zustand) | P0 |

### 集成测试范围

| 链路 | 优先级 |
|---|---|
| Mock LLM → ToolDispatcher → DrawingTools → SVG Store | P0 |
| Mock ASR → AgentStore → BFF → Mock LLM → Confirmation | P0 |

### E2E 测试范围

| 场景 | 优先级 |
|---|---|
| 打开页面 → 文本输入"画红色圆" → 确认 → SVG 出现 | P0 |
| 画图 → 修改颜色 → 撤销 → 重做 | P0 |
| 导出 SVG / PNG | P0 |

---

## 不测（MVP）

| 项目 | 原因 |
|---|---|
| 不同麦克风设备 | 硬件差异，无法自动化 |
| 噪音环境 ASR | 环境不可控 |
| 移动端浏览器 | 先桌面端 |
| Firefox/Safari | Chrome/Edge 优先 |

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本 | 主 AIC |
