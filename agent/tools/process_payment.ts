import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { ORDERS } from "../lib/catalog.js";

// Placeholder: simulates charging a card. Wire up a real payment provider
// here later; this only flips a mock order's status once approved.
export default defineTool({
  description: "Charge the shopper's card for a placed order. Requires human approval.",
  inputSchema: z.object({
    orderId: z.string().min(1),
  }),
  approval: always(),
  label: {
    start: ({ orderId }) => `Charge card for order ${orderId}`,
  },
  execute({ orderId }) {
    const order = ORDERS.find((candidate) => candidate.id === orderId);
    if (!order) {
      return { ok: false as const, error: `No order with id ${orderId}` };
    }
    if (order.status !== "placed") {
      return { ok: false as const, error: `Order ${orderId} is ${order.status}, not placed.` };
    }

    order.status = "paid";
    return { ok: true as const, orderId, chargedUsd: order.totalUsd };
  },
});
