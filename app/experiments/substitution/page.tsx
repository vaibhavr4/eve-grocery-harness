import { MODEL_KEYS, MODEL_LABELS } from "@/benchmarks/lib/models";
import { aggregate, type ScoredSubstitutionRun } from "@/benchmarks/lib/score";
import type { SubstitutionCase, SubstitutionTier } from "@/benchmarks/datasets/substitution";
import { toModelRecord } from "@/components/experiments/model-colors";
import { MetricBarChart } from "@/components/experiments/metric-bar-chart";
import { StatusIcon } from "@/components/experiments/status-icon";
import { loadSuite } from "@/lib/experiments/load-results";

// Always re-read benchmarks/results/*.json at request time — never prerender stale data.
export const dynamic = "force-dynamic";

const TIER_LABELS: Record<SubstitutionTier, string> = {
  network: "Network-wide (500 stores)",
  segment: "Per-segment (9 store segments)",
  edge: "Adversarial edge cases",
};

export default function SubstitutionPage() {
  const suite = loadSuite<SubstitutionCase, ScoredSubstitutionRun>("substitution.json");

  if (!suite) {
    return (
      <p className="text-sm text-muted-foreground">
        No results yet. Run{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono">npm run bench:substitution</code>.
      </p>
    );
  }

  const byModel = Object.fromEntries(
    MODEL_KEYS.map((key) => [
      key,
      aggregate(
        key,
        suite.cases.flatMap((c) => c.runs.filter((r) => r.modelKey === key)),
      ),
    ]),
  );

  const tiers: SubstitutionTier[] = ["network", "segment", "edge"];

  return (
    <div className="space-y-10">
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <MetricBarChart
            format={(v) => `${Math.round(v * 100)}%`}
            max={1}
            title="Top-1 hit rate (chose the rubric's best candidate)"
            values={toModelRecord((k) => byModel[k].accuracy)}
          />
        </div>
        <div className="rounded-lg border p-4">
          <MetricBarChart
            format={(v) => `${Math.round(v)}ms`}
            title="Mean latency"
            values={toModelRecord((k) => byModel[k].meanLatencyMs)}
          />
        </div>
      </section>

      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Ground truth comes from a deterministic rubric (organic match, pasture-raised match, price proximity,
        pack-size fit, local-farm considerations, supply-risk penalty, supply-scale feasibility, and simulated
        historical demand-transfer rate) over a seeded 500-store simulation — never from an LLM. Models see item
        attributes and demand-transfer numbers, but never the rubric weights or score itself.
      </div>

      {tiers.map((tier) => {
        const cases = suite.cases.filter((c) => c.case.tier === tier);
        return (
          <section className="space-y-3" key={tier}>
            <h2 className="text-sm font-medium">{TIER_LABELS[tier]}</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium" scope="col">Case</th>
                    <th className="px-3 py-2 font-medium" scope="col">Best pick (rubric)</th>
                    {MODEL_KEYS.map((key) => (
                      <th className="px-3 py-2 font-medium" key={key} scope="col">
                        {MODEL_LABELS[key]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cases.map(({ case: testCase, runs }) => (
                    <tr className="border-b align-top last:border-0" key={testCase.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{testCase.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{testCase.note}</p>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {testCase.idealItemId}
                        <br />
                        <span className="text-[10px]">score {testCase.ranking[0].score.toFixed(2)}</span>
                      </td>
                      {MODEL_KEYS.map((key) => {
                        const run = runs.find((r) => r.modelKey === key);
                        return (
                          <td className="px-3 py-2" key={key}>
                            {run ? (
                              <div className="space-y-1">
                                <StatusIcon correct={run.correct} error={run.error} />
                                <p className="font-mono text-xs text-muted-foreground">{run.chosenItemId ?? "—"}</p>
                                <p className="text-xs text-muted-foreground">
                                  {Math.round(run.latencyMs)}ms · score {run.score.toFixed(2)}
                                </p>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
