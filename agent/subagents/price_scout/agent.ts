import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";

export default defineAgent({
  description:
    "Compare prices for one or more grocery products across stores and recommend the best value. Give it product names, not catalog ids.",
  model: anthropic("claude-haiku-4-5-20251001"),
});
