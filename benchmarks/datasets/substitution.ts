// Simulated data for the "item out of stock, find the best network-wide
// substitute" benchmark. Everything here is synthetic and deterministic
// (seeded PRNG) — it models the SHAPE of a real assortment/demand-transfer
// problem, not real sales history. Regenerate by changing SEED.

// ---------- seeded RNG (mulberry32) ----------
function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SEED = 20260921;
const rand = mulberry32(SEED);
function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}
function weightedPick<T>(items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((sum, [, w]) => sum + w, 0);
  let r = rand() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r <= 0) return item;
  }
  return items[items.length - 1][0];
}

// ---------- stores ----------
export type Region = "Northeast" | "Southeast" | "Midwest" | "West";
export type Format = "urban-small" | "suburban-large" | "rural";
export type BannerTier = "premium" | "mainstream" | "value";

export interface Store {
  readonly storeId: string;
  readonly region: Region;
  readonly format: Format;
  readonly bannerTier: BannerTier;
}

const REGIONS: readonly Region[] = ["Northeast", "Southeast", "Midwest", "West"];
const FORMATS: readonly (readonly [Format, number])[] = [
  ["urban-small", 0.3],
  ["suburban-large", 0.45],
  ["rural", 0.25],
];
const BANNER_TIERS: readonly (readonly [BannerTier, number])[] = [
  ["premium", 0.25],
  ["mainstream", 0.5],
  ["value", 0.25],
];

export const STORE_COUNT = 500;

export const STORES: readonly Store[] = Array.from({ length: STORE_COUNT }, (_, i) => ({
  storeId: `st_${String(i + 1).padStart(4, "0")}`,
  region: pick(REGIONS),
  format: weightedPick(FORMATS),
  bannerTier: weightedPick(BANNER_TIERS),
}));

export interface Segment {
  readonly format: Format;
  readonly bannerTier: BannerTier;
}

export function segmentStores(segment: Segment): readonly Store[] {
  return STORES.filter((s) => s.format === segment.format && s.bannerTier === segment.bannerTier);
}

// ---------- the out-of-stock item ----------
export interface EggItem {
  readonly id: string;
  readonly name: string;
  readonly brand: string;
  readonly organic: boolean;
  readonly cageFree: boolean;
  readonly pastureRaised: boolean;
  readonly priceUsd: number;
  readonly packSize: "6ct" | "dozen" | "18ct";
  readonly local: boolean;
  readonly avgWeeklyUnitsPerStore: number;
  readonly supplyRiskFlag: boolean;
}

export const OOS_ITEM: EggItem = {
  id: "egg_vof_dozen",
  name: "Vital Organic Farms Eggs",
  brand: "Vital Organic Farms",
  organic: true,
  cageFree: true,
  pastureRaised: true,
  priceUsd: 6.99,
  packSize: "dozen",
  local: false,
  avgWeeklyUnitsPerStore: 42,
  supplyRiskFlag: true, // the vendor issue that triggered this whole exercise
};

