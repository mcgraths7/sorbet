// Stand-in for whatever the real API would return. Kept in one place so the
// sections read as UI composition rather than data plumbing.

export interface Order {
  id: string;
  customer: string;
  plan: "Taster" | "Regular" | "Full house";
  meals: number;
  status: "Packing" | "Out for delivery" | "Delivered" | "Failed";
  total: number;
  placed: string;
}

export const ORDERS: Order[] = [
  { id: "SPR-4821", customer: "Priya Raman", plan: "Regular", meals: 4, status: "Out for delivery", total: 69, placed: "2026-07-29" },
  { id: "SPR-4822", customer: "Marcus Owens", plan: "Taster", meals: 2, status: "Delivered", total: 29.99, placed: "2026-07-29" },
  { id: "SPR-4823", customer: "Hannah Webb", plan: "Full house", meals: 5, status: "Packing", total: 148.5, placed: "2026-07-30" },
  { id: "SPR-4824", customer: "Dee Lawson", plan: "Regular", meals: 3, status: "Failed", total: 51.75, placed: "2026-07-30" },
  { id: "SPR-4825", customer: "Tom Ashby", plan: "Regular", meals: 4, status: "Delivered", total: 69, placed: "2026-07-28" },
  { id: "SPR-4826", customer: "Sofia Marín", plan: "Full house", meals: 5, status: "Out for delivery", total: 148.5, placed: "2026-07-30" },
  { id: "SPR-4827", customer: "Idris Bello", plan: "Taster", meals: 2, status: "Packing", total: 29.99, placed: "2026-07-30" },
];

export const STATUS_TONE = {
  Packing: "warning",
  "Out for delivery": "info",
  Delivered: "success",
  Failed: "danger",
} as const;

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const ORDERS_BY_DAY = [
  { label: "This week", data: [412, 468, 501, 623, 588, 402, 356] },
  { label: "Last week", data: [388, 441, 486, 590, 552, 381, 340] },
];

export const REVENUE_BY_PLAN = [
  { label: "Taster", data: [4.1, 4.4, 4.2, 4.8] },
  { label: "Regular", data: [18.2, 19.4, 21.0, 22.6] },
  { label: "Full house", data: [9.4, 10.1, 10.8, 12.2] },
];

export const MEAL_POPULARITY = [
  { label: "Miso butter ramen", value: 1840 },
  { label: "Chipotle tacos", value: 1610 },
  { label: "Halloumi bowl", value: 1395 },
  { label: "Nduja rigatoni", value: 1120 },
  { label: "Coconut dal", value: 980 },
  { label: "Miso salmon", value: 870 },
  { label: "Katsu curry", value: 640 },
];

export const ORDER_SPARK = [356, 402, 412, 468, 501, 588, 623];
export const REVENUE_SPARK = [31.7, 33.9, 34.1, 36.0, 38.2, 39.5, 41.8];
export const CHURN_SPARK = [2.4, 2.3, 2.4, 2.2, 2.0, 1.9, 1.9];

/** Today's kitchen lines and how far through packing they are. */
export const FULFILMENT = [
  { line: "Line A — ramen & noodles", done: 412, total: 480 },
  { line: "Line B — grains & bowls", done: 268, total: 400 },
  { line: "Line C — pasta", done: 355, total: 360 },
  { line: "Line D — curry & dal", done: 96, total: 320 },
];

export const LOW_STOCK = [
  { item: "Halloumi (200g)", supplier: "Kentish Dairy", onHand: 84, needed: 320 },
  { item: "Nduja (80g)", supplier: "Borough Cured", onHand: 140, needed: 260 },
  { item: "Coriander (bunch)", supplier: "Vale Growers", onHand: 210, needed: 540 },
];

export const FEEDBACK = [
  { id: "f1", meal: "Miso butter ramen", rating: 5, note: "Broth was unreal. Kids asked for it again.", who: "Priya R." },
  { id: "f2", meal: "Nduja rigatoni", rating: 3.5, note: "Good but far too salty for us.", who: "Tom A." },
  { id: "f3", meal: "Chipotle tacos", rating: 4.5, note: "Fast and genuinely 15 minutes.", who: "Dee L." },
];
