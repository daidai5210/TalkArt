/**
 * Run N iterative drawing optimization cycles.
 * Each cycle: test → compare score → stop early if target reached.
 *
 * Usage:
 *   npx tsx scripts/run-iter-loop.mjs
 *   npx tsx scripts/run-iter-loop.mjs --max 10 --target 75
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const args = process.argv.slice(2);
const maxIter = Number(args[args.indexOf('--max') + 1] || '10');
const target = Number(args[args.indexOf('--target') + 1] || '75');

const logDir = join(root, 'scripts', 'iterations');
mkdirSync(logDir, { recursive: true });

const summary = [];

console.log(`\n🔄 Iterative optimization loop (max=${maxIter}, target=${target})\n`);

for (let i = 1; i <= maxIter; i++) {
  console.log(`\n${'='.repeat(60)}\n  CYCLE ${i}/${maxIter}\n${'='.repeat(60)}`);
  const r = spawnSync('npx', ['tsx', 'scripts/iterative-leafer-draw.mjs', '--iteration', String(i)], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });

  const reportPath = join(logDir, `iter-${String(i).padStart(2, '0')}`, 'report.json');
  if (existsSync(reportPath)) {
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    summary.push({
      iteration: i,
      score: report.spatialScore,
      issues: report.spatialIssues?.length ?? 0,
      exitCode: r.status,
    });
    console.log(`\n  → Cycle ${i} score: ${report.spatialScore}/100`);

    if (report.spatialScore >= target) {
      console.log(`\n✅ Target score ${target} reached at iteration ${i}`);
      break;
    }
  } else {
    summary.push({ iteration: i, score: null, issues: null, exitCode: r.status });
    console.log(`\n  → Cycle ${i} failed (no report)`);
  }
}

writeFileSync(join(logDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log('\n📊 Summary:', JSON.stringify(summary, null, 2));
console.log(`\nFull summary: scripts/iterations/summary.json`);
