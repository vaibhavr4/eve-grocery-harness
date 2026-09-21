import type { ModelKey } from "./models.js";

export interface ToolCallRecord {
  readonly toolName: string;
  readonly input: unknown;
}

/** Raw outcome of running one dataset case against one model. */
export interface ModelRunResult {
  readonly modelKey: ModelKey;
  readonly latencyMs: number;
  readonly toolCalls: readonly ToolCallRecord[];
  readonly reasoningText?: string;
  readonly outputText?: string;
  readonly usage?: {
    readonly inputTokens?: number;
    readonly outputTokens?: number;
    readonly reasoningTokens?: number;
  };
  readonly error?: string;
}

export interface ScoredRun extends ModelRunResult {
  readonly correct: boolean;
  /** 0-1 for partial-credit cases (e.g. a sequence that got some steps right). */
  readonly score: number;
  readonly gradeNote?: string;
}

export interface CaseResult<TCase, TRun extends ScoredRun = ScoredRun> {
  readonly case: TCase;
  readonly runs: readonly TRun[];
}

export interface SuiteResult<TCase, TRun extends ScoredRun = ScoredRun> {
  readonly suite: string;
  readonly generatedAt: string;
  readonly cases: readonly CaseResult<TCase, TRun>[];
}
