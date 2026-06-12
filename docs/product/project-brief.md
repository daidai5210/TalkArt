# 项目启动卡：TalkArt

> **项目名称**: TalkArt（纯语音控制 AI SVG 绘图工具）
> **路线**: A-L（轻量 MVP）
> **上游研究**: `docs/product-research/proposal-20260611-talkart-tool/`

---

## 1. 项目基本信息

| 字段 | 内容 |
|---|---|
| 项目名称 | TalkArt |
| 项目代号 | talkart |
| 发起人 | 用户 (ou_add7b9125647d62f59aef25987961d58) |
| 主 AIC | 主 AIC |
| 启动日期 | 2026-06-11 |
| 目标版本 | v0.1.0-mvp |

---

## 2. 项目背景

### 为什么要做

市场上不存在「纯语音控制 + AI Agent Function Calling + SVG 矢量绘图」的 Web 产品。传统 SVG 编辑器依赖鼠标键盘，学习曲线陡峭；AI 文生图工具输出不可编辑的栅格图。本项目填补这个空白。

### 目标用户

所有人——不想学复杂绘图软件的大众创作者。自然覆盖无障碍场景（肢体障碍人士）。

### 核心痛点

- 绘图软件学习曲线陡峭（Figma 需要数小时学习）
- "我知道想画什么但画不出来"（想法→图形的鸿沟）
- 无障碍用户被排除在绘图创作之外
- AI 文生图不可精确控制、不可增量修改

---

## 3. 项目目标

### 一句话目标

> 说话就能画矢量图——AI Agent 理解你的创作意图，精确执行 SVG 绘图操作。

### 成功标准

- [ ] 语音→ASR→LLM FC→工具函数→SVG 全链路可用
- [ ] 15 个 P0 工具函数正确执行
- [ ] 工具选择准确率 >90%
- [ ] 端到端延迟 P50 <3 秒
- [ ] 导出 SVG/PNG 功能正常
- [ ] 设计文档（指令能力清单）完成

---

## 4. MVP 范围摘要

### 必须包含

- 语音输入（Web Speech API）+ 文本兜底
- AI Agent（LLM Function Calling）
- 15 个 P0 绘图工具函数
- SVG 画布渲染（React + 原生 SVG）
- 元素选中高亮
- 撤销/重做
- 导出 SVG/PNG
- 设计文档（指令能力支持清单）

### 明确不做

- 用户登录/注册
- 用户管理/权限
- 数据库
- 协作编辑
- 图层管理
- 复杂路径编辑
- 移动 App

---

## 5. 约束条件

| 类型 | 约束 |
|---|---|
| 前端 | React 18+ + Vite + Tailwind CSS |
| 后端 | 无（纯前端 + Vercel API Route BFF） |
| 数据 | 无数据库，画布状态仅存浏览器内存 |
| 部署 | Vercel（静态托管 + API Route） |
| 时间 | MVP 目标 4 周（10-15 人天） |
| 权限/账号 | 无（MVP 不做登录） |
| LLM | GPT-4o-mini / DeepSeek（Function Calling） |
| ASR | Web Speech API（MVP）/ Whisper API（生产） |

---

## 6. 项目结构与文档约束

### 标准目录结构

- 项目根目录是否采用标准结构：是
- 前端目录：`src/`（单前端应用）
- 后端目录：`api/`（Vercel API Route）
- 项目文档目录：`docs/`
- 测试目录：`tests/`
- 脚本目录：`scripts/`

### 核心模块初稿

| 模块 | 前端/后端 | 业务职责 | 备注 |
|---|---|---|---|
| voice-input | 前端 | 麦克风采集 + ASR 识别 | Web Speech API |
| ai-agent | 前端+BFF | LLM Function Calling 调度 | BFF 代理 API key |
| drawing-tools | 前端 | 15 个 P0 工具函数 | 语义→坐标映射 |
| svg-renderer | 前端 | React SVG 渲染 + 状态管理 | Zustand |
| export | 前端 | SVG/PNG 导出 | — |

### 文档白名单

- [x] `docs/product/`
- [x] `docs/architecture/`
- [x] `docs/api/`
- [x] `docs/gates/`
- [x] `docs/team-runtime/`
- [x] `docs/tasks/<phase>/`
- [x] `docs/versions/<version>/`
- [x] `docs/product-research/<proposal-id>/`
- [x] `docs/deployment/`
- [x] `docs/qa/`

---

## 7. 验收标准

- [ ] 核心流程可完成（语音→绘图→导出）
- [ ] 15 个工具函数全部可用
- [ ] 测试报告通过
- [ ] 设计文档完成
- [ ] 主 AIC 最终确认

---

## 8. 风险与假设

| 风险/假设 | 影响 | 应对 |
|---|---|---|
| LLM 空间推理不精确 | 高 | 工具函数侧语义→坐标映射 |
| 用户不接受语音交互 | 高 | MVP 验证核心假设，文本兜底 |
| 端到端延迟过高 | 中 | 流式响应 + 骨架动画 |
| Web Speech API 中文差 | 中 | 文本兜底 + 可切 Whisper |

---

## 9. 下一步

- [ ] 编写 PRD（Phase-01）
- [ ] 架构设计（Phase-02）
- [ ] 任务规划 + DoR（Phase-03）
- [ ] 开发验证（Phase-04）
- [ ] 发布交付（Phase-05）

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本：A-L 轻量 MVP 启动 | 主 AIC |
