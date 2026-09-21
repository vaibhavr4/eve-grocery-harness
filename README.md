# eve-grocery-harness

An experimentation harness for [eve](https://eve.dev), Vercel's agent framework. The agent, "Basket," is a grocery-shopping persona wired up purely as scaffolding for trying out eve's primitives:

- **Task-based subagents** — `price_scout` and `recipe_planner` are declared subagents with their own instructions, models, and tools. The root agent delegates to them; they run as durable background tasks and never see the parent's conversation.
- **Approval-gated tools** — `place_order`, `process_payment`, and `cancel_order` always pause for a human (`approval: always()`). `issue_refund` uses eve's `auto()` policy, which asks an evaluation model (`typesafe-ai/jev`, eve's built-in evaluator) to clear or escalate each call before falling back to a human.
- **Read-only tools** — `search_products`, `get_product`, `view_cart`, `track_order` never mutate anything.
- **Low-risk write tools** — `add_to_cart` / `remove_from_cart` mutate a mock cart with no approval, since nothing real happens.
- **A full trace UI** — every session (root agent and every subagent it spawns) streams its raw event log: reasoning, message text, tool calls with input/output, approvals, and step/turn lifecycle. See [Trace UI](#trace-ui) below.
- **A model-experiments tab** — standalone benchmarks comparing jev, Claude Sonnet 5, and Claude Opus 5 on tool-picking accuracy/latency and a simulated 500-store item-substitution task. See [`benchmarks/README.md`](./benchmarks/README.md) and [Model experiments](#model-experiments) below.

Everything is backed by an in-memory mock catalog/cart/orders (`agent/lib/catalog.ts`) — there's no real backend, payment processor, or fulfillment. It resets whenever the dev server restarts. Swap in real integrations once you're happy with the shape.

## Project layout

```
agent/
  instructions.md              # root agent persona
  agent.ts                     # root agent model config (eve/models/anthropic)
  lib/catalog.ts                # mock product catalog, cart, orders
  tools/
    search_products.ts          # read-only
    get_product.ts               # read-only
    view_cart.ts                 # read-only
    track_order.ts               # read-only
    add_to_cart.ts                # write, no approval
    remove_from_cart.ts           # write, no approval
    place_order.ts                 # write, approval: always()
    process_payment.ts             # write, approval: always()
    cancel_order.ts                # write, approval: always()
    issue_refund.ts                # write, approval: auto() via jev
  subagents/
    price_scout/                    # declared subagent
      agent.ts instructions.md tools/compare_prices.ts
    recipe_planner/                 # declared subagent
      agent.ts instructions.md tools/find_recipe.ts tools/match_ingredients.ts lib/recipes.ts
  channels/eve.ts                # built-in HTTP channel

app/                            # Next.js Web Chat UI (from --channel-web-nextjs)
  experiments/                  # Model Experiments tab (jev vs Sonnet vs Opus)
components/trace/
  build-trace.ts                # raw eve stream events -> a renderable trace tree
  session-trace.tsx             # recursive trace panel (mounts one per session, incl. subagents)
components/experiments/         # charts/tables for the experiments tab

benchmarks/                     # standalone jev vs Sonnet vs Opus suite — see benchmarks/README.md
  datasets/                     # single-tool, multi-tool, substitution (+ 500-store simulation)
  runners/                      # npm run bench:*
  results/                      # gitignored JSON output, read live by /experiments
```

## Getting started

1. Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` (or run `eve dev` and use `/login` for local credentials instead).
2. Install deps (already done if you just cloned — otherwise `npm install`).
3. Run the dev server:

   ```bash
   eve dev
   ```

   This opens eve's terminal REPL against a local dev server. To run just the HTTP/web server without the TUI (e.g. to drive it from the Next.js app only):

   ```bash
   eve dev --no-ui
   ```

4. In another terminal, run the Next.js Web Chat UI:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000. Send a message, then click **Trace** in the header to open the observability panel.

## Trace UI

The chat pane (left) is eve's stock Web Chat UI, already rendering reasoning and tool calls for the root agent's own turns. The **Trace** panel (right, toggle in the header) goes further: it consumes the *raw* eve stream (`agent.events`, not eve's message-shaped `agent.data.messages`) so it can show everything the message reducer collapses away — step/turn boundaries, token usage per step, pending vs. resolved approval requests, and so on.

The interesting part is subagent visibility. When the root agent calls a subagent tool, eve emits a `subagent.called` event carrying the child's `childSessionId`. `SessionTrace` (`components/trace/session-trace.tsx`) is recursive: it mounts a fresh `useEveAgent` subscription against that child session's own stream, and renders that child's full trace — reasoning, tool calls, everything — nested inside the parent tool call's collapsible panel. If that subagent calls a further nested subagent, the same component mounts again one level deeper. There's no depth limit; it follows whatever the agent tree actually does.

Try it: ask Basket to "find the best price on eggs and milk" (delegates to `price_scout`) or "suggest a pasta recipe and add the ingredients to my cart" (delegates to `recipe_planner`, which itself calls two tools), then expand the subagent's row in the Trace panel.

## Trying the approval flow

Ask Basket to add a couple of items to your cart and place the order. `place_order` and `process_payment` will each pause the turn — approve or deny them from the chat UI (buttons render inline) or from the Trace panel's pending-request badge. Ask it to issue a refund on a paid order to see the `auto()`/jev path: small, ordinary refunds may clear automatically, while anything unusual escalates to the same human-approval prompt.

## Model experiments

`/experiments` (linked from the chat header) compares jev, Claude Sonnet 5, and Claude Opus 5 on three tasks: single tool-call accuracy/latency, multi-tool sequencing and disambiguation, and a realistic "item out of stock across 500 stores, pick the best replacement" reasoning task with simulated demand-transfer data. It's a standalone benchmark suite — see [`benchmarks/README.md`](./benchmarks/README.md) for setup and how to run it (`npm run bench:all`). The tab reads whatever's in `benchmarks/results/*.json`; with nothing run yet it just tells you what command to run.

## Adding more

- **New tool**: add a file under `agent/tools/`; the filename is the tool name the model sees. See [eve's tools docs](https://eve.dev/docs/tools).
- **New subagent**: add a directory under `agent/subagents/<id>/` with at minimum an `agent.ts` exporting `defineAgent({ description, model })`. See [eve's subagents docs](https://eve.dev/docs/subagents).
- **New approval policy**: `eve/tools/approval` exports `never()`, `once()`, `always()`, `auto()`, or accepts a custom function — see [Human-in-the-loop](https://eve.dev/docs/tools/human-in-the-loop).

## Learn more

- [eve documentation](https://eve.dev/docs)
- [eve on GitHub](https://github.com/vercel/eve)
- Full docs are also bundled locally at `node_modules/eve/docs/` once you've run `npm install`.

## Deploy

```bash
eve deploy
```

Links a Vercel project if needed and deploys to production. See [eve's deployment docs](https://eve.dev/docs/guides/deployment/vercel).
