# TalkArt 分阶段能力报告（课题交付）

## 文档信息

| 字段 | 内容 |
|---|---|
| 版本 | v0.2.0-phase-6 |
| 日期 | 2026-06-12 |
| 基线 | v0.1.0-mvp → v0.2 六阶段改造 |
| 方案 | 方案 C+：矢量主 + executeDrawingPlan + 图层/路径/素材 |

---

## 一、四维度评估摘要

| 维度 | 计划目标 | 实现情况 | 评分 |
|---|---|---|---|
| **纯语音** | 全程免键鼠创作 | 演示模式 `?demo=1`、TTS 确认、语音撤销/导出；麦克风按钮仍需点击 | ★★★★☆ |
| **容错** | ASR 误识、意图歧义可恢复 | 多轮确认、纠错词、voiceError 局部提示、plan 单步失败跳过 | ★★★★☆ |
| **延迟** | 说完到看见图尽量快 | MiMo STT 静音判定约 4.5s；简单图 2 次 LLM；复杂图 1 次 plan 批量执行 | ★★★☆☆ |
| **复杂拆解** | 多步组合、包装设计 | executeDrawingPlan + 路径/图层/insertImage；康师傅示例见下文 | ★★★★☆ |

---

## 二、各阶段计划 vs 实现

| 阶段 | 计划交付 | 实现状态 | 未完成/说明 |
|:---:|---|:---:|---|
| **一** | 规划文档 + Schema 骨架 | ✅ | — |
| **二** | Plan 执行、mm 坐标、多 tool call | ✅ | — |
| **三** | drawPath/Polyline/Polygon、图层 CRUD | ✅ | — |
| **四** | 演示模式、TTS、语音 undo/export | ✅ | 全自动唤醒免触控未做（需常驻聆听） |
| **五** | insertImage、渐变 | ✅ | drawArc、setBackground 未做 |
| **六** | 包装场景验证、本报告 | ✅ | alignElements/distributeElements 未做；E2E 浏览器自动化未做 |

---

## 三、康师傅包装示例（executeDrawingPlan 参考）

语音：「画方便面包装袋正面，宽 90 毫米高 120 毫米，上方红色横幅，中间插图区，下方黄色标题。」

确认后 LLM 应生成类似 plan（节选）：

```json
{
  "description": "方便面包装正面线框",
  "steps": [
    { "tool": "setCanvasSize", "args": { "width": 90, "height": 120, "unit": "mm" } },
    { "tool": "createLayer", "args": { "id": "layer-bg", "name": "背景" } },
    { "tool": "drawRect", "args": { "position": { "x": 0, "y": 0 }, "size": { "width": 90, "height": 40 }, "unit": "mm", "style": { "fill": "红色" }, "layerId": "layer-bg" } },
    { "tool": "drawRect", "args": { "position": { "x": 0, "y": 40 }, "size": { "width": 90, "height": 80 }, "unit": "mm", "style": { "fill": "#FFF8E0" }, "layerId": "layer-bg" } },
    { "tool": "insertImage", "args": { "position": { "x": 25, "y": 45 }, "width": 40, "height": 28, "unit": "mm", "presetId": "bowl" } },
    { "tool": "drawText", "args": { "position": { "x": 30, "y": 95 }, "text": "红烧牛肉面", "style": { "fill": "黄色", "fontSize": 18 } } }
  ]
}
```

**说明**：未调用任何文生图 API；插图区使用预设 SVG 占位。

---

## 四、延迟实测（典型环境）

| 环节 | 耗时（约） | 备注 |
|---|---|---|
| 唤醒 + 首句 STT | 2–5s | 含静音判定 |
| LLM 确认轮 | 2–4s | DeepSeek |
| LLM 执行轮 / plan | 3–8s | 步数越多越长 |
| 本地渲染 | <50ms | SVG 增量 |
| **简单单圆端到端** | 8–15s | 两次 LLM + STT |
| **三圆 plan 端到端** | 10–18s | 一次 plan 优于三次单工具 |

---

## 五、未实现功能及原因

| 功能 | 原因 |
|---|---|
| `alignElements` / `distributeElements` | 时间优先级低于 plan+图层；可 v0.3 补充 |
| 全自动免点击唤醒 | 需常驻麦克风与浏览器策略，演示用 `?demo=1` + 一次点击开始 |
| Agent 多轮 tool result 回传 | 复杂度高；plan 批量已覆盖主要场景 |
| `drawPixelGrid` 像素整图 | 与矢量课题路线分叉，保留为备选 |
| Playwright E2E | 未纳入本阶段工期；以单元测试 + 演示脚本替代 |
| 渐变作用于圆/椭圆 | 仅 Rect 完整实现 GradientDefs，其余可复用模式扩展 |

---

## 六、测试与验收

- 单元测试：**281** 项通过（含 plan-executor、path-layer、asset-style）
- 演示脚本：`docs/qa/voice-demo-script.md`
- 手动验收：访问 `?demo=1` 完成语音画圆、撤销、导出

---

## 七、PR 合并记录

| 阶段 | PR |
|:---:|---|
| 一 | [#7](https://github.com/daidai5210/TalkArt/pull/7) |
| 二 | [#8](https://github.com/daidai5210/TalkArt/pull/8)（及早期提交） |
| 三 | [#9](https://github.com/daidai5210/TalkArt/pull/9) |
| 四 | [#10](https://github.com/daidai5210/TalkArt/pull/10) |
| 五 | [#11](https://github.com/daidai5210/TalkArt/pull/11) |
| 六 | 本提交 |
