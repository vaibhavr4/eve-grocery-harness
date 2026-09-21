import { CheckCircle2Icon, CircleAlertIcon, XCircleIcon } from "lucide-react";

export function StatusIcon({ correct, error }: { readonly correct: boolean; readonly error?: string }) {
  if (error) {
    return (
      <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--status-critical)" }}>
        <CircleAlertIcon className="size-3.5" /> error
      </span>
    );
  }
  return correct ? (
    <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--status-good)" }}>
      <CheckCircle2Icon className="size-3.5" /> correct
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <XCircleIcon className="size-3.5" /> miss
    </span>
  );
}
