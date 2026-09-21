import type { ToolCatalogName } from "../lib/tool-catalog.js";

export interface SequenceCase {
  readonly id: string;
  readonly kind: "sequence";
  readonly question: string;
  /** Expected tools, in order. Graded as: exact order match, set match (any order), or miss. */
  readonly expectedSequence: readonly ToolCatalogName[];
}

export interface DisambiguationCase {
  readonly id: string;
  readonly kind: "disambiguation";
  readonly question: string;
  /** The single ideal tool. */
  readonly idealTool: ToolCatalogName;
  /** Other tools that a model could plausibly (but wrongly, or only partially-right) reach for. */
  readonly distractorTools: readonly ToolCatalogName[];
  readonly note: string;
}

export type MultiToolCase = SequenceCase | DisambiguationCase;

export const MULTI_TOOL_CASES: readonly MultiToolCase[] = [
  // --- sequences: the request genuinely needs 2+ tool calls ---
  {
    id: "mt_seq_1",
    kind: "sequence",
    question: "Add a dozen eggs to my cart, then place the order.",
    expectedSequence: ["add_to_cart", "place_order"],
  },
  {
    id: "mt_seq_2",
    kind: "sequence",
    question: "Check what's in my cart, and if it's not empty, go ahead and check out.",
    expectedSequence: ["view_cart", "place_order"],
  },
  {
    id: "mt_seq_3",
    kind: "sequence",
    question: "Look up order ord_0004's status, and if it hasn't shipped yet, cancel it.",
    expectedSequence: ["track_order", "cancel_order"],
  },
  {
    id: "mt_seq_4",
    kind: "sequence",
    question: "Place my order, then immediately charge my card for it.",
    expectedSequence: ["place_order", "process_payment"],
  },
  {
    id: "mt_seq_5",
    kind: "sequence",
    question: "Search for spaghetti, then add 2 boxes to my cart.",
    expectedSequence: ["search_products", "add_to_cart"],
  },
  {
    id: "mt_seq_6",
    kind: "sequence",
    question: "Look up order ord_0011's status, and if it's paid, refund it — it never arrived.",
    expectedSequence: ["track_order", "issue_refund"],
  },
  {
    id: "mt_seq_7",
    kind: "sequence",
    question: "Take the bread out of my cart, then show me what's left.",
    expectedSequence: ["remove_from_cart", "view_cart"],
  },
  {
    id: "mt_seq_8",
    kind: "sequence",
    question:
      "Find me the best recipe for a quick pasta dinner, then add whatever ingredients it needs to my cart.",
    expectedSequence: ["recipe_planner", "add_to_cart"],
  },

  // --- disambiguation: one right tool among plausible near-misses ---
  {
    id: "mt_dis_1",
    kind: "disambiguation",
    question: "I don't want the eggs anymore.",
    idealTool: "remove_from_cart",
    distractorTools: ["cancel_order"],
    note: "Cart item removal, not an order cancellation — no order has been placed yet in this phrasing.",
  },
  {
    id: "mt_dis_2",
    kind: "disambiguation",
    question: "Compare prices on eggs across stores for me.",
    idealTool: "price_scout",
    distractorTools: ["search_products"],
    note: "Needs cross-store price comparison, not just a catalog lookup.",
  },
  {
    id: "mt_dis_3",
    kind: "disambiguation",
    question: "What's a good dinner idea using what's already in my cart?",
    idealTool: "recipe_planner",
    distractorTools: ["view_cart"],
    note: "The ask is for a recipe suggestion; view_cart alone doesn't answer it (though a model may reasonably call it first).",
  },
  {
    id: "mt_dis_4",
    kind: "disambiguation",
    question: "This order never showed up and I already paid for it — I want it cancelled.",
    idealTool: "issue_refund",
    distractorTools: ["cancel_order"],
    note: "A paid order that never arrived needs a refund, not a pre-shipment cancellation.",
  },
  {
    id: "mt_dis_5",
    kind: "disambiguation",
    question: "How many eggs do I have in my cart right now?",
    idealTool: "view_cart",
    distractorTools: ["get_product", "search_products"],
    note: "Asks about cart contents, not catalog information about eggs in general.",
  },
  {
    id: "mt_dis_6",
    kind: "disambiguation",
    question: "Is the sourdough bread you sell actually in stock?",
    idealTool: "get_product",
    distractorTools: ["search_products"],
    note: "A known single product's stock status is a detail lookup; search is for discovering candidates, not confirming one.",
  },
  {
    id: "mt_dis_7",
    kind: "disambiguation",
    question: "I already told you to buy everything in my cart — did the payment go through?",
    idealTool: "track_order",
    distractorTools: ["process_payment", "view_cart"],
    note: "Checking status of an already-placed order, not re-triggering payment or looking at the (now empty) cart.",
  },
  {
    id: "mt_dis_8",
    kind: "disambiguation",
    question: "Add a couple more boxes of the pasta I already have in my cart.",
    idealTool: "add_to_cart",
    distractorTools: ["search_products", "get_product"],
    note: "The product is already identified/known — this is a quantity increase, not a fresh lookup.",
  },
  {
    id: "mt_dis_9",
    kind: "disambiguation",
    question: "This refund for ord_0014 never actually needed approval — can you just cancel that order instead?",
    idealTool: "cancel_order",
    distractorTools: ["issue_refund"],
    note: "Explicit request to cancel, not refund, despite refund being mentioned in the same sentence.",
  },
  {
    id: "mt_dis_10",
    kind: "disambiguation",
    question: "I'm cooking Italian tonight — what do I still need to buy?",
    idealTool: "recipe_planner",
    distractorTools: ["search_products", "view_cart"],
    note: "Needs a recipe-driven shopping list, not a generic catalog search.",
  },
];
