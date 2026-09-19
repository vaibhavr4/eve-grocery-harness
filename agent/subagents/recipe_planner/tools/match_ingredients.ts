import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchCatalog } from "../../../lib/catalog.js";

export default defineTool({
  description: "Map a list of ingredient names onto real catalog products. Read-only.",
  inputSchema: z.object({
    ingredients: z.array(z.string().min(1)).min(1),
  }),
  execute({ ingredients }) {
    const matches = ingredients.map((ingredient) => {
      const [best] = searchCatalog(ingredient).filter((product) => product.inStock);
      return best
        ? { ingredient, productId: best.id, product: best.name, priceUsd: best.priceUsd }
        : { ingredient, productId: null, product: null, priceUsd: null };
    });
    return { matches };
  },
});
