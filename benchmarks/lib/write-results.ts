import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RESULTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "results");

export function writeResults(fileName: string, data: unknown): string {
  mkdirSync(RESULTS_DIR, { recursive: true });
  const path = join(RESULTS_DIR, fileName);
  writeFileSync(path, JSON.stringify(data, null, 2));
  return path;
}
