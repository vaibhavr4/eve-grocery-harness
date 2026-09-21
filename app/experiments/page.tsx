import Link from "next/link";
import { MODEL_KEYS } from "@/benchmarks/lib/models";
import { aggregate } from "@/benchmarks/lib/score";
import type { SuiteResult } from "@/benchmarks/lib/types";
import { toModelRecord } from "@/components/experiments/model-colors";
import { MetricBarChart } from "@/components/experiments/metric-bar-chart";
import { loadSuite } from "@/lib/experiments/load-results";

// Always re-read benchmarks/results/*.json at request time — never prerender stale data.
export const dynamic = "force-dynamic";

function suiteAggregates(suite: SuiteResult<unknown> | null) {
  if (!suite) return null;
  return Object.fromEntries(
    MODEL_KEYS.map((key) => [
      key,
      aggregate(
        key,
        suite.cases.flatMap((c) => c.runs.filter((r) => r.modelKey === key)),
      ),
    ]),
  );
}

const SUITES = [
  { file: "single-tool.json", href: "/experiments/single-tool", label: "Single tool invocation" },
  { file: "multi-tool.json", href: "/experiments/multi-tool", label: "Multi-tool scenarios" },
  { file: "substitution.json", href: "/experiments/substitution", label: "Item substitution" },
] as const;

export default function ExperimentsOverviewPage() {
  const suites = SUITES.map((s) => {
    const suite = loadSuite(s.file);
    return { ...s, suite, aggregates: suiteAggregates(suite) };
  });
  const hasAnyResults = suites.some((s) => s.suite !== null);

  return (
    <div className="space-y-8">
      {!hasAnyResults ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No results yet.</p>
          <p className="mt-1">
            Set <code className="rounded bg-muted px-1 py-0.5 font-mono">ANTHROPIC_API_KEY</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">AI_GATEWAY_API_KEY</code> (for jev) in{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">.env.local</code>, then run{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">npm run bench:all</code> from the project root.
            Each suite can also be run individually with <code className="rounded bg-muted px-1 py-0.5 font-mono">bench:single</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">bench:multi</code>, or{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">bench:substitution</code>.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-3">
        {suites.map(({ file, href, label, suite, aggregates }) => (
          <Link
            className="block rounded-lg border p-4 transition-colors hover:bg-accent/50"
            href={href}
            key={file}
          >
            <h2 className="text-sm font-medium">{label}</h2>
            {suite && aggregates ? (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-muted-foreground">{suite.cases.length} cases · run {new Date(suite.generatedAt).toLocaleString()}</p>
                <MetricBarChart
                  format={(v) => `${Math.round(v * 100)}%`}
                  max={1}
                  title="Accuracy"
                  values={toModelRecord((k) => aggregates[k].accuracy)}
                />
                <MetricBarChart
                  format={(v) => `${Math.round(v)}ms`}
                  title="Mean latency"
                  values={toModelRecord((k) => aggregates[k].meanLatencyMs)}
                />
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground italic">Not run yet.</p>
            )}
          </Link>
        ))}
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <h2 className="font-medium text-foreground">What each suite tests</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">Single tool invocation</strong> — one question, exactly one right
            tool out of the harness&apos;s full 12-tool catalog. Measures raw tool-picking accuracy and latency,
            including Sonnet/Opus with extended thinking enabled.
          </li>
          <li>
            <strong className="text-foreground">Multi-tool scenarios</strong> — requests needing an ordered
            sequence of tool calls, plus disambiguation cases with plausible-looking distractor tools.
          </li>
          <li>
            <strong className="text-foreground">Item substitution</strong> — a simulated 500-store network with an
            out-of-stock item; models pick the best replacement from item attributes, price, and simulated
            demand-transfer data, scored against a deterministic rubric across network, segment, and adversarial
            edge cases.
          </li>
        </ul>
      </div>
    </div>
  );
}
