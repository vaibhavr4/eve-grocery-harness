import "dotenv/config";
import { renderSubstitutionPrompt, SUBSTITUTION_CASES, type SubstitutionCase } from "../datasets/substitution.js";
import { mapWithConcurrency } from "../lib/concurrency.js";
import { MODEL_KEYS } from "../lib/models.js";
import { runSubstitutionPick } from "../lib/run-model.js";
import { aggregate, scoreSubstitution, type ScoredSubstitutionRun } from "../lib/score.js";
import type { CaseResult, SuiteResult } from "../lib/types.js";
import { writeResults } from "../lib/write-results.js";

const CONCURRENCY = 4;

export async function runSubstitutionSuite(): Promise<SuiteResult<SubstitutionCase, ScoredSubstitutionRun>> {
  const cases: CaseResult<SubstitutionCase, ScoredSubstitutionRun>[] = await mapWithConcurrency(
    SUBSTITUTION_CASES,
    CONCURRENCY,
    async (testCase) => {
      const prompt = renderSubstitutionPrompt(testCase);
      const runs = await Promise.all(
        MODEL_KEYS.map(async (modelKey) => {
          const run = await runSubstitutionPick(modelKey, prompt);
          return scoreSubstitution(testCase, run, { chosenItemId: run.chosenItemId, rationale: run.rationale });
        }),
      );
      return { case: testCase, runs };
    },
  );

  return { suite: "substitution", generatedAt: new Date().toISOString(), cases };
}

async function main() {
  const suite = await runSubstitutionSuite();
  const path = writeResults("substitution.json", suite);
  console.log(`Wrote ${path}`);
  for (const modelKey of MODEL_KEYS) {
    const runs = suite.cases.flatMap((c) => c.runs.filter((r) => r.modelKey === modelKey));
    const stats = aggregate(modelKey, runs);
    console.log(
      `${modelKey.padEnd(8)} top1=${(stats.accuracy * 100).toFixed(0)}% meanScore=${stats.meanScore.toFixed(2)} meanLatency=${stats.meanLatencyMs}ms errors=${(stats.errorRate * 100).toFixed(0)}%`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
