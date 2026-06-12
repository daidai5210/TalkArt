# 阶段任务包 — TalkArt Build 阶段

> **版本**: v0.1.0-mvp
> **阶段**: build
> **任务拆解**: `docs/versions/v0.1.0-mvp/planning/task-breakdown.md`

---

## 任务包清单

| ID | 任务 | 预估 | 文件范围 |
|---|---|---|---|
| 1.1 | 项目初始化 | 0.5d | `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `src/main.tsx`, `src/App.tsx`, `src/store/index.ts` |
| 1.2 | SVG 渲染引擎 | 1.5d | `src/modules/svg-renderer/*`, `src/store/canvas-slice.ts` |
| 2.1 | 基础图形工具 | 2d | `src/modules/drawing-tools/basic-shapes.ts`, `coordinate-utils.ts`, `types.ts` |
| 2.2 | 元素操作 + 画布工具 | 2d | `src/modules/drawing-tools/element-ops.ts`, `canvas-ops.ts`, `tool-definitions.ts` |
| 3.1 | BFF API Route | 1d | `api/llm.ts` |
| 3.2 | AI Agent 对话管理 | 2d | `src/modules/ai-agent/*`, `src/store/agent-slice.ts` |
| 4.1 | 语音管理器 | 1.5d | `src/modules/voice-input/VoiceManager.ts`, `ASREngine.ts` |
| 4.2 | 唤醒词 + 结束语 | 1d | `src/modules/voice-input/WakeWordDetector.ts`, `EndPhraseDetector.ts` |
| 5.1 | UI 组件集成 | 1.5d | `src/components/*` |
| 5.2 | 测试 + 设计文档 | 2d | `tests/*`, `docs/qa/*`, 指令能力清单 |

---

## 执行顺序

```
1.1 → 1.2
         ↓
        2.1 → 2.2
                ↓
3.1 → 3.2     5.1 → 5.2
         ↘    ↗
4.1 → 4.2
```

TG-1（脚手架+SVG）和 TG-3（BFF）、TG-4（语音）可并行启动。TG-2 依赖 TG-1。TG-5 依赖 TG-2/3/4。

---

## DoR 检查（每任务）

| 任务 | 目标清晰 | 范围边界清晰 | 验收标准清晰 | 依赖就绪 | DoR |
|---|---|---|---|---|---|
| 1.1 | ✅ | ✅ | ✅ | ✅ | ✅ 通过 |
| 1.2 | ✅ | ✅ | ✅ | 1.1 | ✅ 通过 |
| 2.1 | ✅ | ✅ | ✅ | 1.2 | ✅ 通过 |
| 2.2 | ✅ | ✅ | ✅ | 2.1 | ✅ 通过 |
| 3.1 | ✅ | ✅ | ✅ | — | ✅ 通过 |
| 3.2 | ✅ | ✅ | ✅ | 3.1 | ✅ 通过 |
| 4.1 | ✅ | ✅ | ✅ | — | ✅ 通过 |
| 4.2 | ✅ | ✅ | ✅ | 4.1 | ✅ 通过 |
| 5.1 | ✅ | ✅ | ✅ | 2.2, 3.2, 4.2 | ✅ 通过 |
| 5.2 | ✅ | ✅ | ✅ | 5.1 | ✅ 通过 |

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本：10 个任务包，15 人天 | 主 AIC |
