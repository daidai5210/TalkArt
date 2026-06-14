/**
 * Iterative Leafer drawing test — calls LLM API directly, scores spatial alignment.
 *
 * Usage:
 *   npx tsx scripts/iterative-leafer-draw.mjs
 *   npx tsx scripts/iterative-leafer-draw.mjs --no-align     # baseline (skip layout aligner)
 *   npx tsx scripts/iterative-leafer-draw.mjs --prompt "画一只白狗带黑斑"
 *   npx tsx scripts/iterative-leafer-draw.mjs --iteration 1
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreSpatialAlignment, leaferJsonToSvg } from './lib/spatial-score.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const {
  buildLeaferPlanningPrompt,
  buildLeaferRenderPrompt,
  buildDrawingSystemPrompt,
} = await import('../src/modules/ai-agent/leafer-system-prompt.ts');
const { PLAN_DRAWING_STEPS_DEFINITION, RENDER_LEAFER_STEP_DEFINITION } = await import(
  '../src/modules/ai-agent/leafer-tool-definitions.ts',
);
const { parseDrawingPlan, parseRenderLeaferStep } = await import(
  '../src/modules/leafer-renderer/leafer-json-validator.ts',
);
const {
  extractLeaferJsonBounds,
  summarizeLeaferJson,
} = await import('../src/modules/leafer-renderer/scene-bounds.ts');
const {
  alignStepJsonToLayout,
  resolveStepLayoutTarget,
} = await import('../src/modules/leafer-renderer/step-layout-aligner.ts');

const args = process.argv.slice(2);
const noAlign = args.includes('--no-align');
const iteration = Number(args[args.indexOf('--iteration') + 1] || '1');
const promptIdx = args.indexOf('--prompt');
const userPrompt =
  promptIdx >= 0
    ? args[promptIdx + 1]
    : '请你给我画一个身上有黑色斑点，但是它是一个白色的狗';

const CANVAS = { width: 800, height: 600 };
const outDir = join(root, 'scripts', 'iterations', `iter-${String(iteration).padStart(2, '0')}`);
mkdirSync(outDir, { recursive: true });

function getLlmConfig() {
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
  if (provider === 'deepseek') {
    return {
      url: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.LLM_MODEL || 'deepseek-chat',
    };
  }
  return {
    url: 'https://api.openai.com/v1/chat/completions',
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
  };
}

async function callLlm(messages, tools, retries = 3) {
  const cfg = getLlmConfig();
  if (!cfg.apiKey) throw new Error('LLM API key missing in .env');

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(cfg.url, {
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
        }),
        signal: AbortSignal.timeout(120_000),
      });

    const data = await res.json();
    if (!res.ok) {
      lastErr = new Error(`LLM ${res.status}: ${JSON.stringify(data.error ?? data)}`);
      continue;
    }

    const msg = data.choices?.[0]?.message;
    const tc = msg?.tool_calls?.[0] ?? (msg?.function_call ? { function: msg.function_call } : null);
    if (!tc) {
      lastErr = new Error(`No tool call: ${String(msg?.content ?? 'empty').slice(0, 120)}`);
      continue;
    }

    let argsParsed;
    try {
      argsParsed = JSON.parse(tc.function.arguments);
    } catch {
      lastErr = new Error(`Bad tool args: ${tc.function.arguments?.slice?.(0, 200)}`);
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

console.log(`\n=== Iteration ${iteration} | align=${!noAlign} ===`);
console.log(`Prompt: ${userPrompt}\n`);

// --- 1. Plan ---
const planPrompt = buildLeaferPlanningPrompt({
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

console.log('--- Planning ---');
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
if (!planData) throw new Error('Invalid plan');
writeFileSync(join(outDir, 'plan.json'), JSON.stringify(planData, null, 2));
console.log(`Steps: ${planData.steps.length}`);
for (const s of planData.steps) {
  console.log(`  [${s.index}] ${s.label} layout=${JSON.stringify(s.layout ?? null)}`);
}

// --- 2. Render each step ---
const completedStepLayouts = [];
const renderedSteps = [];

for (const step of planData.steps) {
  const canvasCtx = buildCanvasContext(completedStepLayouts, planData.steps);
  const renderPrompt = buildLeaferRenderPrompt({
    width: CANVAS.width,
    height: CANVAS.height,
    userIntent: userPrompt,
    stepIndex: step.index,
    totalSteps: planData.totalSteps,
    stepLabel: step.label,
    stepDescription: step.description,
    stepLayout: step.layout,
    completedSteps: canvasCtx.completed_steps ?? [],
    planSteps: canvasCtx.plan_steps ?? [],
  });

  console.log(`\n--- Render step ${step.index + 1}: ${step.label} ---`);
  const stepT0 = Date.now();
  const renderResult = await callLlm(
    [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: userPrompt },
      { role: 'user', content: renderPrompt },
    ],
    [RENDER_LEAFER_STEP_DEFINITION],
  );
  console.log(`Render tool: ${renderResult.name} (${Date.now() - stepT0}ms)`);

  const parsed = parseRenderLeaferStep(renderResult.arguments);
  if (!parsed) throw new Error(`Invalid leafer JSON for step ${step.index}`);

  let leaferJson = parsed.leaferJson;
  let aligned = false;

  if (!noAlign) {
    const target = resolveStepLayoutTarget(step.layout, completedStepLayouts);
    if (target) {
      leaferJson = alignStepJsonToLayout(leaferJson, target);
      aligned = true;
    }
  }

  const bounds = extractLeaferJsonBounds(leaferJson);
  if (!bounds) {
    console.warn('  Warning: no bounds extracted');
  } else {
    const cx = Math.round((bounds.minX + bounds.maxX) / 2);
    const cy = Math.round((bounds.minY + bounds.maxY) / 2);
    console.log(`  bounds center=(${cx},${cy}) aligned=${aligned}`);
  }

  completedStepLayouts.push({
    stepIndex: step.index,
    label: step.label,
    bounds: bounds ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    summary: summarizeLeaferJson(leaferJson),
  });
  renderedSteps.push({ stepIndex: step.index, label: step.label, json: leaferJson, aligned });
}

// --- 3. Score ---
const spatial = scoreSpatialAlignment(completedStepLayouts, CANVAS);
const report = {
  iteration,
  alignEnabled: !noAlign,
  prompt: userPrompt,
  planSteps: planData.steps.length,
  spatialScore: spatial.score,
  spatialIssues: spatial.issues,
  spatialDetails: spatial.details,
  stepLayouts: completedStepLayouts,
  timestamp: new Date().toISOString(),
};

writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
writeFileSync(join(outDir, 'output.svg'), leaferJsonToSvg(renderedSteps, CANVAS.width, CANVAS.height));

// Compare with previous iteration if exists
const prevPath = join(root, 'scripts', 'iterations', `iter-${String(iteration - 1).padStart(2, '0')}`, 'report.json');
let delta = null;
if (iteration > 1 && existsSync(prevPath)) {
  const prev = JSON.parse(readFileSync(prevPath, 'utf8'));
  delta = spatial.score - prev.spatialScore;
}

console.log('\n=== Spatial Score ===');
console.log(`Score: ${spatial.score}/100${delta != null ? ` (${delta >= 0 ? '+' : ''}${delta} vs iter ${iteration - 1})` : ''}`);
console.log('Details:', spatial.details);
if (spatial.issues.length) {
  console.log('Issues:');
  for (const i of spatial.issues) console.log(`  - ${i}`);
} else {
  console.log('Issues: none');
}
console.log(`\nOutput: ${outDir}/`);
console.log(`  report.json, output.svg, plan.json`);

process.exit(spatial.score >= 70 ? 0 : 1);
