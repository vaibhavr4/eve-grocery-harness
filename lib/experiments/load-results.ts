import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ScoredRun, SuiteResult } from "@/benchmarks/lib/types";

const RESULTS_DIR = join(process.cwd(), "benchmarks", "results");

export function loadSuite<TCase, TRun extends ScoredRun = ScoredRun>(
  fileName: string,
): SuiteResult<TCase, TRun> | null {
  const path = join(RESULTS_DIR, fileName);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as SuiteResult<TCase, TRun>;
  } catch {
    return null;
  }
}
