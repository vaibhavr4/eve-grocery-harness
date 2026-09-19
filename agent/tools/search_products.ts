import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchCatalog } from "../lib/catalog.js";

export default defineTool({
  description:
    "Search the grocery catalog by product name or category (e.g. 'milk', 'produce'). Read-only.",
  inputSchema: z.object({
    query: z.string().min(1).describe("Product name or category to search for."),
  }),
  label: {
    start: ({ query }) => `Search catalog for "${query}"`,
  },
  execute({ query }) {
    const results = searchCatalog(query);
    return {
      count: results.length,
      products: results,
    };
  },
});
