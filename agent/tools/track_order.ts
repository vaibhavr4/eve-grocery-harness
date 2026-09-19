import { defineTool } from "eve/tools";
import { z } from "zod";
import { ORDERS } from "../lib/catalog.js";

export default defineTool({
  description: "Look up a mock order by id and report its status. Read-only.",
  inputSchema: z.object({
    orderId: z.string().min(1),
  }),
  execute({ orderId }) {
    const order = ORDERS.find((candidate) => candidate.id === orderId);
    if (!order) {
      return { found: false as const, orderId };
    }
    return { found: true as const, order };
  },
});
