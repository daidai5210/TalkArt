/**
 * Iterative sketch DSL drawing test — calls LLM API directly and saves SVG output.
 *
 * Usage:
 *   npx tsx scripts/iterative-sketch-draw.mjs
 *   npx tsx scripts/iterative-sketch-draw.mjs --iteration 1
 *   npx tsx scripts/iterative-sketch-draw.mjs --prompt "一只可爱的小猫"
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSketchStepsToSvg } from './lib/sketch-svg.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const {
  buildThreePlanningPrompt,
  buildThreeRenderPrompt,
  buildDrawingSystemPrompt,
} = await import('../src/modules/ai-agent/three-system-prompt.ts');
const {
  PLAN_DRAWING_STEPS_DEFINITION,
  RENDER_SKETCH_STEP_DEFINITION,
} = await import('../src/modules/ai-agent/three-tool-definitions.ts');
const {
  parseDrawingPlan,
  parseRenderSketchStep,
  extractSketchBounds,
  summarizeSketchMarks,
  alignSketchMarksToLayout,
} = await import('../src/modules/three-renderer/index.ts');
const { resolveStepLayoutTarget } = await import('../src/modules/leafer-renderer/step-layout-aligner.ts');
const { resolveLlmEnvConfig } = await import('../src/modules/ai-agent/llm-env-config.ts');

const args = process.argv.slice(2);
const iteration = Number(args[args.indexOf('--iteration') + 1] || '1');
const promptIdx = args.indexOf('--prompt');
const userPrompt = promptIdx >= 0 ? args[promptIdx + 1] : '一只可爱的小猫，简单几笔的简笔画';

const CANVAS = { width: 800, height: 600 };
const outDir = join(root, 'scripts', 'iterations-sketch', `iter-${String(iteration).padStart(2, '0')}`);
mkdirSync(outDir, { recursive: true });

function getLlmConfig() {
  return resolveLlmEnvConfig(process.env);
}

async function callLlm(messages, tools, retries = 2) {
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
          tools,
          tool_choice: 'auto',
          max_tokens: 4096,
          temperature: 0.35,
        }),
        signal: AbortSignal.timeout(180_000),
      });

      const data = await res.json();
      if (!res.ok) {
        lastErr = new Error(`LLM ${res.status}: ${JSON.stringify(data.error ?? data)}`);
        continue;
      }

      const msg = data.choices?.[0]?.message;
      const tc = msg?.tool_calls?.[0] ?? (msg?.function_call ? { function: msg.function_call } : null);
      if (!tc) {
        lastErr = new Error(`No tool call: ${String(msg?.content ?? 'empty').slice(0, 200)}`);
        continue;
      }

      let argsParsed;
      try {
        argsParsed = JSON.parse(tc.function.arguments);
      } catch {
        lastErr = new Error(`Bad tool args: ${tc.function.arguments?.slice?.(0, 300)}`);
        continue;
      }

      return { name: tc.function.name, arguments: argsParsed };
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      console.warn(`  LLM attempt ${attempt + 1} failed: ${lastErr.message}`);
    }
  }
  throw lastErr;
}

function buildCanvasContext(completedStepLayouts, planSteps) {
  return {
    width: CANVAS.width,
    height: CANVAS.height,
    element_count: completedStepLayouts.length,
    completed_steps: completedStepLayouts.map((s) => ({
      stepIndex: s.stepIndex,
      label: s.label,
      bounds: s.bounds,
      summary: s.summary,
    })),
    plan_steps: planSteps,
  };
}

console.log(`\n=== Sketch DSL Iteration ${iteration} ===`);
console.log(`Prompt: ${userPrompt}`);
console.log(`Output: ${outDir}/\n`);

const sysPrompt = buildDrawingSystemPrompt({
  width: CANVAS.width,
  height: CANVAS.height,
  elementCount: 0,
  elementsSummary: '空白纸张',
});
const planPrompt = buildThreePlanningPrompt({
  width: CANVAS.width,
  height: CANVAS.height,
  stepCount: 0,
});

console.log('--- Phase 1: Planning ---');
const planT0 = Date.now();
const planResult = await callLlm(
  [
    { role: 'system', content: sysPrompt },
    { role: 'system', content: planPrompt },
    { role: 'user', content: userPrompt },
  ],
  [PLAN_DRAWING_STEPS_DEFINITION],
);
console.log(`Plan tool: ${planResult.name} (${Date.now() - planT0}ms)`);

const planData = parseDrawingPlan(planResult.arguments);
if (!planData) {
  console.error('Invalid plan:', JSON.stringify(planResult.arguments).slice(0, 500));
  process.exit(1);
}
writeFileSync(join(outDir, 'plan.json'), JSON.stringify(planData, null, 2));
console.log(`Steps: ${planData.steps.length}`);
for (const s of planData.steps) console.log(`  [${s.index}] ${s.label} layout=${JSON.stringify(s.layout ?? null)}`);

const completedStepLayouts = [];
const renderedSteps = [];
let totalMarks = 0;

for (const step of planData.steps) {
  const canvasCtx = buildCanvasContext(completedStepLayouts, planData.steps);
  const layoutTarget = resolveStepLayoutTarget(step.layout, completedStepLayouts);
  const renderPrompt = buildThreeRenderPrompt({
    width: CANVAS.width,
    height: CANVAS.height,
    userIntent: userPrompt,
    stepIndex: step.index,
    totalSteps: planData.totalSteps,
    stepLabel: step.label,
    stepDescription: step.description,
    stepLayout: step.layout,
    resolvedLayoutTarget: layoutTarget,
    completedSteps: canvasCtx.completed_steps ?? [],
    planSteps: canvasCtx.plan_steps ?? [],
  });

  console.log(`\n--- Phase 2: Render step ${step.index + 1}: ${step.label} ---`);
  const stepT0 = Date.now();
  const renderResult = await callLlm(
    [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: userPrompt },
      { role: 'user', content: renderPrompt },
    ],
    [RENDER_SKETCH_STEP_DEFINITION],
  );
  console.log(`Render tool: ${renderResult.name} (${Date.now() - stepT0}ms)`);

  const parsed = parseRenderSketchStep(renderResult.arguments);
  if (!parsed) {
    console.error(`Invalid marks for step ${step.index}:`, JSON.stringify(renderResult.arguments).slice(0, 500));
    process.exit(1);
  }

  const marks = layoutTarget ? alignSketchMarksToLayout(parsed.marks, layoutTarget) : parsed.marks;
  const bounds = extractSketchBounds(marks);
  totalMarks += marks.length;
  console.log(`  marks=${marks.length} bounds=${bounds ? JSON.stringify(bounds) : 'none'}`);

  completedStepLayouts.push({
    stepIndex: step.index,
    label: step.label,
    bounds: bounds ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    summary: summarizeSketchMarks(marks),
  });
  renderedSteps.push({ stepIndex: step.index, label: step.label, marks, bounds });
}

const svg = renderSketchStepsToSvg(renderedSteps, CANVAS.width, CANVAS.height);
writeFileSync(join(outDir, 'output.svg'), svg);
writeFileSync(join(outDir, 'all-marks.json'), JSON.stringify(renderedSteps, null, 2));

const report = {
  iteration,
  prompt: userPrompt,
  planSteps: planData.steps.length,
  totalMarks,
  stepLayouts: completedStepLayouts,
  outputSvg: join(outDir, 'output.svg'),
  timestamp: new Date().toISOString(),
};
writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));

console.log('\n=== Summary ===');
console.log(`Steps: ${planData.steps.length}, marks: ${totalMarks}`);
console.log(`Output: ${outDir}/output.svg`);

if (!existsSync(join(outDir, 'output.svg'))) process.exit(1);
