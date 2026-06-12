# 技术选型：TalkArt v0.1.0-mvp

> **版本**: v0.1.0-mvp

---

## 一、技术栈总览

| 层次 | 技术 | 版本 | 选择理由 |
|---|---|---|---|
| 框架 | React | 18+ | 生态最大，声明式 SVG 最佳 |
| 构建 | Vite | 5+ | 快速 HMR，轻量 SPA |
| 样式 | Tailwind CSS | 3+ | 快速 UI 开发 |
| 语言 | TypeScript | 5+ | 类型安全，工具函数参数校验 |
| 状态管理 | Zustand | 4+ | 轻量，适合画布元素管理 |
| ASR | Web Speech API | 浏览器内置 | 零成本，零延迟 |
| LLM | GPT-4o-mini / DeepSeek | latest | Function Calling 成熟，成本低 |
| BFF | Vercel API Route | — | 零配置，保护 API Key |
| 部署 | Vercel | — | 全球 CDN，免费额度 |

---

## 二、依赖清单

### 生产依赖

| 包 | 用途 |
|---|---|
| react, react-dom | UI 框架 |
| zustand | 状态管理 |
| openai | LLM API 调用（用于 BFF） |

### 开发依赖

| 包 | 用途 |
|---|---|
| vite | 构建工具 |
| @vitejs/plugin-react | React 支持 |
| typescript | 类型检查 |
| tailwindcss | CSS 框架 |
| vitest | 单元测试 |
| @testing-library/react | 组件测试 |
| playwright | E2E 测试 |

---

## 三、技术约束

| 约束 | 说明 |
|---|---|
| 浏览器 | Chrome/Edge（Web Speech API 最佳支持） |
| Node.js | 18+（Vercel 环境） |
| 无后端服务 | 纯前端 + BFF |
| 无数据库 | 状态仅存浏览器内存 |
| API Key | 仅存 Vercel 环境变量，前端不可见 |

---

## 四、与上游研究的一致性

本选型与 `07-technical-feasibility.md` 推荐方案一致：
- ✅ React + 原生 SVG
- ✅ Vite 构建
- ✅ Tailwind CSS
- ✅ Web Speech API（MVP）→ Whisper（生产）
- ✅ GPT-4o-mini + DeepSeek 双模型
- ✅ Vercel 部署

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本 | 主 AIC |
