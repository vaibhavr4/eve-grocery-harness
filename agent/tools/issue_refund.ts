import { defineTool } from "eve/tools";
import { auto } from "eve/tools/approval";
import { z } from "zod";
import { ORDERS } from "../lib/catalog.js";

// This tool is the harness's example of eve's `auto()` approval policy:
// instead of always pausing for a human, eve asks an evaluation model
// (`typesafe-ai/jev`, eve's built-in evaluator) to classify the call as
// "clear" or "caution" first. Only a caution verdict, a failed evaluation, or
// an incomplete input falls through to a human approval prompt. Swap the
// `model` for another AI SDK evaluation model string to compare behavior.
export default defineTool({
  description: "Refund a paid order. Small refunds are auto-approved by the jev evaluation model; larger or unusual ones need a human.",
  inputSchema: z.object({
    orderId: z.string().min(1),
    reason: z.string().min(1),
  }),
  approval: auto({
    model: "typesafe-ai/jev",
    instructions: "Review whether this grocery refund can proceed automatically.",
    criteria: {
      clear: "The order exists, is paid, and the refund reason is a normal customer-service reason (wrong item, damaged, late delivery).",
      caution: "The order is missing, already refunded, the amount is unusually large, or the reason looks suspicious.",
    },
  }),
  execute({ orderId, reason }) {
    const order = ORDERS.find((candidate) => candidate.id === orderId);
    if (!order) {
      return { ok: false as const, error: `No order with id ${orderId}` };
    }
    if (order.status !== "paid") {
      return { ok: false as const, error: `Order ${orderId} is ${order.status}, not paid.` };
    }

    order.status = "refunded";
    return { ok: true as const, orderId, refundedUsd: order.totalUsd, reason };
  },
});
