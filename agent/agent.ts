import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";

// Uses ANTHROPIC_API_KEY (set it in .env.local) or /login credentials in
// `eve dev`. Defaults to claude-sonnet-5; pass a native model id to
// anthropic("...") to pin a different one.
export default defineAgent({
  model: anthropic(),
});
