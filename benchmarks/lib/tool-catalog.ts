import { tool } from "ai";
import { z } from "zod";

/**
 * Mirrors the model-visible surface of agent/tools/*.ts and the two declared
 * subagents, as plain AI SDK tool() defs (name, description, inputSchema).
 * `execute` is a stub — these benchmarks only score which tool + args a model
 * picks, never real side effects, so no eve runtime is needed to run them.
 */
export const TOOL_CATALOG = {
  search_products: tool({
    description:
      "Search the grocery catalog by product name or category (e.g. 'milk', 'produce'). Read-only.",
    inputSchema: z.object({ query: z.string().min(1) }),
    execute: async () => ({ count: 0, products: [] }),
  }),
  get_product: tool({
    description: "Get full details for one product by its catalog id. Read-only.",
    inputSchema: z.object({ productId: z.string().min(1) }),
    execute: async () => ({ found: false }),
  }),
  view_cart: tool({
    description: "View the current cart contents and running total. Read-only.",
    inputSchema: z.object({}),
    execute: async () => ({ lines: [], totalUsd: 0 }),
  }),
  track_order: tool({
    description: "Look up a mock order by id and report its status. Read-only.",
    inputSchema: z.object({ orderId: z.string().min(1) }),
    execute: async () => ({ found: false }),
  }),
  add_to_cart: tool({
    description: "Add a quantity of one catalog product to the cart. Reversible, no approval needed.",
    inputSchema: z.object({ productId: z.string().min(1), quantity: z.number().int().positive().default(1) }),
    execute: async () => ({ ok: true }),
  }),
  remove_from_cart: tool({
    description: "Remove one product from the cart entirely. Reversible, no approval needed.",
    inputSchema: z.object({ productId: z.string().min(1) }),
    execute: async () => ({ ok: true }),
  }),
  place_order: tool({
    description: "Place an order for everything currently in the cart. Requires human approval.",
    inputSchema: z.object({}),
    execute: async () => ({ ok: true }),
  }),
  process_payment: tool({
    description: "Charge the shopper's card for a placed order. Requires human approval.",
    inputSchema: z.object({ orderId: z.string().min(1) }),
    execute: async () => ({ ok: true }),
  }),
  cancel_order: tool({
    description: "Cancel a placed order before it ships. Requires human approval.",
    inputSchema: z.object({ orderId: z.string().min(1) }),
    execute: async () => ({ ok: true }),
  }),
  issue_refund: tool({
    description:
      "Refund a paid order. Small refunds are auto-approved by the jev evaluation model; larger or unusual ones need a human.",
    inputSchema: z.object({ orderId: z.string().min(1), reason: z.string().min(1) }),
    execute: async () => ({ ok: true }),
  }),
  price_scout: tool({
    description:
      "Compare prices for one or more grocery products across stores and recommend the best value. Give it product names, not catalog ids.",
    inputSchema: z.object({ message: z.string().min(1) }),
    execute: async () => ({ status: "working" }),
  }),
  recipe_planner: tool({
    description:
      "Suggest a recipe for a cuisine, occasion, or set of ingredients, and turn it into a shopping list of catalog products. Give it what the shopper wants to cook or has on hand.",
    inputSchema: z.object({ message: z.string().min(1) }),
    execute: async () => ({ status: "working" }),
  }),
} as const;

export type ToolCatalogName = keyof typeof TOOL_CATALOG;

export const SYSTEM_PROMPT =
  "You are Basket, a grocery-shopping agent. Pick exactly the tool(s) needed to satisfy the shopper's request. Do not explain your choice in prose — call the tool(s).";
