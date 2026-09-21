import "dotenv/config";
import { SINGLE_TOOL_CASES } from "../datasets/single-tool.js";
import { mapWithConcurrency } from "../lib/concurrency.js";
import { MODEL_KEYS } from "../lib/models.js";
import { runToolPick } from "../lib/run-model.js";
import { aggregate, scoreSingleTool } from "../lib/score.js";
import type { CaseResult, SuiteResult } from "../lib/types.js";
import { writeResults } from "../lib/write-results.js";

const CONCURRENCY = 4;

export async function runSingleToolSuite(): Promise<SuiteResult<(typeof SINGLE_TOOL_CASES)[number]>> {
  const cases: CaseResult<(typeof SINGLE_TOOL_CASES)[number]>[] = await mapWithConcurrency(
    SINGLE_TOOL_CASES,
    CONCURRENCY,
    async (testCase) => {
      const runs = await Promise.all(
        MODEL_KEYS.map(async (modelKey) => {
          const run = await runToolPick(modelKey, testCase.question);
          return scoreSingleTool(testCase, run);
        }),
      );
      return { case: testCase, runs };
    },
  );

  return { suite: "single-tool", generatedAt: new Date().toISOString(), cases };
}

async function main() {
  const suite = await runSingleToolSuite();
  const path = writeResults("single-tool.json", suite);
  console.log(`Wrote ${path}`);
  for (const modelKey of MODEL_KEYS) {
    const runs = suite.cases.flatMap((c) => c.runs.filter((r) => r.modelKey === modelKey));
    const stats = aggregate(modelKey, runs);
    console.log(
      `${modelKey.padEnd(8)} accuracy=${(stats.accuracy * 100).toFixed(0)}% meanLatency=${stats.meanLatencyMs}ms p90=${stats.p90LatencyMs}ms errors=${(stats.errorRate * 100).toFixed(0)}%`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
