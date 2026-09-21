import { anthropic } from "eve/models/anthropic";
import type { LanguageModel } from "ai";

/**
 * The three targets under comparison.
 *
 * - jev: eve's built-in evaluation model (`typesafe-ai/jev`), the default
 *   classifier behind `approval: auto()`. It is a Vercel AI Gateway model
 *   string, resolved automatically by the `ai` package when
 *   AI_GATEWAY_API_KEY is set — there is no direct-provider path for it.
 *   It is built for fast clear/caution classification, not general tool use,
 *   so a low tool-picking accuracy or outright failure here is itself a
 *   valid, expected benchmark finding, not a bug in the harness.
 * - sonnet / opus: direct Anthropic access via eve/models/anthropic, reading
 *   ANTHROPIC_API_KEY.
 */
export const MODEL_KEYS = ["jev", "sonnet", "opus"] as const;
export type ModelKey = (typeof MODEL_KEYS)[number];

export function resolveModel(key: ModelKey): LanguageModel {
  switch (key) {
    case "jev":
      return "typesafe-ai/jev";
    case "sonnet":
      return anthropic("claude-sonnet-5");
    case "opus":
      return anthropic("claude-opus-5");
  }
}

/** Extended-thinking provider options. jev has no reasoning mode. */
export function reasoningProviderOptions(key: ModelKey, budgetTokens = 4096) {
  if (key === "jev") return undefined;
  return {
    anthropic: {
      thinking: { type: "enabled" as const, budgetTokens },
    },
  };
}

export const MODEL_LABELS: Record<ModelKey, string> = {
  jev: "jev (typesafe-ai/jev)",
  sonnet: "Claude Sonnet 5",
  opus: "Claude Opus 5",
};
