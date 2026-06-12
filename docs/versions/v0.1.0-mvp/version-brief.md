# 版本简介：v0.1.0-mvp

> **版本**: `v0.1.0-mvp`
> **路线**: A-L（轻量 MVP）
> **上游研究**: `docs/product-research/proposal-20260611-talkart-tool/`
> **创建日期**: 2026-06-11

---

## 版本目标

验证核心假设：**用户可以通过纯语音指令，借助 AI Agent 的 Function Calling 能力，成功创建和编辑 SVG 矢量图形。**

---

## MVP 核心链路

```
语音输入 → ASR 转文字 → AI Agent (LLM Function Calling) → 绘图工具函数 → SVG 渲染
```

---

## MVP 范围

### ✅ 包含

| 模块 | 内容 |
|---|---|
| 语音输入 | Web Speech API 语音识别 + 文本兜底 |
| AI Agent | LLM Function Calling（GPT-4o-mini / DeepSeek），工具选择 + 参数填充 |
| 绘图工具（15 个） | drawRect, drawCircle, drawEllipse, drawLine, drawText, drawTriangle, selectElement, updateElement, deleteElement, moveElement, scaleElement, duplicateElement, clearCanvas, undoAction, exportImage |
| SVG 渲染 | React + 原生 SVG，元素选中高亮 |
| 导出 | SVG / PNG 下载 |
| 设计文档 | 指令能力支持清单 |

### ❌ 不做

| 不做项 | 原因 |
|---|---|
| 用户登录/注册 | 非核心链路 |
| 用户管理/权限 | 非核心链路 |
| 数据库 | 画布状态仅存浏览器内存 |
| 协作编辑 | MVP 后 |
| 图层管理 | MVP 后 |
| 复杂路径编辑 | MVP 后 |
| 移动 App | Web 优先 |

---

## 成功指标

| 指标 | 目标 |
|---|---|
| 核心流程可用 | 语音→绘图→导出 全链路通过 |
| 工具选择准确率 | >90%（20 个标准指令） |
| 端到端延迟（P50） | <3 秒 |
| 用户任务完成率 | >70%（3 个测试任务） |

---

## 关联文档

| 文档 | 路径 |
|---|---|
| 文档清单 | `document-manifest.md` |
| 项目启动卡 | `../product/project-brief.md` |
| 研究方案包 | `../product-research/proposal-20260611-talkart-tool/` |

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本 | 主 AIC |
