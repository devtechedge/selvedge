import type { Structure } from "./types";

// A weaving draft is four linked grids. Threading assigns each warp end to a
// shaft. Tie-up records which shafts each treadle raises. Treadling assigns each
// pick to a treadle. The drawdown is their product: a cell is true when the warp
// end is raised for that pick, so the warp shows on the cloth face.
export interface DraftGrids {
  shafts: number;
  treadles: number;
  ends: number;
  picks: number;
  threading: number[];
  tieUp: boolean[][];
  treadling: number[];
}

export interface ColorOrders {
  warpColors: string[];
  weftColors: string[];
}

export interface WeaveDimensions {
  settEpi: number;
  reedWidthCm: number;
  warpLengthCm: number;
  takeUpPct: number;
  shrinkagePct: number;
}

export type Drawdown = boolean[][];

export interface ClothCell {
  warpUp: boolean;
  color: string;
}

export interface WeavePlan {
  reedWidthIn: number;
  idealEnds: number;
  totalWarpCm: number;
  warpMeters: number;
  weftPerPickCm: number;
  totalWeftCm: number;
  weftMeters: number;
  totalYarnMeters: number;
  wovenLengthCm: number;
  finishedWidthCm: number;
  finishedLengthCm: number;
}

export const FLAX = "#e7dcc4";
export const INDIGO = "#2f4a6d";
export const MADDER = "#9e4034";
export const WELD = "#c9962e";
export const WALNUT = "#6b5844";
export const IRON = "#23201c";

export const DEFAULT_PALETTE = [FLAX, INDIGO, MADDER, WELD, WALNUT, IRON];

// drawdown[pick][end] = tieUp[treadling[pick]][threading[end]]
export function computeDrawdown(grids: DraftGrids): Drawdown {
  const { ends, picks, threading, tieUp, treadling } = grids;
  const rows: Drawdown = [];
  for (let p = 0; p < picks; p++) {
    const raised = tieUp[treadling[p]];
    const row: boolean[] = new Array(ends);
    for (let e = 0; e < ends; e++) {
      row[e] = raised[threading[e]];
    }
    rows.push(row);
  }
  return rows;
}

// The face shows the warp color where the warp is raised, otherwise the weft.
export function computeClothFace(drawdown: Drawdown, colors: ColorOrders): ClothCell[][] {
  return drawdown.map((row, p) =>
    row.map((warpUp, e) => ({
      warpUp,
      color: warpUp ? colors.warpColors[e] : colors.weftColors[p],
    }))
  );
}

export function plainWeave(ends: number, picks: number): DraftGrids {
  return {
    shafts: 2,
    treadles: 2,
    ends,
    picks,
    threading: Array.from({ length: ends }, (_, e) => e % 2),
    tieUp: [
      [true, false],
      [false, true],
    ],
    treadling: Array.from({ length: picks }, (_, p) => p % 2),
  };
}

// A balanced twill: treadle t raises a moving window of `up` adjacent shafts.
// up + down = shafts. The diagonal advances one end per pick.
export function twill(ends: number, picks: number, shafts = 4, up = 2): DraftGrids {
  const treadles = shafts;
  return {
    shafts,
    treadles,
    ends,
    picks,
    threading: Array.from({ length: ends }, (_, e) => e % shafts),
    tieUp: Array.from({ length: treadles }, (_, t) =>
      Array.from({ length: shafts }, (_, s) => (s - t + shafts) % shafts < up)
    ),
    treadling: Array.from({ length: picks }, (_, p) => p % treadles),
  };
}

// Warp-faced satin: each treadle lowers exactly one shaft, advancing by `step`
// (coprime to shafts). Each warp end binds once per repeat, so the face is a
// smooth warp float with a single scattered interlacement.
export function satin(ends: number, picks: number, shafts = 5, step = 2): DraftGrids {
  const treadles = shafts;
  return {
    shafts,
    treadles,
    ends,
    picks,
    threading: Array.from({ length: ends }, (_, e) => e % shafts),
    tieUp: Array.from({ length: treadles }, (_, t) => {
      const lowered = (t * step) % shafts;
      return Array.from({ length: shafts }, (_, s) => s !== lowered);
    }),
    treadling: Array.from({ length: picks }, (_, p) => p % treadles),
  };
}

// Basket weave: plain weave doubled into blocks in both directions.
export function basket(ends: number, picks: number, block = 2): DraftGrids {
  return {
    shafts: 2,
    treadles: 2,
    ends,
    picks,
    threading: Array.from({ length: ends }, (_, e) => Math.floor(e / block) % 2),
    tieUp: [
      [true, false],
      [false, true],
    ],
    treadling: Array.from({ length: picks }, (_, p) => Math.floor(p / block) % 2),
  };
}

function pointDraw(i: number, shafts: number): number {
  const period = 2 * (shafts - 1);
  const m = i % period;
  return m < shafts ? m : period - m;
}

// Herringbone: a 2/2 twill on a point draw, so the diagonal reverses into a
// chevron at each turning point.
export function herringbone(ends: number, picks: number, shafts = 4): DraftGrids {
  const base = twill(ends, picks, shafts, 2);
  return {
    ...base,
    threading: Array.from({ length: ends }, (_, e) => pointDraw(e, shafts)),
  };
}

