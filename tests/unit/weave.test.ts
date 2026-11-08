import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  basket,
  computeClothFace,
  computeDrawdown,
  computeWeavePlan,
  defaultColorOrders,
  herringbone,
  loomCanDress,
  mirrorTreadling,
  plainWeave,
  reverseWarp,
  satin,
  structureByName,
  twill,
  validateGrids,
  waffle,
  MADDER,
  WELD,
  type DraftGrids,
} from "@/domain/weave";
import { STRUCTURES } from "@/domain/types";

// An arbitrary valid draft: every threading end lands on a real shaft, every
// pick on a real treadle, and the tie-up has one boolean row per treadle.
const validGrids: fc.Arbitrary<DraftGrids> = fc
  .record({
    shafts: fc.integer({ min: 2, max: 8 }),
    treadles: fc.integer({ min: 1, max: 8 }),
    ends: fc.integer({ min: 1, max: 40 }),
    picks: fc.integer({ min: 1, max: 40 }),
  })
  .chain(({ shafts, treadles, ends, picks }) =>
    fc.record({
      shafts: fc.constant(shafts),
      treadles: fc.constant(treadles),
      ends: fc.constant(ends),
      picks: fc.constant(picks),
      threading: fc.array(fc.integer({ min: 0, max: shafts - 1 }), {
        minLength: ends,
        maxLength: ends,
      }),
      treadling: fc.array(fc.integer({ min: 0, max: treadles - 1 }), {
        minLength: picks,
        maxLength: picks,
      }),
      tieUp: fc.array(fc.array(fc.boolean(), { minLength: shafts, maxLength: shafts }), {
        minLength: treadles,
        maxLength: treadles,
      }),
    })
  );

describe("drawdown properties", () => {
  it("has one row per pick and one cell per end", () => {
    fc.assert(
      fc.property(validGrids, (g) => {
        const dd = computeDrawdown(g);
        expect(dd.length).toBe(g.picks);
        dd.forEach((row) => expect(row.length).toBe(g.ends));
      })
    );
  });

  it("mirroring the treadling mirrors the cloth top to bottom", () => {
    fc.assert(
      fc.property(validGrids, (g) => {
        const original = computeDrawdown(g);
        const mirrored = computeDrawdown(mirrorTreadling(g));
        for (let p = 0; p < g.picks; p++) {
          expect(mirrored[p]).toEqual(original[g.picks - 1 - p]);
        }
      })
    );
  });

  it("reversing the warp order reverses the cloth face left to right", () => {
    fc.assert(
      fc.property(validGrids, (g) => {
        const original = computeDrawdown(g);
        const reversed = computeDrawdown(reverseWarp(g));
        for (let p = 0; p < g.picks; p++) {
          for (let e = 0; e < g.ends; e++) {
            expect(reversed[p][e]).toBe(original[p][g.ends - 1 - e]);
          }
        }
      })
    );
  });

  it("shows the warp color where raised and the weft color otherwise", () => {
    fc.assert(
      fc.property(validGrids, (g) => {
        const colors = {
          warpColors: Array.from({ length: g.ends }, (_, i) => `#${i.toString(16).padStart(6, "0")}`),
          weftColors: Array.from({ length: g.picks }, (_, i) => `weft-${i}`),
        };
        const dd = computeDrawdown(g);
        const face = computeClothFace(dd, colors);
        for (let p = 0; p < g.picks; p++) {
          for (let e = 0; e < g.ends; e++) {
            expect(face[p][e].warpUp).toBe(dd[p][e]);
            expect(face[p][e].color).toBe(dd[p][e] ? colors.warpColors[e] : colors.weftColors[p]);
          }
        }
      })
    );
  });

  it("accepts every generated structure as a valid draft", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...STRUCTURES),
        fc.integer({ min: 4, max: 60 }),
        fc.integer({ min: 4, max: 60 }),
        (name, ends, picks) => {
          expect(validateGrids(structureByName(name, ends, picks))).toEqual([]);
        }
      )
    );
  });
});

describe("plain weave", () => {
  it("alternates every cell like a checkerboard", () => {
    const dd = computeDrawdown(plainWeave(10, 10));
    for (let p = 0; p < 10; p++) {
      for (let e = 0; e < 10; e++) {
        expect(dd[p][e]).toBe((p + e) % 2 === 0);
        if (e + 1 < 10) expect(dd[p][e]).not.toBe(dd[p][e + 1]);
        if (p + 1 < 10) expect(dd[p][e]).not.toBe(dd[p + 1][e]);
      }
    }
  });
});

describe("2/2 twill", () => {
  it("shifts the diagonal one end per pick", () => {
    const ends = 12;
    const dd = computeDrawdown(twill(ends, 12, 4, 2));
    for (let p = 0; p + 1 < 12; p++) {
      for (let e = 0; e < ends; e++) {
        expect(dd[p + 1][e]).toBe(dd[p][(e - 1 + ends) % ends]);
      }
    }
  });

  it("raises exactly two of four shafts per treadle", () => {
    const g = twill(8, 8, 4, 2);
    g.tieUp.forEach((row) => expect(row.filter(Boolean).length).toBe(2));
  });
});

