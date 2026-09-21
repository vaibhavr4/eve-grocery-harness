import { generateObject, generateText, stepCountIs } from "ai";
import { z } from "zod";
import { reasoningProviderOptions, resolveModel, type ModelKey } from "./models.js";
import { SYSTEM_PROMPT, TOOL_CATALOG } from "./tool-catalog.js";
import type { ModelRunResult, ToolCallRecord } from "./types.js";

export interface RunToolPickOptions {
  /** Allow several tool-call rounds (for sequence cases). Default: single call only. */
  readonly multiStep?: boolean;
  readonly maxSteps?: number;
}

export async function runToolPick(
  modelKey: ModelKey,
  question: string,
  options: RunToolPickOptions = {},
): Promise<ModelRunResult> {
  const { multiStep = false, maxSteps = 4 } = options;
  const start = performance.now();
  try {
    const result = await generateText({
      model: resolveModel(modelKey),
      system: SYSTEM_PROMPT,
      prompt: question,
      tools: TOOL_CATALOG,
      toolChoice: multiStep ? "auto" : "required",
      stopWhen: stepCountIs(multiStep ? maxSteps : 1),
      providerOptions: reasoningProviderOptions(modelKey),
    });
    const latencyMs = performance.now() - start;
    const toolCalls: ToolCallRecord[] = result.toolCalls.map((c) => ({ toolName: c.toolName, input: c.input }));
    return {
      modelKey,
      latencyMs,
      toolCalls,
      reasoningText: result.reasoningText,
      outputText: result.text,
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        reasoningTokens: result.usage.outputTokenDetails?.reasoningTokens,
      },
    };
  } catch (error) {
    return {
      modelKey,
      latencyMs: performance.now() - start,
      toolCalls: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const SUBSTITUTION_ANSWER_SCHEMA = z.object({
  chosenItemId: z.string().describe("The id of the single best replacement candidate."),
  rationale: z.string().describe("One to three sentences justifying the pick."),
});

export interface SubstitutionRunResult extends ModelRunResult {
  readonly chosenItemId?: string;
  readonly rationale?: string;
}

export async function runSubstitutionPick(
  modelKey: ModelKey,
  prompt: string,
): Promise<SubstitutionRunResult> {
  const start = performance.now();
  try {
    const result = await generateObject({
      model: resolveModel(modelKey),
      schema: SUBSTITUTION_ANSWER_SCHEMA,
      prompt,
      providerOptions: reasoningProviderOptions(modelKey),
    });
    const latencyMs = performance.now() - start;
    return {
      modelKey,
      latencyMs,
      toolCalls: [],
      reasoningText: result.reasoning,
      chosenItemId: result.object.chosenItemId,
      rationale: result.object.rationale,
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        reasoningTokens: result.usage.outputTokenDetails?.reasoningTokens,
      },
    };
  } catch (error) {
    return {
      modelKey,
      latencyMs: performance.now() - start,
      toolCalls: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
