import type { InputRequest, InputResolution, MessageStreamEvent } from "eve/client";

export type TraceActionStatus = "pending" | "completed" | "failed" | "rejected";

export interface TraceAction {
  callId: string;
  kind: string;
  name: string;
  input: unknown;
  status: TraceActionStatus;
  label?: string;
  output?: unknown;
  error?: { code: string; message: string };
  subagent?: { childSessionId: string; name: string; completed: boolean };
}

export interface TraceStep {
  stepIndex: number;
  modelId?: string;
  reasoning?: string;
  reasoningStreaming: boolean;
  message?: string;
  messageStreaming: boolean;
  finishReason?: string;
  usage?: {
    readonly inputTokens?: number;
    readonly outputTokens?: number;
    readonly costUsd?: number;
  };
  actions: TraceAction[];
}

export interface TraceTurn {
  turnId: string;
  sequence: number;
  status: "running" | "completed" | "failed" | "cancelled";
  error?: string;
  steps: TraceStep[];
  pendingInputRequests: InputRequest[];
  resolvedInputs: InputResolution[];
}

export interface Trace {
  sessionStatus: "starting" | "running" | "waiting" | "failed" | "completed";
  sessionError?: string;
  turns: TraceTurn[];
}

function actionName(action: {
  kind: string;
  toolName?: string;
  name?: string;
  subagentName?: string;
  remoteAgentName?: string;
}): string {
  switch (action.kind) {
    case "tool-call":
    case "workflow-tool-call":
      return action.toolName ?? "tool";
    case "subagent-call":
      return action.subagentName ?? action.name ?? "subagent";
    case "remote-agent-call":
      return action.remoteAgentName ?? action.name ?? "remote-agent";
    case "load-skill":
      return "load_skill";
    default:
      return action.kind;
  }
}

export function buildTrace(events: readonly MessageStreamEvent[]): Trace {
  const turns: TraceTurn[] = [];
  const turnById = new Map<string, TraceTurn>();
  const stepsByTurn = new Map<string, Map<number, TraceStep>>();
  const actionByCallId = new Map<string, TraceAction>();

  let sessionStatus: Trace["sessionStatus"] = "starting";
  let sessionError: string | undefined;

  function getTurn(turnId: string, sequence = 0): TraceTurn {
    let turn = turnById.get(turnId);
    if (!turn) {
      turn = {
        turnId,
        sequence,
        status: "running",
        steps: [],
        pendingInputRequests: [],
        resolvedInputs: [],
      };
      turnById.set(turnId, turn);
      turns.push(turn);
      turns.sort((a, b) => a.sequence - b.sequence);
    }
    return turn;
  }

  function getStep(turnId: string, stepIndex: number): TraceStep {
    const turn = getTurn(turnId);
    let byIndex = stepsByTurn.get(turnId);
    if (!byIndex) {
      byIndex = new Map();
      stepsByTurn.set(turnId, byIndex);
    }
    let step = byIndex.get(stepIndex);
    if (!step) {
      step = { stepIndex, reasoningStreaming: false, messageStreaming: false, actions: [] };
      byIndex.set(stepIndex, step);
      turn.steps.push(step);
      turn.steps.sort((a, b) => a.stepIndex - b.stepIndex);
    }
    return step;
  }

  for (const event of events) {
    switch (event.type) {
      case "session.started": {
        sessionStatus = "running";
        break;
      }
      case "session.waiting": {
        sessionStatus = "waiting";
        break;
      }
      case "session.failed": {
        sessionStatus = "failed";
        sessionError = event.data.message;
        break;
      }
      case "session.completed": {
        sessionStatus = "completed";
        break;
      }
      case "turn.started": {
        getTurn(event.data.turnId, event.data.sequence);
        break;
      }
      case "step.started": {
        getStep(event.data.turnId, event.data.stepIndex).modelId = event.data.modelId;
        break;
      }
      case "step.completed": {
        const step = getStep(event.data.turnId, event.data.stepIndex);
        step.finishReason = event.data.finishReason;
        step.usage = event.data.usage;
        break;
      }
      case "reasoning.appended": {
        const step = getStep(event.data.turnId, event.data.stepIndex);
        step.reasoning = (step.reasoning ?? "") + event.data.reasoningDelta;
        step.reasoningStreaming = true;
        break;
      }
      case "reasoning.completed": {
        const step = getStep(event.data.turnId, event.data.stepIndex);
        step.reasoning = event.data.reasoning;
        step.reasoningStreaming = false;
        break;
      }
      case "message.appended": {
        const step = getStep(event.data.turnId, event.data.stepIndex);
        step.message = (step.message ?? "") + event.data.messageDelta;
        step.messageStreaming = true;
        break;
      }
      case "message.completed": {
        const step = getStep(event.data.turnId, event.data.stepIndex);
        step.message = event.data.message ?? step.message;
        step.messageStreaming = false;
        step.finishReason = event.data.finishReason;
        break;
      }
      case "actions.requested": {
        const step = getStep(event.data.turnId, event.data.stepIndex);
        for (const action of event.data.actions) {
          const trace: TraceAction = {
            callId: action.callId,
            kind: action.kind,
            name: actionName(action),
            input: action.input,
            status: "pending",
            label: event.data.presentation?.[action.callId]?.label,
          };
          actionByCallId.set(action.callId, trace);
          step.actions.push(trace);
        }
        break;
      }
      case "subagent.called": {
        const action = actionByCallId.get(event.data.callId);
        if (action) {
          action.subagent = { childSessionId: event.data.childSessionId, name: event.data.name, completed: false };
        }
        break;
      }
      case "subagent.completed": {
        const action = actionByCallId.get(event.data.callId);
        if (action?.subagent) {
          action.subagent.completed = true;
        }
        break;
      }
      case "action.partial": {
        const action = actionByCallId.get(event.data.result.callId);
        if (action) {
          action.output = event.data.result.output;
        }
        break;
      }
      case "action.result": {
        const action = actionByCallId.get(event.data.result.callId);
        if (action) {
          action.status = event.data.status;
          action.output = event.data.result.output;
          action.error = event.data.error;
        }
        break;
      }
      case "input.requested": {
        const turn = getTurn(event.data.turnId);
        for (const request of event.data.requests) {
          if (!turn.pendingInputRequests.some((existing) => existing.requestId === request.requestId)) {
            turn.pendingInputRequests.push(request);
          }
        }
        break;
      }
      case "input.resolved": {
        const turn = getTurn(event.data.turnId);
        const resolvedIds = new Set(event.data.resolutions.map((resolution) => resolution.requestId));
        turn.pendingInputRequests = turn.pendingInputRequests.filter(
          (request) => !resolvedIds.has(request.requestId),
        );
        turn.resolvedInputs.push(...event.data.resolutions);
        break;
      }
      case "turn.completed": {
        getTurn(event.data.turnId).status = "completed";
        break;
      }
      case "turn.failed": {
        const turn = getTurn(event.data.turnId);
        turn.status = "failed";
        turn.error = event.data.message;
        break;
      }
      case "turn.cancelled": {
        getTurn(event.data.turnId).status = "cancelled";
        break;
      }
      default:
        break;
    }
  }

  return { sessionStatus, sessionError, turns };
}