// ---------- candidate replacements ----------
export const CANDIDATES: readonly EggItem[] = [
  { id: "egg_c01", name: "Happy Hen Organic Dozen", brand: "Happy Hen", organic: true, cageFree: true, pastureRaised: true, priceUsd: 7.29, packSize: "dozen", local: false, avgWeeklyUnitsPerStore: 38, supplyRiskFlag: false },
  { id: "egg_c02", name: "Meadowbrook Pasture Raised Dozen", brand: "Meadowbrook", organic: true, cageFree: true, pastureRaised: true, priceUsd: 6.79, packSize: "dozen", local: false, avgWeeklyUnitsPerStore: 45, supplyRiskFlag: false },
  { id: "egg_c03", name: "Sunridge Organic Dozen", brand: "Sunridge", organic: true, cageFree: true, pastureRaised: false, priceUsd: 5.99, packSize: "dozen", local: false, avgWeeklyUnitsPerStore: 51, supplyRiskFlag: false },
  { id: "egg_c04", name: "ValueFarms Cage-Free Dozen", brand: "ValueFarms", organic: false, cageFree: true, pastureRaised: false, priceUsd: 3.49, packSize: "dozen", local: false, avgWeeklyUnitsPerStore: 88, supplyRiskFlag: false },
  { id: "egg_c05", name: "ClassicFarms Large Dozen", brand: "ClassicFarms", organic: false, cageFree: false, pastureRaised: false, priceUsd: 2.79, packSize: "dozen", local: false, avgWeeklyUnitsPerStore: 110, supplyRiskFlag: false },
  { id: "egg_c06", name: "Green Pastures Organic 18ct", brand: "Green Pastures", organic: true, cageFree: true, pastureRaised: true, priceUsd: 9.49, packSize: "18ct", local: false, avgWeeklyUnitsPerStore: 22, supplyRiskFlag: false },
  { id: "egg_c07", name: "Little Barn Local Organic Dozen", brand: "Little Barn Farm", organic: true, cageFree: true, pastureRaised: true, priceUsd: 7.49, packSize: "dozen", local: true, avgWeeklyUnitsPerStore: 9, supplyRiskFlag: false },
  { id: "egg_c08", name: "Nature's Best Cage-Free Dozen", brand: "Nature's Best", organic: false, cageFree: true, pastureRaised: false, priceUsd: 4.29, packSize: "dozen", local: false, avgWeeklyUnitsPerStore: 76, supplyRiskFlag: false },
  { id: "egg_c09", name: "Rolling Hills Organic 6ct", brand: "Rolling Hills", organic: true, cageFree: true, pastureRaised: true, priceUsd: 4.49, packSize: "6ct", local: false, avgWeeklyUnitsPerStore: 31, supplyRiskFlag: false },
  { id: "egg_c10", name: "PrairieGold Organic Dozen", brand: "PrairieGold", organic: true, cageFree: true, pastureRaised: false, priceUsd: 6.49, packSize: "dozen", local: false, avgWeeklyUnitsPerStore: 47, supplyRiskFlag: true },
  { id: "egg_c11", name: "Harvest Coop Pasture Dozen", brand: "Harvest Coop", organic: true, cageFree: true, pastureRaised: true, priceUsd: 6.99, packSize: "dozen", local: false, avgWeeklyUnitsPerStore: 40, supplyRiskFlag: false },
  { id: "egg_c12", name: "Everyday Basics Dozen", brand: "Everyday Basics", organic: false, cageFree: false, pastureRaised: false, priceUsd: 2.29, packSize: "dozen", local: false, avgWeeklyUnitsPerStore: 130, supplyRiskFlag: false },
  { id: "egg_c13", name: "Blue Sky Organic Free-Range Dozen", brand: "Blue Sky Farms", organic: true, cageFree: true, pastureRaised: false, priceUsd: 6.29, packSize: "dozen", local: false, avgWeeklyUnitsPerStore: 49, supplyRiskFlag: false },
  { id: "egg_c14", name: "Fieldstone Organic Dozen", brand: "Fieldstone", organic: true, cageFree: true, pastureRaised: true, priceUsd: 8.99, packSize: "dozen", local: false, avgWeeklyUnitsPerStore: 18, supplyRiskFlag: false },
];

// ---------- similarity / demand-transfer simulation ----------
export interface SegmentWeights {
  readonly organic: number;
  readonly pastureRaised: number;
  readonly price: number;
  readonly packSize: number;
  readonly local: number;
  readonly scale: number; // rewards supply capacity (avgWeeklyUnitsPerStore)
  readonly riskPenalty: number;
}

// Premium/urban shoppers over-index on organic+pasture attributes and are
// less price-sensitive; value/rural shoppers over-index on price and need
// the substitute to actually be available at scale.
// `scale` carries real weight here — a candidate that a small local farm
// supplies at single-digit units/store/week cannot actually replace demand
// across a large chain, however well it matches on attributes. Without this,
// the rubric would reward attribute-perfect but supply-infeasible picks.
export function segmentWeights(segment: Segment): SegmentWeights {
  const premiumLean = segment.bannerTier === "premium" ? 1 : segment.bannerTier === "value" ? -1 : 0;
  const ruralLean = segment.format === "rural" ? 1 : 0;
  return {
    organic: 0.24 + premiumLean * 0.07,
    pastureRaised: 0.12 + premiumLean * 0.04,
    price: 0.18 - premiumLean * 0.06 + ruralLean * 0.04,
    packSize: 0.1,
    local: 0.04 - ruralLean * 0.015,
    scale: 0.22 + ruralLean * 0.04,
    riskPenalty: 0.35,
  };
}

export const NETWORK_WEIGHTS: SegmentWeights = {
  organic: 0.24,
  pastureRaised: 0.12,
  price: 0.18,
  packSize: 0.1,
  local: 0.04,
  scale: 0.22,
  riskPenalty: 0.35,
};

function priceProximity(candidate: EggItem, oos: EggItem): number {
  const diff = Math.abs(candidate.priceUsd - oos.priceUsd);
  return Math.max(0, 1 - diff / oos.priceUsd);
}

function packSizeMatch(candidate: EggItem, oos: EggItem): number {
  if (candidate.packSize === oos.packSize) return 1;
  const rank: Record<EggItem["packSize"], number> = { "6ct": 6, dozen: 12, "18ct": 18 };
  return Math.max(0, 1 - Math.abs(rank[candidate.packSize] - rank[oos.packSize]) / 12);
}

export interface CandidateScore {
  readonly candidate: EggItem;
  readonly score: number;
  readonly demandTransferRate: number;
  readonly breakdown: Record<string, number>;
}

