import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchCatalog } from "../../../lib/catalog.js";

export default defineTool({
  description: "Find every store listing for a product name and compare prices. Read-only.",
  inputSchema: z.object({
    productName: z.string().min(1),
  }),
  label: {
    start: ({ productName }) => `Compare prices for "${productName}"`,
  },
  execute({ productName }) {
    const listings = searchCatalog(productName)
      .filter((product) => product.inStock)
      .sort((a, b) => a.priceUsd - b.priceUsd);

    if (listings.length === 0) {
      return { productName, listings: [], best: null };
    }

    return {
      productName,
      listings,
      best: { store: listings[0].store, priceUsd: listings[0].priceUsd },
    };
  },
});
