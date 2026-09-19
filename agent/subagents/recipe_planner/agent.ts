import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";

export default defineAgent({
  description:
    "Suggest a recipe for a cuisine, occasion, or set of ingredients, and turn it into a shopping list of catalog products. Give it what the shopper wants to cook or has on hand.",
  model: anthropic(),
});
