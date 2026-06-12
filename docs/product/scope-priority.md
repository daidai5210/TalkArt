# 范围与不做项：v0.1.0-mvp

> **版本**: `v0.1.0-mvp`
> **关联**: `project-brief.md` | `../versions/v0.1.0-mvp/version-brief.md`

---

## MVP 范围（P0）

详见上游研究 `11-mvp-scope-recommendation.md`。以下为最终确认版：

### 语音输入模块

- Web Speech API 语音识别（中文）
- 识别文本实时展示
- 文本输入兜底

### AI Agent 模块

- LLM Function Calling（GPT-4o-mini / DeepSeek）
- 工具选择 + 参数填充
- 画布上下文注入
- 单步指令执行

### 绘图工具（15 个）

| 类别 | 工具 |
|---|---|
| 基础图形 | `drawRect`, `drawCircle`, `drawEllipse`, `drawLine`, `drawText`, `drawTriangle` |
| 元素操作 | `selectElement`, `updateElement`, `deleteElement`, `moveElement`, `scaleElement`, `duplicateElement` |
| 画布操作 | `clearCanvas`, `undoAction`, `exportImage` |

### SVG 渲染

- React + 原生 SVG
- 元素选中高亮
- 实时预览

### 导出

- SVG 下载
- PNG 下载

### 基础设施

- Vercel 部署
- BFF API Key 代理
- 基础 UI 壳

### 文档

- 设计文档（指令能力支持清单）

---

## 明确不做（v0.1.0-mvp）

| 不做项 | 原因 | 计划 |
|---|---|---|
| 用户登录/注册 | 非核心链路 | 不确定 |
| 用户管理/权限 | 非核心链路 | 不确定 |
| 数据库 | 状态仅存浏览器 | 不确定 |
| 协作编辑 | 非 MVP | P2 |
| 图层管理 | 非 MVP | P2 |
| 路径/多边形工具 | 非 MVP | P1 |
| 对齐/分布 | 非 MVP | P1 |
| 渐变填充 | 非 MVP | P1 |
| 图表生成 | 非 MVP | P2 |
| 模板系统 | 非 MVP | P2 |
| SVG 动画 | 非 MVP | P2 |
| 移动原生 App | Web 优先 | P2（PWA） |
| 离线桌面应用 | Web 优先 | 不确定 |
| 语音唤醒词 | 非 MVP | P2 |
| 多语言（英文） | 先中文 | P1 |

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本：MVP 范围确认 | 主 AIC |