/** The ground-truth rubric. Deterministic — no LLM involved. */
export function scoreCandidates(
  candidates: readonly EggItem[],
  weights: SegmentWeights,
  oos: EggItem = OOS_ITEM,
): CandidateScore[] {
  const maxScale = Math.max(...candidates.map((c) => c.avgWeeklyUnitsPerStore));
  const raw = candidates.map((candidate) => {
    const organicMatch = candidate.organic === oos.organic ? 1 : 0;
    const pastureMatch = candidate.pastureRaised === oos.pastureRaised ? 1 : 0.3;
    const price = priceProximity(candidate, oos);
    const pack = packSizeMatch(candidate, oos);
    const local = candidate.local ? 1 : 0;
    const scale = candidate.avgWeeklyUnitsPerStore / maxScale;
    const risk = candidate.supplyRiskFlag ? 1 : 0;

    const breakdown = {
      organicMatch: organicMatch * weights.organic,
      pastureMatch: pastureMatch * weights.pastureRaised,
      priceProximity: price * weights.price,
      packSizeMatch: pack * weights.packSize,
      localBonus: local * weights.local,
      scaleFit: scale * weights.scale,
      riskPenalty: -risk * weights.riskPenalty,
    };
    const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

    // Demand-transfer rate: softmax-style, seeded noise layered on similarity
    // so it reads as "simulated historical substitution behavior" rather than
    // a pure re-statement of the score above.
    const noise = 0.9 + rand() * 0.2;
    const affinity = (organicMatch * 0.4 + pastureMatch * 0.2 + price * 0.3 + pack * 0.1) * noise;

    return { candidate, score, affinity, breakdown };
  });

  const affinitySum = raw.reduce((sum, r) => sum + r.affinity, 0);
  return raw
    .map((r) => ({
      candidate: r.candidate,
      score: Number(r.score.toFixed(4)),
      demandTransferRate: Number((r.affinity / affinitySum).toFixed(4)),
      breakdown: r.breakdown,
    }))
    .sort((a, b) => b.score - a.score);
}

// ---------- test cases ----------
export type SubstitutionTier = "network" | "segment" | "edge";

export interface SubstitutionCase {
  readonly id: string;
  readonly tier: SubstitutionTier;
  readonly label: string;
  readonly segment?: Segment;
  readonly storeCount: number;
  readonly candidates: readonly EggItem[];
  readonly weights: SegmentWeights;
  readonly ranking: readonly CandidateScore[];
  readonly idealItemId: string;
  readonly note: string;
}

function buildCase(
  id: string,
  tier: SubstitutionTier,
  label: string,
  note: string,
  candidates: readonly EggItem[],
  weights: SegmentWeights,
  segment?: Segment,
): SubstitutionCase {
  const ranking = scoreCandidates(candidates, weights);
  const storeCount = segment ? segmentStores(segment).length : STORE_COUNT;
  return {
    id,
    tier,
    label,
    segment,
    storeCount,
    candidates,
    weights,
    ranking,
    idealItemId: ranking[0].candidate.id,
    note,
  };
}

const ALL_SEGMENT_COMBOS: readonly Segment[] = FORMATS.flatMap(([format]) =>
  BANNER_TIERS.map(([bannerTier]) => ({ format, bannerTier })),
);

const CORE_SUBSTITUTION_CASES: readonly SubstitutionCase[] = [
  // Tier A — network level
  buildCase(
    "sub_network",
    "network",
    "Network-wide replacement (all 500 stores)",
    "Aggregate replacement decision across the full chain, using network-average shopper preferences.",
    CANDIDATES,
    NETWORK_WEIGHTS,
  ),

  // Tier B — every format x banner-tier segment (9 cases)
  ...ALL_SEGMENT_COMBOS.map((segment, i) =>
    buildCase(
      `sub_segment_${i + 1}`,
      "segment",
      `${segment.bannerTier} / ${segment.format}`,
      `Segment-specific replacement: ${segment.bannerTier} banner, ${segment.format} format store.`,
      CANDIDATES,
      segmentWeights(segment),
      segment,
    ),
  ),

  // Tier C — edge cases with deliberately conflicting signals
  buildCase(
    "sub_edge_topscorer_at_risk",
    "edge",
    "Top attribute-match candidate also has a supply-risk flag",
    "Among this narrowed set, egg_c10 (PrairieGold) is the strongest attribute match — but it carries its own supplyRiskFlag (another vendor with availability issues). The rubric should route around it to the next-best stable option, egg_c13, rather than repeat the same mistake that caused this whole exercise.",
    CANDIDATES.filter((c) => ["egg_c10", "egg_c13", "egg_c04", "egg_c12"].includes(c.id)),
    NETWORK_WEIGHTS,
  ),
  buildCase(
    "sub_edge_small_pack",
    "edge",
    "Cheapest organic option is a much smaller pack size",
    "egg_c09 (Rolling Hills, 6ct) is organic and pasture-raised at a low price, but half the pack size of the dozen shoppers expect — tests whether models over-weight price/organic and ignore the pack-size mismatch.",
    CANDIDATES.filter((c) => ["egg_c02", "egg_c03", "egg_c09", "egg_c13"].includes(c.id)),
    NETWORK_WEIGHTS,
  ),
  buildCase(
    "sub_edge_transfer_vs_organic",
    "edge",
    "Highest historical demand-transfer candidate isn't organic",
    "In a premium-organic segment, ValueFarms (egg_c04) has the highest raw historical demand-transfer rate but is not organic — tests whether models correctly weigh segment fit over a raw transfer-rate number.",
    CANDIDATES.filter((c) => ["egg_c02", "egg_c04", "egg_c08", "egg_c13"].includes(c.id)),
    segmentWeights({ format: "urban-small", bannerTier: "premium" }),
    { format: "urban-small", bannerTier: "premium" },
  ),
  buildCase(
    "sub_edge_near_tie",
    "edge",
    "Two candidates in a near statistical tie",
    "egg_c02 and egg_c11 score within a hair of each other — tests whether the model's stated rationale actually engages with the tiebreaker (price) rather than picking arbitrarily.",
    CANDIDATES.filter((c) => ["egg_c02", "egg_c11"].includes(c.id)),
    NETWORK_WEIGHTS,
  ),
];

