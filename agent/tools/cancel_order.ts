import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { ORDERS } from "../lib/catalog.js";

export default defineTool({
  description: "Cancel a placed order before it ships. Requires human approval.",
  inputSchema: z.object({
    orderId: z.string().min(1),
  }),
  approval: always(),
  execute({ orderId }) {
    const order = ORDERS.find((candidate) => candidate.id === orderId);
    if (!order) {
      return { ok: false as const, error: `No order with id ${orderId}` };
    }
    if (order.status === "cancelled" || order.status === "refunded") {
      return { ok: false as const, error: `Order ${orderId} is already ${order.status}.` };
    }

    order.status = "cancelled";
    return { ok: true as const, orderId };
  },
});
