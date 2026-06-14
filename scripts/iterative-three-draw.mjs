/**
 * Iterative Three.js drawing test — calls LLM API directly, evaluates spatial quality.
 *
 * Usage:
 *   npx tsx scripts/iterative-three-draw.mjs
 *   npx tsx scripts/iterative-three-draw.mjs --iteration 1
 *   npx tsx scripts/iterative-three-draw.mjs --prompt "绘制云南大学校门"
 *   npx tsx scripts/iterative-three-draw.mjs --eval    # only run evaluation, skip drawing
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderStepsToSvg, computeStepBounds } from './lib/three-primitive-svg.mjs';
import { buildSpatialEvalPrompt, callLlmForEval } from './lib/llm-spatial-eval.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

// Import project modules
const {
  buildThreePlanningPrompt,
  buildThreeRenderPrompt,
  buildDrawingSystemPrompt,
} = await import('../src/modules/ai-agent/three-system-prompt.ts');
const {
  PLAN_DRAWING_STEPS_DEFINITION,
  RENDER_THREE_STEP_DEFINITION,
} = await import('../src/modules/ai-agent/three-tool-definitions.ts');
const { parseRenderThreeStep } = await import(
  '../src/modules/three-renderer/primitive-validator.ts'
);
const { parseComposedDrawingPlan } = await import(
  '../src/modules/three-renderer/scene-composition.ts'
);
const { assembleComponentOnCanvas } = await import(
  '../src/modules/three-renderer/component-assembler.ts'
);
const { resolveStepLayoutTarget } = await import(
  '../src/modules/leafer-renderer/step-layout-aligner.ts'
);
const { resolveCompositionLayoutTarget } = await import(
  '../src/modules/three-renderer/scene-composition.ts'
);
const { summarizePrimitives } = await import(
  '../src/modules/three-renderer/primitive-bounds.ts'
);
const { resolveLlmEnvConfig } = await import('../src/modules/ai-agent/llm-env-config.ts');

const args = process.argv.slice(2);
const evalOnly = args.includes('--eval');
const iteration = Number(args[args.indexOf('--iteration') + 1] || '1');
const promptIdx = args.indexOf('--prompt');
const userPrompt =
  promptIdx >= 0
    ? args[promptIdx + 1]
    : '绘制云南大学校门与道路的简约剪影平面设计图，简笔画风格，大轮廓即可';

const CANVAS = { width: 800, height: 600 };
const outDir = join(root, 'scripts', 'iterations-three', `iter-${String(iteration).padStart(2, '0')}`);
mkdirSync(outDir, { recursive: true });

function getLlmConfig() {
  return resolveLlmEnvConfig(process.env);
}

async function callLlm(messages, tools, retries = 3) {
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
          tools: tools || undefined,
          tool_choice: tools ? 'auto' : undefined,
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(180_000),
      });

    const data = await res.json();
    if (!res.ok) {
      lastErr = new Error(`LLM ${res.status}: ${JSON.stringify(data.error ?? data)}`);
      continue;
    }

    const msg = data.choices?.[0]?.message;

    // If no tools, just return content
    if (!tools) {
      return { content: msg?.content || '' };
    }

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

console.log(`\n=== Three.js Iteration ${iteration} ===`);
console.log(`Prompt: ${userPrompt}`);
console.log(`Output: ${outDir}/\n`);

// Load previous iteration data if available
let prevIterationData = null;
if (iteration > 1) {
  const prevPath = join(root, 'scripts', 'iterations-three', `iter-${String(iteration - 1).padStart(2, '0')}`, 'report.json');
  if (existsSync(prevPath)) {
    prevIterationData = JSON.parse(readFileSync(prevPath, 'utf8'));
  }
}

let planData;
let assembledSteps;

if (!evalOnly) {
  // --- 1. Plan ---
  const planPrompt = buildThreePlanningPrompt({
    width: CANVAS.width,
    height: CANVAS.height,
    stepCount: 0,
  });

  const sysPrompt = buildDrawingSystemPrompt({
    width: CANVAS.width,
    height: CANVAS.height,
    elementCount: 0,
    elementsSummary: '空画布',
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

  planData = parseComposedDrawingPlan(planResult.arguments, CANVAS.width, CANVAS.height);
  if (!planData) {
    console.error('Invalid plan:', JSON.stringify(planResult.arguments).slice(0, 500));
    process.exit(1);
  }
  writeFileSync(join(outDir, 'plan.json'), JSON.stringify(planData, null, 2));
  console.log(`Steps: ${planData.steps.length}`);
  for (const s of planData.steps) {
    console.log(`  [${s.index}] ${s.label} layer=${s.layer} layout=${JSON.stringify(s.layout ?? null)}`);
  }

  // --- 2. Render each step ---
  const completedStepLayouts = [];
  assembledSteps = [];

  for (const step of planData.steps) {
    const canvasCtx = buildCanvasContext(completedStepLayouts, planData.steps);
    const resolvedLayoutTarget = resolveCompositionLayoutTarget(
      step,
      planData.scene,
      completedStepLayouts,
      CANVAS.width,
      CANVAS.height,
    );
    const renderPrompt = buildThreeRenderPrompt({
      width: CANVAS.width,
      height: CANVAS.height,
      userIntent: userPrompt,
      stepIndex: step.index,
      totalSteps: planData.totalSteps,
      stepLabel: step.label,
      stepDescription: step.description,
      stepLayer: step.layer,
      stepGrounded: step.grounded,
      stepLayout: step.layout,
      sceneMeta: planData.scene,
      resolvedLayoutTarget,
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
      [RENDER_THREE_STEP_DEFINITION],
    );
    console.log(`Render tool: ${renderResult.name} (${Date.now() - stepT0}ms)`);

    const parsed = parseRenderThreeStep(renderResult.arguments);
    if (!parsed) {
      console.error(`Invalid primitives for step ${step.index}:`, JSON.stringify(renderResult.arguments).slice(0, 300));
      continue;
    }

    // Assemble: local → layout align → layer z
    const assembled = assembleComponentOnCanvas(parsed.primitives, {
      layoutTarget: resolvedLayoutTarget,
      layer: step.layer,
      coordinateMode: renderResult.arguments.coordinateMode || 'auto',
    });

    const bounds = computeStepBounds(assembled);
    if (!bounds) {
      console.warn('  Warning: no bounds extracted');
    } else {
      const cx = Math.round((bounds.minX + bounds.maxX) / 2);
      const cy = Math.round((bounds.minY + bounds.maxY) / 2);
      console.log(`  assembled bounds center=(${cx},${cy}) primitives=${assembled.length}`);
    }

    completedStepLayouts.push({
      stepIndex: step.index,
      label: step.label,
      bounds: bounds ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      summary: summarizePrimitives(assembled),
      layer: step.layer,
    });
    assembledSteps.push({
      stepIndex: step.index,
      label: step.label,
      layer: step.layer,
      primitives: assembled,
      bounds: bounds ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    });
  }

  // --- 3. Generate SVG ---
  const svg = renderStepsToSvg(assembledSteps, CANVAS.width, CANVAS.height);
  writeFileSync(join(outDir, 'output.svg'), svg);
  console.log(`\nSVG saved to ${outDir}/output.svg`);
} else {
  // evalOnly mode: load from previous iteration
  if (!prevIterationData) {
    console.error('No previous iteration data found for eval-only mode');
    process.exit(1);
  }
  const prevPlan = JSON.parse(readFileSync(join(outDir, 'plan.json'), 'utf8'));
  planData = prevPlan;
  // We need assembled primitives — load from assembled.json if available
  const assembledPath = join(outDir, 'assembled.json');
  if (!existsSync(assembledPath)) {
    console.error('No assembled.json found for eval-only mode');
    process.exit(1);
  }
  assembledSteps = JSON.parse(readFileSync(assembledPath, 'utf8'));
}

// Save assembled data for later eval-only runs
writeFileSync(join(outDir, 'assembled.json'), JSON.stringify(assembledSteps, null, 2));

// --- 4. Evaluate with LLM ---
console.log('\n--- LLM Spatial Evaluation ---');
const evalPrompt = buildSpatialEvalPrompt(
  userPrompt,
  planData.steps,
  assembledSteps.map((s) => ({
    stepIndex: s.stepIndex,
    label: s.label,
    layer: s.layer,
    bounds: s.bounds,
  })),
  CANVAS,
);

const evalResult = await callLlmForEval(callLlm, evalPrompt);
console.log(`Score: ${evalResult.score}/100`);
if (evalResult.issues?.length) {
  console.log('Issues:');
  for (const i of evalResult.issues) console.log(`  - ${i}`);
}
if (evalResult.suggestions?.length) {
  console.log('Suggestions:');
  for (const s of evalResult.suggestions) console.log(`  - ${s}`);
}

// --- 5. Report ---
const report = {
  iteration,
  prompt: userPrompt,
  planSteps: planData.steps.length,
  sceneMeta: planData.scene,
  spatialScore: evalResult.score,
  grades: evalResult.grades,
  spatialIssues: evalResult.issues ?? [],
  suggestions: evalResult.suggestions ?? [],
  stepLayouts: assembledSteps.map((s) => ({
    stepIndex: s.stepIndex,
    label: s.label,
    layer: s.layer,
    bounds: s.bounds,
    primitiveCount: s.primitives.length,
    summary: summarizePrimitives(s.primitives),
  })),
  delta: prevIterationData ? evalResult.score - (prevIterationData.spatialScore ?? 0) : null,
  timestamp: new Date().toISOString(),
};

writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
writeFileSync(join(outDir, 'eval-prompt.txt'), evalPrompt);
writeFileSync(join(outDir, 'eval-result.json'), JSON.stringify(evalResult, null, 2));

console.log('\n=== Summary ===');
console.log(`Score: ${evalResult.score}/100`);
if (report.delta != null) {
  console.log(`Delta: ${report.delta >= 0 ? '+' : ''}${report.delta} vs iter ${iteration - 1}`);
}
console.log(`Issues: ${evalResult.issues?.length ?? 0}`);
console.log(`Output: ${outDir}/`);
console.log(`  plan.json, assembled.json, output.svg, report.json`);

process.exit(evalResult.score >= 70 ? 0 : 1);
