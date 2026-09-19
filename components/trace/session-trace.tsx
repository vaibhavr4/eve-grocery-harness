"use client";

import { useEveAgent } from "eve/react";
import {
  AlertTriangleIcon,
  BotIcon,
  BrainIcon,
  CircleCheckIcon,
  CircleXIcon,
  LoaderCircleIcon,
  ShieldQuestionIcon,
  WrenchIcon,
} from "lucide-react";
import { useMemo } from "react";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { buildTrace, type TraceAction, type TraceTurn } from "./build-trace";

const codeBlockClassName =
  "rounded-none border-0 bg-transparent [&_pre]:!bg-transparent [&_pre]:px-3 [&_pre]:pt-2 [&_pre]:pb-3 [&_pre]:text-xs [&_code]:text-xs";

export function SessionTrace({
  sessionId,
  label,
  depth = 0,
}: {
  readonly sessionId: string;
  readonly label?: string;
  readonly depth?: number;
}) {
  const agent = useEveAgent({
    initialSession: { sessionId, streamIndex: 0 },
    resume: true,
  });

  const trace = useMemo(() => buildTrace(agent.events), [agent.events]);

  return (
    <div className={cn("space-y-3", depth > 0 && "border-muted-foreground/20 border-l pl-3")}>
      <div className="flex items-center gap-2 text-xs">
        <BotIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium text-foreground">{label ?? "Root agent"}</span>
        <SessionStatusBadge status={trace.sessionStatus} />
        <span className="truncate font-mono text-[10px] text-muted-foreground">{sessionId}</span>
      </div>
      {trace.sessionError ? (
        <p className="text-destructive text-xs">{trace.sessionError}</p>
      ) : null}
      {trace.turns.length === 0 ? (
        <p className="text-muted-foreground text-xs italic">No activity yet.</p>
      ) : (
        <div className="space-y-4">
          {trace.turns.map((turn) => (
            <TraceTurnView depth={depth} key={turn.turnId} turn={turn} />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionStatusBadge({ status }: { readonly status: string }) {
  const styles: Record<string, string> = {
    starting: "bg-muted text-muted-foreground",
    running: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    waiting: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    failed: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wide", styles[status])}>
      {status}
    </span>
  );
}

function TraceTurnView({ turn, depth }: { readonly turn: TraceTurn; readonly depth: number }) {
  return (
    <div className="space-y-2 rounded-md border border-border/60 p-2">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="uppercase tracking-wide">Turn</span>
        <SessionStatusBadge status={turn.status} />
        {turn.error ? <span className="text-destructive">{turn.error}</span> : null}
      </div>
      {turn.steps.map((step) => (
        <div className="space-y-2" key={step.stepIndex}>
          {step.reasoning ? (
            <Reasoning defaultOpen={false} isStreaming={step.reasoningStreaming}>
              <ReasoningTrigger>
                <BrainIcon className="size-3.5" />
                <span className="text-xs">Reasoning</span>
              </ReasoningTrigger>
              <ReasoningContent>{step.reasoning}</ReasoningContent>
            </Reasoning>
          ) : null}
          {step.message ? (
            <p className="whitespace-pre-wrap text-sm">
              {step.message}
              {step.messageStreaming ? <span className="animate-pulse">▍</span> : null}
            </p>
          ) : null}
          {step.usage ? (
            <p className="text-[10px] text-muted-foreground">
              {step.modelId ? `${step.modelId} · ` : ""}
              {step.usage.inputTokens ?? 0} in / {step.usage.outputTokens ?? 0} out
              {step.usage.costUsd !== undefined ? ` · $${step.usage.costUsd.toFixed(4)}` : ""}
            </p>
          ) : null}
          {step.actions.map((action) => (
            <TraceActionView action={action} depth={depth} key={action.callId} />
          ))}
        </div>
      ))}
      {turn.pendingInputRequests.map((request) => (
        <div
          className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs"
          key={request.requestId}
        >
          <ShieldQuestionIcon className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium">
              {request.kind === "tool-approval" ? "Awaiting approval" : "Awaiting input"}
            </p>
            <p className="text-muted-foreground">{request.prompt}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TraceActionView({ action, depth }: { readonly action: TraceAction; readonly depth: number }) {
  const StatusIcon =
    action.status === "completed"
      ? CircleCheckIcon
      : action.status === "failed"
        ? CircleXIcon
        : action.status === "rejected"
          ? AlertTriangleIcon
          : LoaderCircleIcon;

  const statusColor =
    action.status === "completed"
      ? "text-emerald-600 dark:text-emerald-400"
      : action.status === "failed"
        ? "text-destructive"
        : action.status === "rejected"
          ? "text-amber-600 dark:text-amber-400"
          : "text-muted-foreground";

  return (
    <Collapsible className="rounded-md bg-muted/40">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-2 py-1.5 text-left">
        <WrenchIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="font-mono text-xs">{action.name}</span>
        <StatusIcon className={cn("size-3.5 shrink-0", statusColor, action.status === "pending" && "animate-spin")} />
        {action.label ? <span className="truncate text-muted-foreground text-xs">{action.label}</span> : null}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-2 pb-2">
        <div className="overflow-hidden rounded-md bg-background">
          <span className="block px-2 pt-2 font-sans text-[9px] text-muted-foreground uppercase tracking-wide">
            Input
          </span>
          <CodeBlock className={codeBlockClassName} code={JSON.stringify(action.input, null, 2)} language="json" />
        </div>
        {action.output !== undefined ? (
          <div className="overflow-hidden rounded-md bg-background">
            <span className="block px-2 pt-2 font-sans text-[9px] text-muted-foreground uppercase tracking-wide">
              Output
            </span>
            <CodeBlock
              className={codeBlockClassName}
              code={JSON.stringify(action.output, null, 2)}
              language="json"
            />
          </div>
        ) : null}
        {action.error ? (
          <p className="rounded-md bg-destructive/10 px-2 py-1 text-destructive text-xs">
            {action.error.code}: {action.error.message}
          </p>
        ) : null}
        {action.subagent ? (
          <div className="pt-1">
            <SessionTrace
              depth={depth + 1}
              label={action.subagent.name}
              sessionId={action.subagent.childSessionId}
            />
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
