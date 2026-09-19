import { defineTool } from "eve/tools";
import { z } from "zod";
import { findProduct } from "../lib/catalog.js";

export default defineTool({
  description: "Get full details for one product by its catalog id. Read-only.",
  inputSchema: z.object({
    productId: z.string().min(1),
  }),
  execute({ productId }) {
    const product = findProduct(productId);
    if (!product) {
      return { found: false as const, productId };
    }
    return { found: true as const, product };
  },
});
