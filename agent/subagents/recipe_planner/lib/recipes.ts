export interface Recipe {
  readonly name: string;
  readonly cuisine: string;
  readonly keywords: readonly string[];
  readonly method: string;
  readonly ingredients: readonly string[];
}

export const RECIPES: readonly Recipe[] = [
  {
    name: "Simple Tomato Spaghetti",
    cuisine: "italian",
    keywords: ["pasta", "spaghetti", "tomato", "italian", "weeknight"],
    method:
      "Saute garlic and onion, add canned tomatoes and simmer 15 min, toss with cooked spaghetti, finish with basil and parmesan.",
    ingredients: ["Spaghetti", "Canned Tomatoes", "Garlic", "Yellow Onion", "Fresh Basil", "Parmesan Cheese"],
  },
  {
    name: "Weeknight Roast Chicken",
    cuisine: "american",
    keywords: ["chicken", "roast", "protein", "dinner"],
    method: "Season chicken breast, sear, then roast with onion and garlic until cooked through.",
    ingredients: ["Chicken Breast", "Yellow Onion", "Garlic"],
  },
  {
    name: "Classic French Toast",
    cuisine: "breakfast",
    keywords: ["breakfast", "egg", "bread", "sweet"],
    method: "Whisk eggs and milk, soak bread slices, pan-fry until golden on both sides.",
    ingredients: ["Sourdough Bread", "Large Eggs", "Whole Milk"],
  },
];
