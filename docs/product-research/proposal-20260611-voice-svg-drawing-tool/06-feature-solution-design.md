# 功能方案设计：纯语音控制 AI SVG 绘图工具

> **proposal-id**: `proposal-20260611-talkart-tool`
> **分析日期**: 2026-06-11
> **关联**: `05-value-proposition-and-innovation.md` | `07-technical-feasibility.md`

---

## 一、产品架构总览

```
┌─────────────────────────────────────────────────────┐
│                    浏览器 (Web App)                    │
│                                                       │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────┐ │
│  │ 语音输入  │ → │  ASR 引擎 │ → │   LLM Agent      │ │
│  │ (麦克风)  │   │(Web Speech│   │ (Function Calling)│ │
│  │          │   │ /Whisper) │   │                  │ │
│  └──────────┘   └──────────┘   └────────┬─────────┘ │
│                                          │            │
│                               ┌──────────▼─────────┐ │
│                               │   绘图工具函数库     │ │
│                               │  (Tool Functions)   │ │
│                               └──────────┬─────────┘ │
│                                          │            │
│                               ┌──────────▼─────────┐ │
│                               │   SVG 渲染引擎      │ │
│                               │  (React + SVG DOM)  │ │
│                               └──────────┬─────────┘ │
│                                          │            │
│                               ┌──────────▼─────────┐ │
│                               │   画布 + 元素管理    │ │
│                               │  (状态管理 + 历史)   │ │
│                               └────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 二、核心用户流程

### 2.1 主流程

```
1. 打开网页
2. 点击麦克风按钮（或自动开始监听）
3. 说出绘图指令
4. 看到 ASR 识别文本（透明展示，可纠正）
5. LLM 解析意图 → 选择工具 → 填充参数 → 执行
6. SVG 图形出现在画布上
7. 继续说话修改/添加
8. 导出 SVG/PNG
```

### 2.2 交互模式

| 模式 | 触发方式 | 说明 |
|---|---|---|
| **按住说话** | 按住空格键/点击麦克风 | 类似微信语音，松手发送 |
| **持续监听** | 切换开关 | 持续识别，自动断句，适合无障碍场景 |
| **文本兜底** | 输入框打字 | 语音识别失败时的备用方案 |

---

## 三、功能模块设计

### 3.1 语音输入模块

| 功能 | 优先级 | 说明 |
|---|---|---|
| 语音采集（麦克风权限） | P0 | 浏览器 getUserMedia |
| ASR 实时转文字 | P0 | Web Speech API（MVP）/ Whisper API（生产） |
| 识别文本展示 | P0 | 画布上方显示"你说的：xxx" |
| 文本纠错/重说 | P1 | 识别错误时用户可以打字修正 |
| 多语言支持 | P2 | 先中文，后英文 |
| 语音唤醒词 | P2 | "嘿画图"等 |

### 3.2 AI Agent 模块（核心）

| 功能 | 优先级 | 说明 |
|---|---|---|
| LLM Function Calling | P0 | 将用户指令映射到工具函数调用 |
| 画布上下文维护 | P0 | 对话历史 + 当前画布状态传给 LLM |
| 工具选择与参数填充 | P0 | LLM 自动选择正确工具并填充参数 |
| 模糊指令消歧 | P0 | "大一点"→推断当前选中元素→scale(1.2) |
| 多步指令拆解 | P1 | "画三个圆排成一行"→拆为 3 次 drawCircle |
| 错误恢复 | P1 | 工具调用失败时 LLM 自动重试或询问 |
| 意图确认 | P2 | 不确定时反问"你是要画圆还是椭圆？" |

### 3.3 绘图工具函数库（Tool Definitions）

#### P0 基础图形工具

| 工具函数 | 参数 | 说明 |
|---|---|---|
| `drawRect` | x, y, width, height, fill, stroke, strokeWidth, rx(圆角) | 画矩形 |
| `drawCircle` | cx, cy, r, fill, stroke, strokeWidth | 画圆形 |
| `drawEllipse` | cx, cy, rx, ry, fill, stroke, strokeWidth | 画椭圆 |
| `drawLine` | x1, y1, x2, y2, stroke, strokeWidth | 画线段 |
| `drawText` | x, y, text, fontSize, fontFamily, fill | 画文字 |
| `drawTriangle` | x1,y1, x2,y2, x3,y3, fill, stroke, strokeWidth | 画三角形 |

#### P0 元素操作工具

| 工具函数 | 参数 | 说明 |
|---|---|---|
| `selectElement` | id / description / "最近创建的" | 选中元素 |
| `updateElement` | id, properties({fill, stroke, position, size...}) | 修改属性 |
| `deleteElement` | id | 删除元素 |
| `moveElement` | id, dx, dy / "左边"、"上面" | 移动元素 |
| `scaleElement` | id, scale / "大一点"、"两倍" | 缩放元素 |
| `duplicateElement` | id, dx, dy | 复制元素 |

#### P0 画布操作工具

| 工具函数 | 参数 | 说明 |
|---|---|---|
| `clearCanvas` | — | 清空画布 |
| `undoAction` | — | 撤销上一步 |
| `redoAction` | — | 重做 |
| `exportImage` | format("svg"/"png"), filename | 导出 |
| `setCanvasSize` | width, height | 设置画布大小 |

#### P1 进阶工具

| 工具函数 | 参数 | 说明 |
|---|---|---|
| `drawPath` | d(string), fill, stroke, strokeWidth | SVG 路径 |
| `drawPolygon` | points([x,y][]), fill, stroke, strokeWidth | 多边形 |
| `drawArrow` | x1,y1, x2,y2, stroke, strokeWidth | 箭头 |
| `drawGrid` | rows, cols, cellWidth, cellHeight | 网格 |
| `groupElements` | ids[] | 编组 |
| `alignElements` | ids[], alignment("left"/"center"/"right"/"top"/"bottom") | 对齐 |
| `distributeElements` | ids[], direction("horizontal"/"vertical") | 均匀分布 |
| `setBackground` | color / gradient | 画布背景 |
| `addGradient` | type, stops[], elementId | 渐变填充 |

#### P2 高级工具

| 工具函数 | 参数 | 说明 |
|---|---|---|
| `drawChart` | type("bar"/"line"/"pie"), data | 图表 |
| `drawIcon` | name, x, y, size | 图标库 |
| `importImage` | url, x, y, width, height | 导入图片 |
| `applyTemplate` | templateName | 模板 |
| `addAnimation` | elementId, type, duration | SVG 动画 |

### 3.4 SVG 渲染模块

| 功能 | 优先级 | 说明 |
|---|---|---|
| React + 原生 SVG 渲染 | P0 | 声明式 SVG 元素管理 |
| 元素选中高亮 | P0 | 蓝色边框 + 控制点 |
| 实时预览 | P0 | 工具调用后立即渲染 |
| 缩放/平移画布 | P1 | 滚轮缩放，拖拽平移 |
| 网格/参考线 | P1 | 辅助对齐 |
| 图层面板 | P2 | 多图层管理 |
| 动画渲染 | P2 | SMIL/CSS 动画 |

### 3.5 导出模块

| 功能 | 优先级 | 说明 |
|---|---|---|
| 导出 SVG | P0 | 原生 SVG 字符串下载 |
| 导出 PNG | P0 | Canvas 转 PNG 下载 |
| 复制到剪贴板 | P1 | 直接粘贴到其他应用 |
| 导出 PDF | P2 | 打印场景 |

---

## 四、MVP 功能清单

### P0（MVP 必须）

```
✅ 语音输入 → ASR 转文字
✅ LLM Function Calling 工具选择与执行
✅ 基础图形：矩形、圆形、椭圆、线段、文字、三角形
✅ 元素操作：选中、修改属性、移动、缩放、删除、复制
✅ 画布操作：清空、撤销、重做、导出 SVG/PNG
✅ 增量修改：基于现有元素修改
✅ 语义空间理解：左/右/上/下/中间/大一点/小一点
✅ 文本输入兜底
```

### P1（MVP 后第一迭代）

```
⭐ 路径/多边形/箭头
⭐ 对齐/分布
⭐ 渐变填充
⭐ 多步指令拆解
⭐ 画布缩放/平移
⭐ 复制到剪贴板
⭐ 多语言（英文）
```

### P2（长期）

```
⭐ 图表生成
⭐ 图层管理
⭐ 模板系统
⭐ 协作编辑
⭐ SVG 动画
⭐ 语音唤醒词
⭐ 图标库
```

---

## 五、不做项（明确边界）

| 不做项 | 原因 |
|---|---|
| AI 文生图（像素图） | 与核心定位冲突——我们是矢量指令绘图 |
| 图片编辑/滤镜 | 不是图片编辑器 |
| 3D 绘图 | 不在 SVG 2D 范围内 |
| 视频/音频编辑 | 不在范围内 |
| 离线桌面应用 | 先做 Web |
| 移动原生 App | Web 优先，移动端用 PWA |
| 实时协作 | MVP 后考虑 |

---

## 六、用户界面草图（文字描述）

```
┌─────────────────────────────────────────────────┐
│  🎤 TalkArt                   导出 ⬇️    │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   │
│  │ 🎤 按住说话或点击开始...                   │   │
│  │ 你说的：「画一个红色圆形在画布中间」         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │                                         │   │
│  │          🔴  (SVG 画布)                  │   │
│  │                                         │   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  工具: 矩形 ◻️ | 圆形 🔵 | 线条 📏 | 文字 📝     │
│  ↩️ 撤销  ↪️ 重做  🗑️ 清空                      │
└─────────────────────────────────────────────────┘
```

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本：产品架构、功能模块、工具函数定义、MVP 清单 | 主 AIC |
