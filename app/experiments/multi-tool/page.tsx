import { MODEL_KEYS, MODEL_LABELS } from "@/benchmarks/lib/models";
import { aggregate } from "@/benchmarks/lib/score";
import type { MultiToolCase } from "@/benchmarks/datasets/multi-tool";
import { toModelRecord } from "@/components/experiments/model-colors";
import { MetricBarChart } from "@/components/experiments/metric-bar-chart";
import { StatusIcon } from "@/components/experiments/status-icon";
import { loadSuite } from "@/lib/experiments/load-results";

// Always re-read benchmarks/results/*.json at request time — never prerender stale data.
export const dynamic = "force-dynamic";

function expectedLabel(testCase: MultiToolCase): string {
  return testCase.kind === "sequence" ? testCase.expectedSequence.join(" → ") : testCase.idealTool;
}

export default function MultiToolPage() {
  const suite = loadSuite<MultiToolCase>("multi-tool.json");

  if (!suite) {
    return (
      <p className="text-sm text-muted-foreground">
        No results yet. Run <code className="rounded bg-muted px-1 py-0.5 font-mono">npm run bench:multi</code>.
      </p>
    );
  }

  const byKind = (kind: MultiToolCase["kind"]) => suite.cases.filter((c) => c.case.kind === kind);
  const sections = [
    { kind: "sequence" as const, label: "Sequence — the request needs an ordered chain of tool calls" },
    { kind: "disambiguation" as const, label: "Disambiguation — one right tool among plausible distractors" },
  ];

  return (
    <div className="space-y-10">
      <section className="grid gap-6 sm:grid-cols-2">
        {(["sequence", "disambiguation"] as const).map((kind) => {
          const cases = byKind(kind);
          const byModel = Object.fromEntries(
            MODEL_KEYS.map((key) => [
              key,
              aggregate(
                key,
                cases.flatMap((c) => c.runs.filter((r) => r.modelKey === key)),
              ),
            ]),
          );
          return (
            <div className="rounded-lg border p-4" key={kind}>
              <MetricBarChart
                format={(v) => `${Math.round(v * 100)}%`}
                max={1}
                title={`${kind === "sequence" ? "Exact-sequence" : "Exact-tool"} accuracy`}
                values={toModelRecord((k) => byModel[k].accuracy)}
              />
            </div>
          );
        })}
      </section>

      {sections.map(({ kind, label }) => (
        <section className="space-y-3" key={kind}>
          <h2 className="text-sm font-medium">{label}</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium" scope="col">Question</th>
                  <th className="px-3 py-2 font-medium" scope="col">Ideal</th>
                  {MODEL_KEYS.map((key) => (
                    <th className="px-3 py-2 font-medium" key={key} scope="col">
                      {MODEL_LABELS[key]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byKind(kind).map(({ case: testCase, runs }) => (
                  <tr className="border-b last:border-0 align-top" key={testCase.id}>
                    <td className="px-3 py-2">
                      {testCase.question}
                      {testCase.kind === "disambiguation" ? (
                        <p className="mt-1 text-xs text-muted-foreground">{testCase.note}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{expectedLabel(testCase)}</td>
                    {MODEL_KEYS.map((key) => {
                      const run = runs.find((r) => r.modelKey === key);
                      return (
                        <td className="px-3 py-2" key={key}>
                          {run ? (
                            <div className="space-y-1">
                              <StatusIcon correct={run.correct} error={run.error} />
                              <p className="text-xs text-muted-foreground">
                                {Math.round(run.latencyMs)}ms · score {run.score.toFixed(2)}
                              </p>
                              <p className="font-mono text-xs text-muted-foreground">
                                {run.toolCalls.map((c) => c.toolName).join(" → ") || "(none)"}
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
      ))}
    </div>
  );
}
