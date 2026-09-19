import { defineTool } from "eve/tools";
import { z } from "zod";
import { RECIPES } from "../lib/recipes.js";

export default defineTool({
  description: "Search the local recipe book by cuisine, dish name, or keyword. Read-only.",
  inputSchema: z.object({
    query: z.string().min(1),
  }),
  execute({ query }) {
    const needle = query.trim().toLowerCase();
    const matches = RECIPES.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(needle) ||
        recipe.cuisine.toLowerCase().includes(needle) ||
        recipe.keywords.some((keyword) => keyword.includes(needle)),
    );
    return { count: matches.length, recipes: matches };
  },
});
