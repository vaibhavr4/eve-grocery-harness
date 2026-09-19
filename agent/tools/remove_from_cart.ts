import { defineTool } from "eve/tools";
import { z } from "zod";
import { CART, cartTotalUsd } from "../lib/catalog.js";

export default defineTool({
  description: "Remove one product from the cart entirely. Reversible, no approval needed.",
  inputSchema: z.object({
    productId: z.string().min(1),
  }),
  execute({ productId }) {
    const index = CART.findIndex((line) => line.productId === productId);
    if (index === -1) {
      return { ok: false as const, error: `${productId} is not in the cart` };
    }
    CART.splice(index, 1);
    return { ok: true as const, cartTotalUsd: Number(cartTotalUsd().toFixed(2)) };
  },
});
