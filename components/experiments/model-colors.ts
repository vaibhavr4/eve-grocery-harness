import { MODEL_KEYS, type ModelKey } from "@/benchmarks/lib/models";

/** Object.fromEntries widens to a string index signature — build a properly typed Record instead. */
export function toModelRecord<T>(fn: (key: ModelKey) => T): Record<ModelKey, T> {
  return Object.fromEntries(MODEL_KEYS.map((key) => [key, fn(key)])) as Record<ModelKey, T>;
}

export const MODEL_COLOR_VAR: Record<ModelKey, string> = {
  jev: "var(--series-jev)",
  sonnet: "var(--series-sonnet)",
  opus: "var(--series-opus)",
};

export const MODEL_SHORT_LABEL: Record<ModelKey, string> = {
  jev: "jev",
  sonnet: "Sonnet",
  opus: "Opus",
};