describe("3/1 twill", () => {
  it("raises three of four shafts per treadle", () => {
    const g = twill(8, 8, 4, 3);
    g.tieUp.forEach((row) => expect(row.filter(Boolean).length).toBe(3));
  });
});

describe("5-end satin", () => {
  it("binds each warp end exactly once within the repeat", () => {
    const dd = computeDrawdown(satin(10, 10, 5, 2));
    for (let e = 0; e < 10; e++) {
      let bindings = 0;
      for (let p = 0; p < 5; p++) {
        if (!dd[p][e]) bindings++;
      }
      expect(bindings).toBe(1);
    }
  });

  it("lowers exactly one shaft per treadle", () => {
    const g = satin(10, 10, 5, 2);
    g.tieUp.forEach((row) => expect(row.filter((v) => !v).length).toBe(1));
  });
});

describe("basket weave", () => {
  it("weaves in two-by-two blocks", () => {
    const dd = computeDrawdown(basket(8, 8, 2));
    for (let p = 0; p < 8; p++) {
      for (let e = 0; e < 8; e++) {
        expect(dd[p][e]).toBe(Math.floor(p / 2) % 2 === Math.floor(e / 2) % 2);
      }
    }
  });
});

describe("herringbone and waffle", () => {
  it("herringbone reverses the threading direction at the turning point", () => {
    const g = herringbone(12, 12, 4);
    expect(g.threading.slice(0, 6)).toEqual([0, 1, 2, 3, 2, 1]);
    expect(validateGrids(g)).toEqual([]);
  });

  it("waffle uses a point draw in both directions", () => {
    const g = waffle(10, 10, 5);
    expect(g.threading.slice(0, 8)).toEqual([0, 1, 2, 3, 4, 3, 2, 1]);
    expect(g.treadling.slice(0, 8)).toEqual([0, 1, 2, 3, 4, 3, 2, 1]);
    expect(validateGrids(g)).toEqual([]);
  });
});

describe("cloth face color-and-weave", () => {
  it("changes the face when the weft color changes", () => {
    const g = plainWeave(6, 6);
    const dd = computeDrawdown(g);
    const base = defaultColorOrders(6, 6);
    const faceA = computeClothFace(dd, base);
    const faceB = computeClothFace(dd, { ...base, weftColors: Array.from({ length: 6 }, () => WELD) });
    const weftCells = faceA.flatMap((row, p) => row.filter((c) => !c.warpUp).map((c) => ({ p, e: row.indexOf(c), color: c.color })));
    expect(weftCells.length).toBeGreaterThan(0);
    weftCells.forEach(({ p, e }) => {
      expect(faceA[p][e].color).toBe(MADDER);
      expect(faceB[p][e].color).toBe(WELD);
    });
  });
});

describe("weave math", () => {
  it("computes ends, yarn consumption and finished dimensions with units", () => {
    const plan = computeWeavePlan(
      { ends: 200, picks: 300 },
      { settEpi: 20, reedWidthCm: 50, warpLengthCm: 300, takeUpPct: 10, shrinkagePct: 5 }
    );
    expect(plan.idealEnds).toBe(394);
    expect(plan.totalWarpCm).toBe(60000);
    expect(plan.warpMeters).toBe(600);
    expect(plan.weftPerPickCm).toBe(55);
    expect(plan.totalWeftCm).toBe(16500);
    expect(plan.weftMeters).toBe(165);
    expect(plan.totalYarnMeters).toBe(765);
    expect(plan.finishedWidthCm).toBe(43);
    expect(plan.finishedLengthCm).toBe(36);
  });

  it("rounds yarn up to whole meters so a reservation never comes up short", () => {
    const plan = computeWeavePlan(
      { ends: 3, picks: 3 },
      { settEpi: 10, reedWidthCm: 30, warpLengthCm: 101, takeUpPct: 0, shrinkagePct: 0 }
    );
    expect(plan.totalWarpCm).toBe(303);
    expect(plan.warpMeters).toBe(4);
  });
});

describe("loom compatibility", () => {
  it("dresses a draft only when shafts and treadles suffice", () => {
    const loom = { shafts: 4, treadles: 4 };
    expect(loomCanDress(loom, twill(8, 8, 4, 2))).toBe(true);
    expect(loomCanDress(loom, satin(10, 10, 5, 2))).toBe(false);
    expect(loomCanDress({ shafts: 8, treadles: 8 }, satin(10, 10, 5, 2))).toBe(true);
  });
});

describe("draft validation", () => {
  it("rejects a threading end that references a missing shaft", () => {
    const g = plainWeave(4, 4);
    g.threading[0] = 5;
    const issues = validateGrids(g);
    expect(issues.some((i) => i.field === "threading")).toBe(true);
  });

  it("rejects a tie-up row with the wrong shaft count", () => {
    const g = plainWeave(4, 4);
    g.tieUp[0] = [true];
    expect(validateGrids(g).some((i) => i.field === "tieUp")).toBe(true);
  });
});