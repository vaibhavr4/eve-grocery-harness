import type { DisambiguationCase, SequenceCase } from "../datasets/multi-tool.js";
import type { SingleToolCase } from "../datasets/single-tool.js";
import type { SubstitutionCase } from "../datasets/substitution.js";
import type { ToolCatalogName } from "./tool-catalog.js";
import type { ModelRunResult, ScoredRun } from "./types.js";

export function scoreSingleTool(testCase: SingleToolCase, run: ModelRunResult): ScoredRun {
  if (run.error) return { ...run, correct: false, score: 0, gradeNote: run.error };
  const called = run.toolCalls.map((c) => c.toolName);
  const correct = called.length === 1 && called[0] === testCase.expectedTool;
  return {
    ...run,
    correct,
    score: correct ? 1 : 0,
    gradeNote: correct ? undefined : `called [${called.join(", ") || "none"}], expected ${testCase.expectedTool}`,
  };
}

export function scoreSequence(testCase: SequenceCase, run: ModelRunResult): ScoredRun {
  if (run.error) return { ...run, correct: false, score: 0, gradeNote: run.error };
  const called = run.toolCalls.map((c) => c.toolName);
  const expected = testCase.expectedSequence;
  const exact = called.length === expected.length && called.every((name, i) => name === expected[i]);
  const asSet = new Set(called);
  const expectedSet = new Set(expected);
  const overlap = [...expectedSet].filter((name) => asSet.has(name)).length;
  const setScore = overlap / expectedSet.size;
  return {
    ...run,
    correct: exact,
    score: exact ? 1 : setScore * 0.5, // partial credit for right tools, wrong order/extras
    gradeNote: exact
      ? undefined
      : `called [${called.join(", ") || "none"}], expected order [${expected.join(", ")}]`,
  };
}

export function scoreDisambiguation(testCase: DisambiguationCase, run: ModelRunResult): ScoredRun {
  if (run.error) return { ...run, correct: false, score: 0, gradeNote: run.error };
  const called = run.toolCalls.map((c) => c.toolName);
  const correct = called.length === 1 && called[0] === testCase.idealTool;
  const hitDistractor = called.some((name) => testCase.distractorTools.includes(name as ToolCatalogName));
  return {
    ...run,
    correct,
    score: correct ? 1 : 0,
    gradeNote: correct
      ? undefined
      : `called [${called.join(", ") || "none"}], ideal ${testCase.idealTool}${hitDistractor ? " (hit a distractor)" : ""}`,
  };
}

export interface SubstitutionAnswer {
  readonly chosenItemId?: string;
  readonly rationale?: string;
}

export type ScoredSubstitutionRun = ScoredRun & SubstitutionAnswer;

export function scoreSubstitution(
  testCase: SubstitutionCase,
  run: ModelRunResult,
  answer: SubstitutionAnswer,
): ScoredSubstitutionRun {
  if (run.error) return { ...run, ...answer, correct: false, score: 0, gradeNote: run.error };
  const rank = testCase.ranking.findIndex((r) => r.candidate.id === answer.chosenItemId);
  if (rank === -1) {
    return {
      ...run,
      ...answer,
      correct: false,
      score: 0,
      gradeNote: `chose unknown/missing item id "${answer.chosenItemId}"`,
    };
  }
  const correct = rank === 0;
  const best = testCase.ranking[0].score;
  const chosen = testCase.ranking[rank].score;
  const gap = best === 0 ? 0 : Math.max(0, 1 - Math.abs(best - chosen) / Math.abs(best));
  return {
    ...run,
    ...answer,
    correct,
    score: correct ? 1 : Number((gap * 0.6).toFixed(3)), // partial credit scaled down vs a true top-1 hit
    gradeNote: correct
      ? undefined
      : `chose ${answer.chosenItemId} (rank #${rank + 1} of ${testCase.ranking.length}), ideal ${testCase.idealItemId}`,
  };
}

export interface AggregateStats {
  readonly modelKey: string;
  readonly n: number;
  readonly accuracy: number;
  readonly meanScore: number;
  readonly meanLatencyMs: number;
  readonly p50LatencyMs: number;
  readonly p90LatencyMs: number;
  readonly errorRate: number;
}

export function aggregate(modelKey: string, runs: readonly ScoredRun[]): AggregateStats {
  const n = runs.length;
  const latencies = runs.map((r) => r.latencyMs).sort((a, b) => a - b);
  const percentile = (p: number) =>
    latencies.length === 0 ? 0 : latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))];
  return {
    modelKey,
    n,
    accuracy: n === 0 ? 0 : runs.filter((r) => r.correct).length / n,
    meanScore: n === 0 ? 0 : runs.reduce((sum, r) => sum + r.score, 0) / n,
    meanLatencyMs: n === 0 ? 0 : Math.round(latencies.reduce((sum, v) => sum + v, 0) / n),
    p50LatencyMs: Math.round(percentile(50)),
    p90LatencyMs: Math.round(percentile(90)),
    errorRate: n === 0 ? 0 : runs.filter((r) => r.error).length / n,
  };
}
