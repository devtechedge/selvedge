import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { advanceWeave, assignLoom, createProject, finishProject } from "@/services/projects";
import { defaultColorOrders, structureByName } from "@/domain/weave";
import type { Structure } from "@/domain/types";
import { createFixture, resetDatabase, type Fixture } from "./helpers";

let fixture: Fixture;

beforeEach(async () => {
  await resetDatabase();
  fixture = await createFixture();
});

async function projectFromStructure(structure: Structure, shafts: number): Promise<string> {
  const grids = structureByName(structure, 20, 20);
  const colors = defaultColorOrders(20, 20);
  const draft = await prisma.draft.create({
    data: {
      studioId: fixture.studioId,
      createdById: fixture.users.weaver,
      name: `${structure} study`,
      shafts: grids.shafts,
      treadles: grids.treadles,
      ends: grids.ends,
      picks: grids.picks,
      threading: grids.threading,
      tieUp: grids.tieUp,
      treadling: grids.treadling,
      warpColors: colors.warpColors,
      weftColors: colors.weftColors,
      settEpi: 20,
      reedWidthCm: 50,
      warpLengthCm: 200,
      takeUpPct: 10,
      shrinkagePct: 5,
    },
  });
  expect(draft.shafts).toBe(shafts);
  return createProject({
    studioId: fixture.studioId,
    userId: fixture.users.weaver,
    draftId: draft.id,
    name: `${structure} project`,
  });
}

describe("loom dressing", () => {
  it("dresses a loom with enough shafts and treadles", async () => {
    await assignLoom({
      studioId: fixture.studioId,
      userId: fixture.users.weaver,
      projectId: fixture.projectId,
      loomId: fixture.looms.table,
    });
    const project = await prisma.project.findUniqueOrThrow({ where: { id: fixture.projectId } });
    expect(project.status).toBe("THREADED");
    expect(project.loomId).toBe(fixture.looms.table);
    const loom = await prisma.loom.findUniqueOrThrow({ where: { id: fixture.looms.table } });
    expect(loom.status).toBe("DRESSED");
  });

  it("refuses a loom with too few shafts", async () => {
    const projectId = await projectFromStructure("satin5", 5);
    await expect(
      assignLoom({
        studioId: fixture.studioId,
        userId: fixture.users.weaver,
        projectId,
        loomId: fixture.looms.table,
      })
    ).rejects.toThrow(/shafts/i);
  });

  it("refuses an already dressed loom", async () => {
    await assignLoom({
      studioId: fixture.studioId,
      userId: fixture.users.weaver,
      projectId: fixture.projectId,
      loomId: fixture.looms.table,
    });
    const second = await createProject({
      studioId: fixture.studioId,
      userId: fixture.users.weaver,
      draftId: fixture.draftId,
      name: "Second project",
    });
    await expect(
      assignLoom({
        studioId: fixture.studioId,
        userId: fixture.users.weaver,
        projectId: second,
        loomId: fixture.looms.table,
      })
    ).rejects.toThrow(/already dressed/i);
  });

  it("refuses a dyer dressing a loom", async () => {
    await expect(
      assignLoom({
        studioId: fixture.studioId,
        userId: fixture.users.dyer,
        projectId: fixture.projectId,
        loomId: fixture.looms.table,
      })
    ).rejects.toThrow(/role does not allow/i);
  });
});

describe("weaving lifecycle", () => {
  it("weaves picks then finishes and frees the loom", async () => {
    await assignLoom({
      studioId: fixture.studioId,
      userId: fixture.users.weaver,
      projectId: fixture.projectId,
      loomId: fixture.looms.table,
    });
    const woven = await advanceWeave({
      studioId: fixture.studioId,
      userId: fixture.users.weaver,
      projectId: fixture.projectId,
      picks: 10,
    });
    expect(woven).toBe(10);
    const weaving = await prisma.project.findUniqueOrThrow({ where: { id: fixture.projectId } });
    expect(weaving.status).toBe("WEAVING");

    await finishProject({
      studioId: fixture.studioId,
      userId: fixture.users.weaver,
      projectId: fixture.projectId,
      method: "wet-finish",
      measuredShrinkagePct: 5,
      finalWidthCm: 45,
      finalLengthCm: 30,
      notes: "Warm wash, flat dry.",
    });
    const finished = await prisma.project.findUniqueOrThrow({ where: { id: fixture.projectId } });
    expect(finished.status).toBe("FINISHED");
    const loom = await prisma.loom.findUniqueOrThrow({ where: { id: fixture.looms.table } });
    expect(loom.status).toBe("AVAILABLE");
    expect(await prisma.finishingLog.count({ where: { projectId: fixture.projectId } })).toBe(1);
  });

  it("refuses weaving beyond the remaining warp", async () => {
    await assignLoom({
      studioId: fixture.studioId,
      userId: fixture.users.weaver,
      projectId: fixture.projectId,
      loomId: fixture.looms.table,
    });
    await expect(
      advanceWeave({
        studioId: fixture.studioId,
        userId: fixture.users.weaver,
        projectId: fixture.projectId,
        picks: 999,
      })
    ).rejects.toThrow(/picks remain/i);
  });

  it("refuses weaving before the loom is dressed", async () => {
    await expect(
      advanceWeave({
        studioId: fixture.studioId,
        userId: fixture.users.weaver,
        projectId: fixture.projectId,
        picks: 5,
      })
    ).rejects.toThrow(/Dress the loom/i);
  });
});