# MVP 范围：TalkArt v0.1.0-mvp

> **关联 PRD**: `docs/product/prd.md`

---

## 1. MVP 目标

验证核心假设：用户可以通过纯语音指令（唤醒词→语音输入→AI Agent 多轮确认→Function Calling→SVG），成功创建和编辑 SVG 矢量图形。

---

## 2. 用户与核心场景

| 用户 | 场景 | 目标 |
|---|---|---|
| 大众创作者 | 首次使用，说出想法→得到矢量图 | 验证零学习曲线 |
| 大众创作者 | 修改已有图形（改颜色、大小、位置） | 验证增量修改 |
| 无障碍用户 | 完全用语音完成创作流程 | 验证无障碍可用性 |

---

## 3. P0 功能清单（MVP 必做）

### 语音交互

- [x] 唤醒词检测（"小智"/"小zhi" 同音匹配）
- [x] 麦克风采集 + ASR 转文字（Web Speech API）
- [x] 识别文本实时展示
- [x] 结束语检测（"开始吧"/"可以了"）
- [x] 纠错支持（"不对"）
- [x] 文本输入兜底

### AI Agent

- [x] LLM Function Calling（GPT-4o-mini / DeepSeek）
- [x] 多轮反问确认需求
- [x] 工具选择 + 参数填充
- [x] 画布上下文注入
- [x] 模糊指令消歧

### 绘图工具（15 个）

- [x] 基础图形：drawRect, drawCircle, drawEllipse, drawLine, drawText, drawTriangle
- [x] 元素操作：selectElement, updateElement, deleteElement, moveElement, scaleElement, duplicateElement
- [x] 画布操作：clearCanvas, undoAction, exportImage

### SVG 渲染

- [x] React + 原生 SVG
- [x] 元素选中高亮
- [x] 实时预览

### 导出

- [x] 导出 SVG
- [x] 导出 PNG

### 设计文档

- [x] 指令能力支持清单

---

## 4. P1（MVP 后第一迭代）

- [ ] 进阶图形工具（路径/多边形/箭头）
- [ ] 对齐与分布
- [ ] 渐变填充
- [ ] 多步指令拆解（"画三个圆排成一行"）
- [ ] 画布缩放/平移
- [ ] 复制到剪贴板
- [ ] 英文支持
- [ ] 流式响应

---

## 5. P2（长期）

- [ ] 图层管理
- [ ] 模板系统
- [ ] 图表生成
- [ ] SVG 动画
- [ ] 图标库
- [ ] 协作编辑

---

## 6. 明确不做

| 不做项 | 原因 |
|---|---|
| AI 文生图 | 与核心定位冲突 |
| 用户登录/注册 | 非核心链路 |
| 数据库持久化 | 状态仅存浏览器 |
| 移动原生 App | Web 优先 |

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本 | 主 AIC |
