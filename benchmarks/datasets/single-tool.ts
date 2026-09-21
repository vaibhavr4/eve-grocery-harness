import type { ToolCatalogName } from "../lib/tool-catalog.js";

export interface SingleToolCase {
  readonly id: string;
  readonly question: string;
  readonly expectedTool: ToolCatalogName;
}

// Two phrasings per tool in the catalog — exhaustive coverage of every
// model-visible tool, each asked a plain way and a less on-the-nose way.
export const SINGLE_TOOL_CASES: readonly SingleToolCase[] = [
  { id: "st_search_1", question: "Search for cheese.", expectedTool: "search_products" },
  { id: "st_search_2", question: "What kind of produce do you carry?", expectedTool: "search_products" },

  { id: "st_getproduct_1", question: "Tell me everything about product p_eggs_wh.", expectedTool: "get_product" },
  { id: "st_getproduct_2", question: "Can you pull up the full details on catalog item p_bread_wh?", expectedTool: "get_product" },

  { id: "st_viewcart_1", question: "What's in my cart right now?", expectedTool: "view_cart" },
  { id: "st_viewcart_2", question: "How much am I about to spend, total, with what I've picked so far?", expectedTool: "view_cart" },

  { id: "st_trackorder_1", question: "Is order ord_0007 done yet?", expectedTool: "track_order" },
  { id: "st_trackorder_2", question: "What's the status on ord_0012?", expectedTool: "track_order" },

  { id: "st_addcart_1", question: "Put 2 loaves of sourdough bread in my cart.", expectedTool: "add_to_cart" },
  { id: "st_addcart_2", question: "Grab me a dozen eggs.", expectedTool: "add_to_cart" },

  { id: "st_removecart_1", question: "Take the eggs out of my cart.", expectedTool: "remove_from_cart" },
  { id: "st_removecart_2", question: "Actually, I don't want the chicken breast anymore — drop it.", expectedTool: "remove_from_cart" },

  { id: "st_placeorder_1", question: "I'm ready to buy everything in my cart, place the order.", expectedTool: "place_order" },
  { id: "st_placeorder_2", question: "Go ahead and check out.", expectedTool: "place_order" },

  { id: "st_payment_1", question: "Go ahead and charge my card for order ord_0002.", expectedTool: "process_payment" },
  { id: "st_payment_2", question: "Please bill me now for ord_0003.", expectedTool: "process_payment" },

  { id: "st_cancelorder_1", question: "Please cancel order ord_0005.", expectedTool: "cancel_order" },
  { id: "st_cancelorder_2", question: "Stop ord_0006 before it ships, I changed my mind.", expectedTool: "cancel_order" },

  { id: "st_refund_1", question: "I want my money back for order ord_0009, it arrived spoiled.", expectedTool: "issue_refund" },
  { id: "st_refund_2", question: "Order ord_0010 was wrong, refund me please.", expectedTool: "issue_refund" },

  { id: "st_pricescout_1", question: "Where can I get milk the cheapest?", expectedTool: "price_scout" },
  { id: "st_pricescout_2", question: "Compare prices on chicken breast across stores for me.", expectedTool: "price_scout" },

  { id: "st_recipe_1", question: "What should I cook with chicken and garlic tonight?", expectedTool: "recipe_planner" },
  { id: "st_recipe_2", question: "Suggest a good Italian dinner and tell me what to buy for it.", expectedTool: "recipe_planner" },
];
