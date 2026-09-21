import { MODEL_KEYS, MODEL_LABELS } from "@/benchmarks/lib/models";
import { aggregate } from "@/benchmarks/lib/score";
import type { SingleToolCase } from "@/benchmarks/datasets/single-tool";
import { toModelRecord } from "@/components/experiments/model-colors";
import { MetricBarChart } from "@/components/experiments/metric-bar-chart";
import { StatusIcon } from "@/components/experiments/status-icon";
import { loadSuite } from "@/lib/experiments/load-results";

// Always re-read benchmarks/results/*.json at request time — never prerender stale data.
export const dynamic = "force-dynamic";

export default function SingleToolPage() {
  const suite = loadSuite<SingleToolCase>("single-tool.json");

  if (!suite) {
    return (
      <p className="text-sm text-muted-foreground">
        No results yet. Run <code className="rounded bg-muted px-1 py-0.5 font-mono">npm run bench:single</code>.
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

  return (
    <div className="space-y-8">
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <MetricBarChart
            format={(v) => `${Math.round(v * 100)}%`}
            max={1}
            title="Accuracy — did it call exactly the right tool?"
            values={toModelRecord((k) => byModel[k].accuracy)}
          />
        </div>
        <div className="rounded-lg border p-4">
          <MetricBarChart
            format={(v) => `${Math.round(v)}ms`}
            title="Mean latency (Sonnet/Opus with extended thinking enabled)"
            values={toModelRecord((k) => byModel[k].meanLatencyMs)}
          />
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Per-question results for every model</caption>
          <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium" scope="col">Question</th>
              <th className="px-3 py-2 font-medium" scope="col">Expected tool</th>
              {MODEL_KEYS.map((key) => (
                <th className="px-3 py-2 font-medium" key={key} scope="col">
                  {MODEL_LABELS[key]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suite.cases.map(({ case: testCase, runs }) => (
              <tr className="border-b last:border-0" key={testCase.id}>
                <td className="px-3 py-2">{testCase.question}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{testCase.expectedTool}</td>
                {MODEL_KEYS.map((key) => {
                  const run = runs.find((r) => r.modelKey === key);
                  return (
                    <td className="px-3 py-2" key={key}>
                      {run ? (
                        <div className="space-y-1">
                          <StatusIcon correct={run.correct} error={run.error} />
                          <p className="text-xs text-muted-foreground">{Math.round(run.latencyMs)}ms</p>
                          {run.gradeNote ? <p className="text-xs text-muted-foreground">{run.gradeNote}</p> : null}
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
      </section>
    </div>
  );
}