export function renderSubstitutionPrompt(testCase: SubstitutionCase): string {
  const demandById = new Map(testCase.ranking.map((r) => [r.candidate.id, r.demandTransferRate]));
  const candidatesText = [...testCase.candidates]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((c) => {
      const transfer = demandById.get(c.id) ?? 0;
      return [
        `- id: ${c.id}`,
        `  name: ${c.name}`,
        `  brand: ${c.brand}`,
        `  organic: ${c.organic}`,
        `  cageFree: ${c.cageFree}`,
        `  pastureRaised: ${c.pastureRaised}`,
        `  priceUsd: ${c.priceUsd}`,
        `  packSize: ${c.packSize}`,
        `  localFarm: ${c.local}`,
        `  avgWeeklyUnitsPerStore: ${c.avgWeeklyUnitsPerStore}`,
        `  supplyRiskFlag: ${c.supplyRiskFlag}`,
        `  simulatedHistoricalDemandTransferRate: ${transfer}`,
      ].join("\n");
    })
    .join("\n");

  const scopeLine =
    testCase.tier === "network"
      ? `This is a network-wide decision covering all ${testCase.storeCount} stores.`
      : testCase.segment
        ? `This decision is scoped to the "${testCase.segment.bannerTier} / ${testCase.segment.format}" store segment (${testCase.storeCount} stores of this type).`
        : `This is a targeted evaluation among ${testCase.candidates.length} candidates.`;

  return `A grocery chain's item "${OOS_ITEM.name}" (id: ${OOS_ITEM.id}) just went out of stock across the board due to a vendor supply issue. It was assigned to ${STORE_COUNT} stores network-wide.

Out-of-stock item attributes:
- brand: ${OOS_ITEM.brand}
- organic: ${OOS_ITEM.organic}
- cageFree: ${OOS_ITEM.cageFree}
- pastureRaised: ${OOS_ITEM.pastureRaised}
- priceUsd: ${OOS_ITEM.priceUsd}
- packSize: ${OOS_ITEM.packSize}

${scopeLine}

Candidate replacement items (attributes, plus a simulated historical demand-transfer rate — the share of demand that shifted to that item in past out-of-stock events like this one):
${candidatesText}

Pick the single best replacement item for this scope. Weigh organic match, pasture-raised match, price proximity, pack-size fit, local-farm considerations, the candidate's own supply-risk flag, whether it can realistically supply demand at this scale (avgWeeklyUnitsPerStore), and the demand-transfer signal. Respond with the candidate's id and a short rationale.`;
}

const EDGE_CASES_TAIL: readonly SubstitutionCase[] = [
  buildCase(
    "sub_edge_limited_scale",
    "edge",
    "Best attribute match can't supply the chain at scale",
    "egg_c07 (Little Barn Farm) matches on every attribute but has by far the lowest avgWeeklyUnitsPerStore of any candidate — a small local farm that cannot realistically supply hundreds of stores. Tests whether models consider supply feasibility, not just attribute similarity.",
    CANDIDATES.filter((c) => ["egg_c01", "egg_c02", "egg_c07", "egg_c11"].includes(c.id)),
    NETWORK_WEIGHTS,
  ),
];

export const SUBSTITUTION_CASES: readonly SubstitutionCase[] = [...CORE_SUBSTITUTION_CASES, ...EDGE_CASES_TAIL];
