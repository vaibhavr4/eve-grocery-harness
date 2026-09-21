import { MODEL_KEYS } from "@/benchmarks/lib/models";
import type { ModelKey } from "@/benchmarks/lib/models";
import { MODEL_COLOR_VAR, MODEL_SHORT_LABEL } from "./model-colors";

export function MetricBarChart({
  title,
  values,
  format = (v: number) => String(v),
  max,
}: {
  readonly title: string;
  readonly values: Record<ModelKey, number>;
  readonly format?: (v: number) => string;
  readonly max?: number;
}) {
  const maxValue = max ?? Math.max(1, ...MODEL_KEYS.map((k) => values[k]));

  return (
    <div className="space-y-2">
      <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
      <div className="space-y-1.5">
        {MODEL_KEYS.map((key) => {
          const value = values[key];
          const pct = maxValue === 0 ? 0 : Math.max(1.5, (value / maxValue) * 100);
          return (
            <div className="flex items-center gap-2" key={key}>
              <span className="w-14 shrink-0 text-xs text-muted-foreground">{MODEL_SHORT_LABEL[key]}</span>
              <div className="h-4 flex-1 overflow-hidden rounded-sm bg-muted/50">
                <div className="h-4 rounded-sm" style={{ width: `${pct}%`, background: MODEL_COLOR_VAR[key] }} />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-xs text-foreground">{format(value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
