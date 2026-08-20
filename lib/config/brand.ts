// ─────────────────────────────────────────────────────────────
// BRAND SETTINGS — this is the file to edit in Module 4.
// Change a value, save, and the whole app updates. Safe to edit:
// nothing here touches the database, auth, or dependencies.
// ─────────────────────────────────────────────────────────────
export const brand = {
  /** The restaurant's name — shown in the header, homepage and browser tab. */
  name: "FoodFat",

  /** One-line tagline shown under the name on the homepage. */
  tagline: "Good food, one tap away.",

  /** Main accent color (any CSS color, e.g. "#ea580c" or "rebeccapurple"). */
  primaryColor: "#ea580c",

  /** Logo image in /public — swap the file or point to a new one. */
  logo: "/logo.svg",

  /** Currency used to print every price (any ISO code, e.g. "MYR", "SGD", "USD"). */
  currency: "MYR",

  /** Toggle feature: show the workshop badge on the homepage. */
  showWorkshopBadge: true,
};
