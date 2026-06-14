/**
 * Code-gen drawing test: LLM generates Three.js code → execute → render SVG → evaluate.
 *
 * Usage:
 *   npx tsx scripts/iterative-codegen-draw.mjs
 *   npx tsx scripts/iterative-codegen-draw.mjs --iteration 1
 *   npx tsx scripts/iterative-codegen-draw.mjs --prompt "画一只可爱的小猫"
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load .env
for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

// Import project modules
const {
  buildCodeGenSystemPrompt,
  buildCodeGenStepPrompt,
  buildPlanningPrompt,
} = await import('../src/modules/code-gen-renderer/codegen-system-prompt.ts');
const { executeDrawCode, shapesToSvg } = await import(
  '../src/modules/code-gen-renderer/code-executor.ts'
);
const { resolveLlmEnvConfig } = await import('../src/modules/ai-agent/llm-env-config.ts');

const args = process.argv.slice(2);
const iteration = Number(args[args.indexOf('--iteration') + 1] || '1');
const promptIdx = args.indexOf('--prompt');
const userPrompt =
  promptIdx >= 0
    ? args[promptIdx + 1]
    : '一只可爱的小猫';  // 简单的简笔画测试用例

const CANVAS = { width: 800, height: 600 };
const outDir = join(root, 'scripts', 'iterations-codegen', `iter-${String(iteration).padStart(2, '0')}`);
mkdirSync(outDir, { recursive: true });

function getLlmConfig() {
  return resolveLlmEnvConfig(process.env);
}

async function callLlm(messages, retries = 3) {
  const cfg = getLlmConfig();
  if (!cfg.apiKey) throw new Error('LLM API key missing — set LLM_API_KEY in .env');

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(cfg.chatCompletionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages,
          max_tokens: 4096,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(180_000),
      });

      const data = await res.json();
      if (!res.ok) {
        lastErr = new Error(`LLM ${res.status}: ${JSON.stringify(data.error ?? data)}`);
        continue;
      }

      const content = data.choices?.[0]?.message?.content || '';
      return { content };
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      console.warn(`  LLM attempt ${attempt + 1} failed: ${lastErr.message}`);
    }
  }
  throw lastErr;
}

/**
 * Extract JavaScript code from LLM response (handles markdown code blocks).
 */
function extractCode(content) {
  // Try to extract from code block
  const codeBlockMatch = content.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // If no code block, try to find function definition
  const funcMatch = content.match(/function\s+draw(?:Step)?\s*\([^)]*\)\s*\{[\s\S]*\}/);
  if (funcMatch) {
    return funcMatch[0];
  }
  // Return as-is
  return content.trim();
}

/**
 * Extract JSON from LLM response.
 */
function extractJson(content) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
  return null;
}

console.log(`\n=== Code-Gen Drawing Iteration ${iteration} ===`);
console.log(`Prompt: ${userPrompt}`);
console.log(`Output: ${outDir}/\n`);

// Load previous iteration for comparison
let prevIterationData = null;
if (iteration > 1) {
  const prevPath = join(root, 'scripts', 'iterations-codegen', `iter-${String(iteration - 1).padStart(2, '0')}`, 'report.json');
  if (existsSync(prevPath)) {
    prevIterationData = JSON.parse(readFileSync(prevPath, 'utf8'));
  }
}

// --- 1. Planning ---
console.log('--- Phase 1: Planning Steps ---');
const planPrompt = buildPlanningPrompt({
  width: CANVAS.width,
  height: CANVAS.height,
  userIntent: userPrompt,
});

const planT0 = Date.now();
const planResult = await callLlm([
  { role: 'system', content: '你是绘图规划助手，只输出 JSON。' },
  { role: 'user', content: planPrompt },
]);
console.log(`Planning (${Date.now() - planT0}ms)`);

const plan = extractJson(planResult.content);
if (!plan || !plan.steps) {
  console.error('Failed to parse plan:', planResult.content.slice(0, 500));
  process.exit(1);
}

const totalSteps = plan.totalSteps || plan.steps.length;
console.log(`Planned ${totalSteps} steps:`);
for (let i = 0; i < plan.steps.length; i++) {
  console.log(`  [${i + 1}] ${plan.steps[i].description}`);
}
writeFileSync(join(outDir, 'plan.json'), JSON.stringify(plan, null, 2));

// --- 2. Generate code for each step ---
console.log('\n--- Phase 2: Generating Code ---');
const systemPrompt = buildCodeGenSystemPrompt({
  width: CANVAS.width,
  height: CANVAS.height,
});

const stepsCode = [];
const stepsDescription = [];
const allShapes = [];

