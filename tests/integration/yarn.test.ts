import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { addYarnLot, recordIntake, reserveYarn } from "@/services/yarn";
import { createFixture, resetDatabase, type Fixture } from "./helpers";

let fixture: Fixture;

beforeEach(async () => {
  await resetDatabase();
  fixture = await createFixture();
});

describe("yarn reservation", () => {
  it("draws exact meters and writes one reservation", async () => {
    await reserveYarn({
      studioId: fixture.studioId,
      userId: fixture.users.weaver,
      projectId: fixture.projectId,
      yarnLotId: fixture.lots.INDIGO,
      lengthM: 300,
      reason: "WARP",
    });
    const lot = await prisma.yarnLot.findUniqueOrThrow({ where: { id: fixture.lots.INDIGO } });
    expect(lot.lengthOnHandM).toBe(700);
    expect(await prisma.reservation.count({ where: { projectId: fixture.projectId } })).toBe(1);
  });

  it("rejects a draw beyond on-hand and rolls back", async () => {
    await expect(
      reserveYarn({
        studioId: fixture.studioId,
        userId: fixture.users.weaver,
        projectId: fixture.projectId,
        yarnLotId: fixture.lots.INDIGO,
        lengthM: 1500,
        reason: "WARP",
      })
    ).rejects.toThrow(/Not enough/);
    const lot = await prisma.yarnLot.findUniqueOrThrow({ where: { id: fixture.lots.INDIGO } });
    expect(lot.lengthOnHandM).toBe(1000);
    expect(await prisma.reservation.count()).toBe(0);
  });

  it("does not overdraw one lot under five concurrent reservations", async () => {
    await prisma.yarnLot.update({
      where: { id: fixture.lots.INDIGO },
      data: { lengthOnHandM: 500 },
    });
    const attempts = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        reserveYarn({
          studioId: fixture.studioId,
          userId: fixture.users.weaver,
          projectId: fixture.projectId,
          yarnLotId: fixture.lots.INDIGO,
          lengthM: 500,
          reason: "WARP",
        })
      )
    );
    const fulfilled = attempts.filter((attempt) => attempt.status === "fulfilled");
    expect(fulfilled).toHaveLength(1);
    const lot = await prisma.yarnLot.findUniqueOrThrow({ where: { id: fixture.lots.INDIGO } });
    expect(lot.lengthOnHandM).toBe(0);
    expect(await prisma.reservation.count({ where: { yarnLotId: fixture.lots.INDIGO } })).toBe(1);
  });

  it("refuses a dyer reserving yarn", async () => {
    await expect(
      reserveYarn({
        studioId: fixture.studioId,
        userId: fixture.users.dyer,
        projectId: fixture.projectId,
        yarnLotId: fixture.lots.INDIGO,
        lengthM: 100,
        reason: "WARP",
      })
    ).rejects.toThrow(/role does not allow/i);
  });

  it("refuses a non-member acting on another studio", async () => {
    await expect(
      reserveYarn({
        studioId: fixture.rivalStudioId,
        userId: fixture.users.weaver,
        projectId: fixture.projectId,
        yarnLotId: fixture.lots.INDIGO,
        lengthM: 100,
        reason: "WARP",
      })
    ).rejects.toThrow(/not a member/i);
  });
});

describe("yarn intake and dye lots", () => {
  it("records intake as a dyer", async () => {
    await recordIntake({
      studioId: fixture.studioId,
      userId: fixture.users.dyer,
      yarnLotId: fixture.lots.MADDER,
      meters: 200,
    });
    const lot = await prisma.yarnLot.findUniqueOrThrow({ where: { id: fixture.lots.MADDER } });
    expect(lot.lengthOnHandM).toBe(1200);
  });

  it("adds a new dye lot", async () => {
    const id = await addYarnLot({
      studioId: fixture.studioId,
      userId: fixture.users.dyer,
      code: "WELD",
      name: "Weld yellow",
      fiber: "linen",
      dyeRecipe: "Weld flowers, alum",
      colorName: "Weld",
      colorHex: "#c9962e",
      lengthOnHandM: 400,
      reorderM: 80,
      lotNumber: "LOT-WELD",
    });
    expect(await prisma.yarnLot.count({ where: { id } })).toBe(1);
  });

  it("refuses a weaver adding a dye lot", async () => {
    await expect(
      addYarnLot({
        studioId: fixture.studioId,
        userId: fixture.users.weaver,
        code: "NOPE",
        name: "Nope",
        fiber: "wool",
        dyeRecipe: "x",
        colorName: "Nope",
        colorHex: "#000000",
        lengthOnHandM: 1,
        reorderM: 0,
        lotNumber: "LOT-NOPE",
      })
    ).rejects.toThrow(/role does not allow/i);
  });

  it("rejects a duplicate code at the database boundary", async () => {
    await expect(
      addYarnLot({
        studioId: fixture.studioId,
        userId: fixture.users.dyer,
        code: "INDIGO",
        name: "Copy",
        fiber: "wool",
        dyeRecipe: "x",
        colorName: "Copy",
        colorHex: "#000000",
        lengthOnHandM: 1,
        reorderM: 0,
        lotNumber: "LOT-COPY",
      })
    ).rejects.toThrow(/already in the yarn library/i);
  });
});