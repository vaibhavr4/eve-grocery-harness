import "dotenv/config";
import { MULTI_TOOL_CASES, type MultiToolCase } from "../datasets/multi-tool.js";
import { mapWithConcurrency } from "../lib/concurrency.js";
import { MODEL_KEYS } from "../lib/models.js";
import { runToolPick } from "../lib/run-model.js";
import { aggregate, scoreDisambiguation, scoreSequence } from "../lib/score.js";
import type { CaseResult, SuiteResult } from "../lib/types.js";
import { writeResults } from "../lib/write-results.js";

const CONCURRENCY = 4;

export async function runMultiToolSuite(): Promise<SuiteResult<MultiToolCase>> {
  const cases: CaseResult<MultiToolCase>[] = await mapWithConcurrency(
    MULTI_TOOL_CASES,
    CONCURRENCY,
    async (testCase) => {
      const runs = await Promise.all(
        MODEL_KEYS.map(async (modelKey) => {
          const run = await runToolPick(modelKey, testCase.question, { multiStep: testCase.kind === "sequence" });
          return testCase.kind === "sequence" ? scoreSequence(testCase, run) : scoreDisambiguation(testCase, run);
        }),
      );
      return { case: testCase, runs };
    },
  );

  return { suite: "multi-tool", generatedAt: new Date().toISOString(), cases };
}

async function main() {
  const suite = await runMultiToolSuite();
  const path = writeResults("multi-tool.json", suite);
  console.log(`Wrote ${path}`);
  for (const modelKey of MODEL_KEYS) {
    const runs = suite.cases.flatMap((c) => c.runs.filter((r) => r.modelKey === modelKey));
    const stats = aggregate(modelKey, runs);
    console.log(
      `${modelKey.padEnd(8)} accuracy=${(stats.accuracy * 100).toFixed(0)}% meanScore=${stats.meanScore.toFixed(2)} meanLatency=${stats.meanLatencyMs}ms errors=${(stats.errorRate * 100).toFixed(0)}%`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
