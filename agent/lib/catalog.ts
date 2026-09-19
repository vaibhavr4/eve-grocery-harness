// Mock grocery backend for local experimentation. Everything here is an
// in-memory placeholder: it resets whenever the eve dev server restarts and
// is not shared across sessions in any durable way.

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly unit: string;
  readonly priceUsd: number;
  readonly store: string;
  readonly inStock: boolean;
}

export const CATALOG: readonly Product[] = [
  { id: "p_milk_wh", name: "Whole Milk", category: "dairy", unit: "1 gal", priceUsd: 4.29, store: "Harvest Market", inStock: true },
  { id: "p_milk_ov", name: "Whole Milk", category: "dairy", unit: "1 gal", priceUsd: 3.99, store: "Overton Grocer", inStock: true },
  { id: "p_eggs_wh", name: "Large Eggs", category: "dairy", unit: "dozen", priceUsd: 3.49, store: "Harvest Market", inStock: true },
  { id: "p_eggs_ov", name: "Large Eggs", category: "dairy", unit: "dozen", priceUsd: 3.79, store: "Overton Grocer", inStock: true },
  { id: "p_bread_wh", name: "Sourdough Bread", category: "bakery", unit: "1 loaf", priceUsd: 5.49, store: "Harvest Market", inStock: true },
  { id: "p_bread_ov", name: "Sourdough Bread", category: "bakery", unit: "1 loaf", priceUsd: 4.99, store: "Overton Grocer", inStock: false },
  { id: "p_chicken_wh", name: "Chicken Breast", category: "meat", unit: "1 lb", priceUsd: 6.99, store: "Harvest Market", inStock: true },
  { id: "p_chicken_ov", name: "Chicken Breast", category: "meat", unit: "1 lb", priceUsd: 6.49, store: "Overton Grocer", inStock: true },
  { id: "p_pasta_wh", name: "Spaghetti", category: "pantry", unit: "1 lb box", priceUsd: 1.99, store: "Harvest Market", inStock: true },
  { id: "p_pasta_ov", name: "Spaghetti", category: "pantry", unit: "1 lb box", priceUsd: 2.19, store: "Overton Grocer", inStock: true },
  { id: "p_tomato_wh", name: "Canned Tomatoes", category: "pantry", unit: "28 oz can", priceUsd: 2.49, store: "Harvest Market", inStock: true },
  { id: "p_tomato_ov", name: "Canned Tomatoes", category: "pantry", unit: "28 oz can", priceUsd: 2.29, store: "Overton Grocer", inStock: true },
  { id: "p_parm_wh", name: "Parmesan Cheese", category: "dairy", unit: "8 oz", priceUsd: 6.29, store: "Harvest Market", inStock: true },
  { id: "p_basil_wh", name: "Fresh Basil", category: "produce", unit: "1 bunch", priceUsd: 2.99, store: "Harvest Market", inStock: true },
  { id: "p_onion_wh", name: "Yellow Onion", category: "produce", unit: "1 lb", priceUsd: 1.29, store: "Harvest Market", inStock: true },
  { id: "p_garlic_wh", name: "Garlic", category: "produce", unit: "3 ct", priceUsd: 1.49, store: "Harvest Market", inStock: true },
];

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface OrderRecord {
  readonly id: string;
  readonly lines: readonly CartLine[];
  readonly totalUsd: number;
  status: "placed" | "paid" | "cancelled" | "refunded";
  readonly createdAt: string;
}

// Process-lifetime mock state. Fine for a local single-process dev harness;
// swap for a real store before this ever needs to survive a restart or
// serve more than one session at a time.
export const CART: CartLine[] = [];
export const ORDERS: OrderRecord[] = [];

export function findProduct(productId: string): Product | undefined {
  return CATALOG.find((product) => product.id === productId);
}

export function searchCatalog(query: string): Product[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return [...CATALOG];
  return CATALOG.filter(
    (product) =>
      product.name.toLowerCase().includes(needle) || product.category.toLowerCase().includes(needle),
  );
}

export function cartTotalUsd(): number {
  return CART.reduce((sum, line) => {
    const product = findProduct(line.productId);
    return sum + (product ? product.priceUsd * line.quantity : 0);
  }, 0);
}

export function nextOrderId(): string {
  return `ord_${(ORDERS.length + 1).toString().padStart(4, "0")}`;
}
