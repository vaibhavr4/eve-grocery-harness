import { defineTool } from "eve/tools";
import { z } from "zod";
import { CART, cartTotalUsd, findProduct } from "../lib/catalog.js";

export default defineTool({
  description: "View the current cart contents and running total. Read-only.",
  inputSchema: z.object({}),
  execute() {
    const lines = CART.map((line) => {
      const product = findProduct(line.productId);
      return {
        productId: line.productId,
        name: product?.name ?? "Unknown product",
        quantity: line.quantity,
        unitPriceUsd: product?.priceUsd ?? 0,
        lineTotalUsd: (product?.priceUsd ?? 0) * line.quantity,
      };
    });
    return { lines, totalUsd: Number(cartTotalUsd().toFixed(2)) };
  },
});