for (let step = 0; step < totalSteps; step++) {
  const stepDesc = plan.steps[step]?.description || `步骤 ${step + 1}`;
  console.log(`\n--- Step ${step + 1}/${totalSteps}: ${stepDesc} ---`);

  const stepPrompt = buildCodeGenStepPrompt({
    width: CANVAS.width,
    height: CANVAS.height,
    userIntent: userPrompt,
    currentStep: step,
    totalSteps,
    previousStepsCode: stepsCode,
    previousStepsDescription: stepsDescription,
  });

  const stepT0 = Date.now();
  const result = await callLlm([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: stepPrompt },
]);
  console.log(`Code generated (${Date.now() - stepT0}ms)`);

  const code = extractCode(result.content);
  console.log(`Code length: ${code.length} chars`);

  // Save code
  writeFileSync(join(outDir, `step-${step + 1}.js`), code);

  // Execute code and collect shapes
  const shapes = executeDrawCode(code, step);
  console.log(`Shapes created: ${shapes.length}`);

  stepsCode.push(code);
  stepsDescription.push(stepDesc);
  allShapes.push(...shapes);
}

// --- 3. Render SVG ---
console.log('\n--- Phase 3: Rendering SVG ---');
const svg = shapesToSvg(allShapes, CANVAS.width, CANVAS.height);
writeFileSync(join(outDir, 'output.svg'), svg);
console.log(`SVG saved with ${allShapes.length} total shapes`);

// --- 4. Evaluate ---
console.log('\n--- Phase 4: LLM Evaluation ---');
const evalPrompt = `你是绘图质量评审专家。请评估以下代码生成的插画质量。

## 用户需求
${userPrompt}

## 画布
${CANVAS.width}×${CANVAS.height}px

## 绘制步骤（共${totalSteps}步）
${stepsDescription.map((d, i) => `步骤${i + 1}: ${d}`).join('\n')}

## 生成的图形数据
总共 ${allShapes.length} 个图形元素。
${allShapes.slice(0, 10).map((s, i) => `  ${i + 1}. ${s.type} at (${Math.round(s.x)},${Math.round(s.y)}) ${s.width ? `${s.width}×${s.height}` : `r=${s.radius}`} color=${s.color}`).join('\n')}
${allShapes.length > 10 ? `  ... 还有 ${allShapes.length - 10} 个图形` : ''}

## 评审维度
1. 结构完整性：是否完整表达了用户需求的内容？
2. 空间关系：各部分的位置关系是否正确（如头在身体上、腿在下面）？
3. 比例合理：各部分的大小比例是否符合常识？
4. 视觉效果：整体是否美观、清晰？
5. 代码质量：代码是否简洁、规范？

## 输出格式（必须返回 JSON）
{
  "score": 0-100的总分,
  "grades": {
    "completeness": 0-10,
    "spatial": 0-10,
    "proportion": 0-10,
    "visual": 0-10,
    "codeQuality": 0-10
  },
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"]
}

只输出 JSON。`;

const evalResult = await callLlm([
  { role: 'system', content: '你是绘图评审专家，只输出 JSON。' },
  { role: 'user', content: evalPrompt },
]);

const evaluation = extractJson(evalResult.content) || {
  score: 50,
  issues: ['评审解析失败'],
  raw: evalResult.content.slice(0, 500),
};

console.log(`Score: ${evaluation.score}/100`);
if (evaluation.issues?.length) {
  console.log('Issues:');
  for (const i of evaluation.issues) console.log(`  - ${i}`);
}

// --- 5. Report ---
const report = {
  iteration,
  prompt: userPrompt,
  totalSteps,
  stepsDescription,
  totalShapes: allShapes.length,
  spatialScore: evaluation.score,
  grades: evaluation.grades,
  spatialIssues: evaluation.issues || [],
  suggestions: evaluation.suggestions || [],
  delta: prevIterationData ? evaluation.score - (prevIterationData.spatialScore ?? 0) : null,
  timestamp: new Date().toISOString(),
};

writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
writeFileSync(join(outDir, 'eval-result.json'), JSON.stringify(evaluation, null, 2));
writeFileSync(join(outDir, 'all-shapes.json'), JSON.stringify(allShapes, null, 2));

console.log('\n=== Summary ===');
console.log(`Score: ${evaluation.score}/100`);
if (report.delta != null) {
  console.log(`Delta: ${report.delta >= 0 ? '+' : ''}${report.delta} vs iter ${iteration - 1}`);
}
console.log(`Steps: ${totalSteps}, Shapes: ${allShapes.length}`);
console.log(`Output: ${outDir}/`);

process.exit(evaluation.score >= 70 ? 0 : 1);
