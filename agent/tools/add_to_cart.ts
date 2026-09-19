import { defineTool } from "eve/tools";
import { z } from "zod";
import { CART, cartTotalUsd, findProduct } from "../lib/catalog.js";

export default defineTool({
  description: "Add a quantity of one catalog product to the cart. Reversible, no approval needed.",
  inputSchema: z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive().default(1),
  }),
  label: {
    start: ({ productId, quantity }) => `Add ${quantity} × ${productId} to cart`,
  },
  execute({ productId, quantity }) {
    const product = findProduct(productId);
    if (!product) {
      return { ok: false as const, error: `No product with id ${productId}` };
    }

    const existing = CART.find((line) => line.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      CART.push({ productId, quantity });
    }

    return { ok: true as const, product: product.name, quantity, cartTotalUsd: Number(cartTotalUsd().toFixed(2)) };
  },
});
