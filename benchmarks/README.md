# Model experiments: jev vs Sonnet vs Opus

Standalone benchmark suite comparing eve's built-in evaluation model (`jev`,
`typesafe-ai/jev`) against direct Claude Sonnet 5 and Claude Opus 5 (both with
extended thinking enabled) on three tasks. Results feed the **Experiments**
tab in the web UI (`/experiments`).

This runs outside the eve runtime entirely — plain AI SDK calls against a
tool catalog mirrored from `agent/tools/*.ts` — so it needs no `eve dev`
server running, just API keys.

## Setup

```
ANTHROPIC_API_KEY=...      # Sonnet + Opus, via eve/models/anthropic
AI_GATEWAY_API_KEY=...     # jev only — it's a Vercel AI Gateway model, no direct-provider path
```

Put both in `.env.local` at the project root.

## Run

```
npm run bench:single        # single-tool invocation (24 cases)
npm run bench:multi         # sequence + disambiguation (18 cases)
npm run bench:substitution  # item-substitution reasoning (15 cases)
npm run bench:all           # all three
```

Each writes `benchmarks/results/<suite>.json` (gitignored — regenerate
locally, don't commit). `npm run dev` reads them live; no rebuild needed.

## Suites

**Single tool** (`datasets/single-tool.ts`) — one question, one right answer,
covering every tool in the catalog twice with different phrasings. Forces a
tool call (`toolChoice: "required"`) so the metric is pure tool selection,
not willingness to act. Measures accuracy and latency, including how much
longer Sonnet/Opus take with extended thinking turned on versus jev's
plain classification pass.

**Multi-tool** (`datasets/multi-tool.ts`) — two kinds of case:
- *sequence*: the request genuinely needs an ordered chain of tool calls
  (`toolChoice: "auto"`, up to 4 steps); graded on exact order, with partial
  credit for the right tools in the wrong order.
- *disambiguation*: one ideal tool among named, plausible-looking distractors
  (e.g. `remove_from_cart` vs `cancel_order`) — tests precision under
  confusable options, not just recall.

**Substitution** (`datasets/substitution.ts`) — the "eggs OOS across 500
stores" scenario. A seeded, deterministic simulation generates 500 stores
across 3 formats × 3 banner tiers, 14 candidate replacement items, and
per-segment demand-transfer rates. A hand-specified rubric (never an LLM)
scores every candidate on organic/pasture match, price proximity, pack-size
fit, supply-risk penalty, and — deliberately weighted heavily — supply-scale
feasibility, so an attribute-perfect but low-volume local farm doesn't win a
500-store decision by default. 15 cases: 1 network-wide, 9 per-segment, and 5
adversarial edge cases (a top scorer with its own supply-risk flag, a
much-smaller pack size, demand-transfer data pointing away from the
segment-appropriate pick, a near-tie, and a supply-infeasible attribute
match). Models see item attributes and the demand-transfer numbers, never
the rubric weights or scores — `generateObject` extracts a structured
`{ chosenItemId, rationale }` so grading doesn't depend on parsing prose.

## Regenerating / extending

- Add cases directly to the dataset files — everything is plain TypeScript
  data, no build step.
- Change `SEED` in `datasets/substitution.ts` to resample the store/candidate
  simulation (re-derives every ranking and ideal answer automatically).
- Retune the rubric in `segmentWeights()` / `NETWORK_WEIGHTS` in the same
  file if a case's "ideal" answer doesn't match your intuition — the ideal
  item and every case's ranking are derived from those weights, not hand-set.
