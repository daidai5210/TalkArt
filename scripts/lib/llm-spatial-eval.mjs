/**
 * LLM-as-judge: evaluate spatial quality of a composed drawing.
 * Returns structured feedback with score (0-100) and issues.
 */

/**
 * Build a prompt for LLM to evaluate drawing quality.
 * @param {string} userIntent - original user request
 * @param {Array} planSteps - plan steps from planDrawingSteps
 * @param {Array} stepLayouts - assembled step layout records with bounds
 * @param {{ width: number, height: number }} canvas
 */
export function buildSpatialEvalPrompt(userIntent, planSteps, stepLayouts, canvas) {
  const stepDetails = stepLayouts.map((s) => {
    const b = s.bounds;
    const cx = Math.round((b.minX + b.maxX) / 2);
    const cy = Math.round((b.minY + b.maxY) / 2);
    const w = Math.round(b.maxX - b.minX);
    const h = Math.round(b.maxY - b.minY);
    return `- 步骤${s.stepIndex}「${s.label}」(layer=${s.layer}): 包围盒(${Math.round(b.minX)},${Math.round(b.minY)})-(${Math.round(b.maxX)},${Math.round(b.maxY)}) 中心(${cx},${cy}) 尺寸${w}×${h}`;
  }).join('\n');

  const planDetails = planSteps.map((s) => {
    const layout = s.layout ? JSON.stringify(s.layout) : '无';
    return `- 步骤${s.index}「${s.label}」: ${s.description} | layer=${s.layer} layout=${layout}`;
  }).join('\n');

  return `你是绘图空间关系评审专家。请根据以下信息评估绘图的空间质量。

## 用户原始需求
${userIntent}

## 画布
${canvas.width}×${canvas.height}px，原点(0,0)在左上角，x向右，y向下

## 绘图计划
${planDetails}

## 实际渲染结果（组装后坐标）
${stepDetails}

## 评审维度（请逐一打分并说明）
1. **结构完整性**：计划中的步骤是否都渲染了？有无遗漏？
2. **空间拼合**：组件之间是否有合理的连接/接触关系？（例如：头在身体上方且连接、腿在身体下方、屋顶在墙壁上方）
3. **层次正确**：foreground 组件是否在 structure 前面？background 是否在最后面？有无遮挡错误？
4. **比例合理**：组件之间的尺寸比例是否符合常识？（例如：头比身体小、门比窗户大）
5. **位置合理**：组件是否落在画布合理区域？（建筑应在地面线上、不漂浮；天空应在上方）
6. **整体聚散**：组件是否聚集在一个合理的视觉中心？有无过度分散或挤成一团？

## 输出格式（必须返回 JSON，不要其他文字）
{
  "score": 0-100的总分,
  "grades": {
    "completeness": 0-10,
    "connectivity": 0-10,
    "layering": 0-10,
    "proportion": 0-10,
    "placement": 0-10,
    "composition": 0-10
  },
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}

请严格输出 JSON，不要有任何其他文字。`;
}

/**
 * Call LLM API for evaluation.
 */
export async function callLlmForEval(callLlm, evalPrompt) {
  const result = await callLlm(
    [
      { role: 'system', content: '你是绘图质量评审专家，只输出 JSON。' },
      { role: 'user', content: evalPrompt },
    ],
    undefined, // no tools
  );
  // Try to parse the content as JSON
  const content = result.content || '';
  // Extract JSON from content
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return { score: 50, issues: ['评审 JSON 解析失败'], raw: content.slice(0, 500) };
    }
  }
  return { score: 50, issues: ['评审无 JSON 返回'], raw: content.slice(0, 500) };
}
