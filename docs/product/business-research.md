# 业务调研：TalkArt

> **关联 PRD**: `docs/product/prd.md`
> **上游研究**: `docs/product-research/proposal-20260611-talkart-tool/`

---

## 业务背景

TalkArt 处于三个增长市场的交叉点：在线绘图工具（$12B+）、语音 AI（$22B+）、AI Agent（$8B+）。目前市场上不存在「纯语音控制 + AI Agent Function Calling + SVG 矢量绘图」的 Web 产品。

详见上游研究：`01-market-research.md`、`02-competitor-analysis.md`。

---

## 目标市场

| 细分 | 可触达用户（估计） | 优先级 |
|---|---|---|
| 大众创作者 | 数亿级 | P0 |
| 无障碍用户 | 千万级 | P0 |
| 产品经理/快速原型 | 百万级 | P1 |
| 教育场景 | 千万级 | P2 |

---

## 竞品格局

三圈竞品均未覆盖我们的定位：
- 在线 SVG 编辑器（Figma/Excalidraw/tldraw）：无语音控制
- AI 创意工具（Midjourney/DALL·E/Canva AI）：生成栅格图
- 语音控制工具（Voice Access/Talon）：无语义绘图理解

详见上游研究：`02-competitor-analysis.md`。

---

## 商业模式（MVP 后）

开源核心 + Freemium：
- 免费层：基础工具 + 每日 50 次 LLM 调用
- 付费层（$5-10/月）：无限调用 + 进阶工具
- 企业层：协作 + 私有部署

MVP 阶段完全免费，聚焦验证。

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本 | 主 AIC |
