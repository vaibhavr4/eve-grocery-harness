import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { CART, ORDERS, cartTotalUsd, nextOrderId } from "../lib/catalog.js";

// Placeholder write tool: no real fulfillment happens here. It exists to
// exercise eve's human-in-the-loop approval flow before anything "ships".
export default defineTool({
  description: "Place an order for everything currently in the cart. Requires human approval.",
  inputSchema: z.object({}),
  approval: always(),
  label: {
    start: () => `Place order for ${CART.length} line item(s)`,
  },
  execute() {
    if (CART.length === 0) {
      return { ok: false as const, error: "Cart is empty." };
    }

    const order = {
      id: nextOrderId(),
      lines: [...CART],
      totalUsd: Number(cartTotalUsd().toFixed(2)),
      status: "placed" as const,
      createdAt: new Date().toISOString(),
    };
    ORDERS.push(order);
    CART.length = 0;

    return { ok: true as const, order };
  },
});
