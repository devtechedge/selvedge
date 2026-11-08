import { prisma } from "@/lib/db";
import { defaultColorOrders, structureByName } from "@/domain/weave";

const TABLES = [
  "audit_event",
  "finishing_log",
  "reservation",
  "release",
  "project",
  "draft",
  "yarn_lot",
  "loom",
  "session",
  "membership",
  "user",
  "studio",
];

export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((table) => `"${table}"`).join(", ")} RESTART IDENTITY CASCADE`
  );
}

export interface Fixture {
  studioId: string;
  rivalStudioId: string;
  users: { weaver: string; dyer: string; manager: string; outsider: string };
  memberships: { weaver: string; dyer: string; manager: string; outsider: string };
  lots: Record<string, string>;
  looms: { table: string; floor: string; dobby: string };
  draftId: string;
  projectId: string;
}

export async function createFixture(): Promise<Fixture> {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const studio = await prisma.studio.create({
    data: { name: "Test Studio", slug: `test-${stamp}` },
  });
  const rival = await prisma.studio.create({
    data: { name: "Rival Studio", slug: `rival-${stamp}` },
  });

  const users = { weaver: "", dyer: "", manager: "", outsider: "" };
  const memberships = { weaver: "", dyer: "", manager: "", outsider: "" };
  const roles = [
    ["weaver", "WEAVER", studio.id],
    ["dyer", "DYER", studio.id],
    ["manager", "MANAGER", studio.id],
    ["outsider", "WEAVER", rival.id],
  ] as const;
  for (const [key, role, studioId] of roles) {
    const user = await prisma.user.create({
      data: { email: `${key}-${stamp}@test.local`, name: key, passwordHash: "unused" },
    });
    const membership = await prisma.membership.create({
      data: { studioId, userId: user.id, role },
    });
    users[key] = user.id;
    memberships[key] = membership.id;
  }

  const lots: Record<string, string> = {};
  for (const code of ["INDIGO", "MADDER", "FLAX"]) {
    const lot = await prisma.yarnLot.create({
      data: {
        studioId: studio.id,
        code,
        name: code,
        fiber: "wool",
        dyeRecipe: "test recipe",
        colorName: code,
        colorHex: "#2f4a6d",
        lengthOnHandM: 1000,
        reorderM: 100,
        lotNumber: `LOT-${code}`,
        active: true,
      },
    });
    lots[code] = lot.id;
  }

  const looms = { table: "", floor: "", dobby: "" };
  const loomSpecs = [
    ["table", "Table loom", 4, 4, 60],
    ["floor", "Floor loom", 8, 10, 110],
    ["dobby", "Dobby loom", 16, 16, 90],
  ] as const;
  for (const [key, name, shafts, treadles, reedWidthCm] of loomSpecs) {
    const loom = await prisma.loom.create({
      data: { studioId: studio.id, name, shafts, treadles, reedWidthCm, status: "AVAILABLE" },
    });
    looms[key] = loom.id;
  }

  const grids = structureByName("twill22", 48, 48);
  const colors = defaultColorOrders(48, 48);
  const draft = await prisma.draft.create({
    data: {
      studioId: studio.id,
      createdById: users.weaver,
      name: "Test twill",
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
      revision: 1,
    },
  });

  const project = await prisma.project.create({
    data: {
      studioId: studio.id,
      draftId: draft.id,
      name: "Test project",
      status: "WARP",
      picksWoven: 0,
      createdById: users.weaver,
    },
  });

  return {
    studioId: studio.id,
    rivalStudioId: rival.id,
    users,
    memberships,
    lots,
    looms,
    draftId: draft.id,
    projectId: project.id,
  };
}