// Waffle: a point draw in both threading and treadling over a moving window
// tie-up, opening a diamond lattice of cells.
export function waffle(ends: number, picks: number, shafts = 5): DraftGrids {
  const treadles = shafts;
  const up = 2;
  return {
    shafts,
    treadles,
    ends,
    picks,
    threading: Array.from({ length: ends }, (_, e) => pointDraw(e, shafts)),
    tieUp: Array.from({ length: treadles }, (_, t) =>
      Array.from({ length: shafts }, (_, s) => (s - t + shafts) % shafts < up)
    ),
    treadling: Array.from({ length: picks }, (_, p) => pointDraw(p, shafts)),
  };
}

export function structureByName(name: Structure, ends: number, picks: number): DraftGrids {
  switch (name) {
    case "plain":
      return plainWeave(ends, picks);
    case "twill22":
      return twill(ends, picks, 4, 2);
    case "twill31":
      return twill(ends, picks, 4, 3);
    case "satin5":
      return satin(ends, picks, 5, 2);
    case "basket":
      return basket(ends, picks, 2);
    case "herringbone":
      return herringbone(ends, picks, 4);
    case "waffle":
      return waffle(ends, picks, 5);
  }
}

export function mirrorTreadling(grids: DraftGrids): DraftGrids {
  return { ...grids, treadling: [...grids.treadling].reverse() };
}

export function reverseWarp(grids: DraftGrids): DraftGrids {
  return { ...grids, threading: [...grids.threading].reverse() };
}

export function defaultColorOrders(ends: number, picks: number): ColorOrders {
  return {
    warpColors: Array.from({ length: ends }, (_, e) => (e % 2 === 0 ? FLAX : INDIGO)),
    weftColors: Array.from({ length: picks }, () => MADDER),
  };
}

export function computeWeavePlan(
  grids: Pick<DraftGrids, "ends" | "picks">,
  dims: WeaveDimensions
): WeavePlan {
  const reedWidthIn = dims.reedWidthCm / 2.54;
  const idealEnds = Math.round(dims.settEpi * reedWidthIn);
  const totalWarpCm = grids.ends * dims.warpLengthCm;
  const warpMeters = Math.ceil(totalWarpCm / 100);
  // Integer-percent math (multiply before divide) keeps the engine deterministic
  // and free of binary floating-point drift like 50 * 1.1 = 55.00000000000001.
  const weftPerPickCm = (dims.reedWidthCm * (100 + dims.takeUpPct)) / 100;
  const totalWeftCm = grids.picks * weftPerPickCm;
  const weftMeters = Math.ceil(totalWeftCm / 100);
  const wovenLengthCm = (grids.picks * 254) / (dims.settEpi * 100);
  const widthAfterTakeUp = (dims.reedWidthCm * (100 - dims.takeUpPct)) / 100;
  const finishedWidthCm = Math.round((widthAfterTakeUp * (100 - dims.shrinkagePct)) / 100);
  const finishedLengthCm = Math.round((wovenLengthCm * (100 - dims.shrinkagePct)) / 100);
  return {
    reedWidthIn,
    idealEnds,
    totalWarpCm,
    warpMeters,
    weftPerPickCm,
    totalWeftCm,
    weftMeters,
    totalYarnMeters: warpMeters + weftMeters,
    wovenLengthCm,
    finishedWidthCm,
    finishedLengthCm,
  };
}

export interface GridIssue {
  field: string;
  message: string;
}

export function validateGrids(grids: DraftGrids): GridIssue[] {
  const issues: GridIssue[] = [];
  const { shafts, treadles, ends, picks, threading, tieUp, treadling } = grids;
  if (shafts < 2 || shafts > 32) issues.push({ field: "shafts", message: "Shafts must be between 2 and 32." });
  if (treadles < 1 || treadles > 64) issues.push({ field: "treadles", message: "Treadles must be between 1 and 64." });
  if (ends < 1 || ends > 2000) issues.push({ field: "ends", message: "Warp ends must be between 1 and 2000." });
  if (picks < 1 || picks > 4000) issues.push({ field: "picks", message: "Weft picks must be between 1 and 4000." });
  if (threading.length !== ends) issues.push({ field: "threading", message: "Threading must cover every warp end." });
  if (treadling.length !== picks) issues.push({ field: "treadling", message: "Treadling must cover every pick." });
  if (tieUp.length !== treadles) issues.push({ field: "tieUp", message: "Tie-up must have one row per treadle." });
  threading.forEach((shaft, e) => {
    if (!Number.isInteger(shaft) || shaft < 0 || shaft >= shafts) {
      issues.push({ field: "threading", message: `End ${e + 1} references shaft ${shaft}, outside 1-${shafts}.` });
    }
  });
  treadling.forEach((treadle, p) => {
    if (!Number.isInteger(treadle) || treadle < 0 || treadle >= treadles) {
      issues.push({ field: "treadling", message: `Pick ${p + 1} references treadle ${treadle}, outside 1-${treadles}.` });
    }
  });
  tieUp.forEach((row, t) => {
    if (!Array.isArray(row) || row.length !== shafts) {
      issues.push({ field: "tieUp", message: `Treadle ${t + 1} must list one cell per shaft.` });
    }
  });
  return issues;
}

// A loom can only dress a draft when it has enough shafts and treadles.
export function loomCanDress(
  loom: { shafts: number; treadles: number },
  grids: Pick<DraftGrids, "shafts" | "treadles">
): boolean {
  return loom.shafts >= grids.shafts && loom.treadles >= grids.treadles;
}