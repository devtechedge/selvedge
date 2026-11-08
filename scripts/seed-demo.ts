import { createHash } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client/client";
import { hashPassword } from "../lib/password";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../lib/demo";
import {
  computeWeavePlan,
  structureByName,
  FLAX,
  INDIGO,
  MADDER,
  WELD,
  WALNUT,
  IRON,
  type DraftGrids,
} from "../domain/weave";

try {
  process.loadEnvFile();
} catch {
  // CI and Vercel provide the environment directly.
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required to seed.");
const database = new URL(url).pathname.replace(/^\//, "");
const allowed =
  process.env.ALLOW_PROD_SEED === "1" ||
  database.includes("test") ||
  database.includes("e2e");
if (!allowed) {
  throw new Error(`Refusing to seed "${database}". Set ALLOW_PROD_SEED=1 for the demo database.`);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const YARN_LOTS = [
  { code: "INDIGO", name: "Woad indigo", fiber: "wool", dyeRecipe: "Woad vat, three dips", colorName: "Indigo", colorHex: INDIGO, lengthOnHandM: 2000, reorderM: 400, lotNumber: "SV-2610-IN" },
  { code: "MADDER", name: "Madder root", fiber: "wool", dyeRecipe: "Alum mordant, madder root", colorName: "Madder red", colorHex: MADDER, lengthOnHandM: 1500, reorderM: 300, lotNumber: "SV-2610-MA" },
  { code: "WELD", name: "Weld yellow", fiber: "linen", dyeRecipe: "Weld flowers, alum", colorName: "Weld yellow", colorHex: WELD, lengthOnHandM: 1200, reorderM: 250, lotNumber: "SV-2610-WE" },
  { code: "WALNUT", name: "Walnut hull", fiber: "wool", dyeRecipe: "Black walnut hulls, no mordant", colorName: "Walnut brown", colorHex: WALNUT, lengthOnHandM: 900, reorderM: 200, lotNumber: "SV-2610-WA" },
  { code: "FLAX", name: "Undyed flax", fiber: "linen", dyeRecipe: "Undyed, retted and spun", colorName: "Flax", colorHex: FLAX, lengthOnHandM: 2400, reorderM: 500, lotNumber: "SV-2610-FL" },
  { code: "IRON", name: "Iron black", fiber: "wool", dyeRecipe: "Iron liquor sadden on tannin", colorName: "Iron black", colorHex: IRON, lengthOnHandM: 700, reorderM: 150, lotNumber: "SV-2610-IR" },
  { code: "GREEN", name: "Indigo over weld", fiber: "wool", dyeRecipe: "Weld yellow then indigo vat", colorName: "Leaf green", colorHex: "#5a6b3f", lengthOnHandM: 600, reorderM: 120, lotNumber: "SV-2610-GR" },
  { code: "ORANGE", name: "Madder over weld", fiber: "linen", dyeRecipe: "Weld then weak madder", colorName: "Marigold orange", colorHex: "#c06a2c", lengthOnHandM: 550, reorderM: 120, lotNumber: "SV-2610-OR" },
  { code: "COCHINEAL", name: "Cochineal", fiber: "wool", dyeRecipe: "Cochineal, tin mordant", colorName: "Cochineal rose", colorHex: "#9c3a52", lengthOnHandM: 400, reorderM: 100, lotNumber: "SV-2610-CO" },
  { code: "LOGWOOD", name: "Logwood", fiber: "linen", dyeRecipe: "Logwood chips, iron sadden", colorName: "Logwood purple", colorHex: "#4b3a5a", lengthOnHandM: 480, reorderM: 100, lotNumber: "SV-2610-LO" },
  { code: "POMEGRANATE", name: "Pomegranate rind", fiber: "linen", dyeRecipe: "Dried rind, alum", colorName: "Rind gold", colorHex: "#b8923a", lengthOnHandM: 520, reorderM: 110, lotNumber: "SV-2610-PO" },
  { code: "MARIGOLD", name: "Marigold petals", fiber: "wool", dyeRecipe: "Marigold flowers, alum", colorName: "Marigold", colorHex: "#d8a23a", lengthOnHandM: 640, reorderM: 130, lotNumber: "SV-2610-MG" },
];

const LOOMS = [
  { name: "Table loom", shafts: 4, treadles: 4, reedWidthCm: 60, status: "DRESSED" },
  { name: "Floor loom", shafts: 8, treadles: 10, reedWidthCm: 110, status: "DRESSED" },
  { name: "Dobby loom", shafts: 16, treadles: 16, reedWidthCm: 90, status: "AVAILABLE" },
];

function draftData(
  studioId: string,
  createdById: string,
  name: string,
  grids: DraftGrids,
  colors: { warpColors: string[]; weftColors: string[] },
  dims: { settEpi: number; reedWidthCm: number; warpLengthCm: number; takeUpPct: number; shrinkagePct: number }
) {
  return {
    studioId,
    createdById,
    name,
    shafts: grids.shafts,
    treadles: grids.treadles,
    ends: grids.ends,
    picks: grids.picks,
    threading: grids.threading,
    tieUp: grids.tieUp,
    treadling: grids.treadling,
    warpColors: colors.warpColors,
    weftColors: colors.weftColors,
    ...dims,
  };
}

async function main() {
  console.log(`Seeding ${database}.`);

  await prisma.auditEvent.deleteMany();
  await prisma.finishingLog.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.release.deleteMany();
  await prisma.project.deleteMany();
  await prisma.draft.deleteMany();
  await prisma.yarnLot.deleteMany();
  await prisma.loom.deleteMany();
  await prisma.session.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.studio.deleteMany();

  const studio = await prisma.studio.create({
    data: { name: "Selvedge Works", slug: "selvedge-works" },
  });

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const people: Record<string, { id: string }> = {};
  for (const account of DEMO_ACCOUNTS) {
    const user = await prisma.user.create({
      data: { email: account.email, name: account.name, passwordHash },
    });
    await prisma.membership.create({
      data: { studioId: studio.id, userId: user.id, role: account.role },
    });
    people[account.role] = user;
  }

  const looms: Record<string, { id: string }> = {};
  for (const loom of LOOMS) {
    const row = await prisma.loom.create({ data: { studioId: studio.id, ...loom } });
    looms[loom.name] = row;
  }

  const lots: Record<string, { id: string; lengthOnHandM: number }> = {};
  for (const lot of YARN_LOTS) {
    const row = await prisma.yarnLot.create({
      data: { studioId: studio.id, ...lot, active: true },
    });
    lots[lot.code] = row;
  }

  // Scarf: a 2/2 twill on four shafts, indigo and flax warp, madder weft.
  const scarfGrids = structureByName("twill22", 240, 600);
  const scarfColors = {
    warpColors: Array.from({ length: 240 }, (_, e) => (e % 2 === 0 ? INDIGO : FLAX)),
    weftColors: Array.from({ length: 600 }, () => MADDER),
  };
  const scarfDims = { settEpi: 20, reedWidthCm: 50, warpLengthCm: 300, takeUpPct: 10, shrinkagePct: 5 };
  const scarf = await prisma.draft.create({
    data: draftData(studio.id, people.WEAVER.id, "Madder twill scarf", scarfGrids, scarfColors, scarfDims),
  });

  // Towel: plain weave, flax warp, weld weft.
  const towelGrids = structureByName("plain", 300, 400);
  const towelColors = {
    warpColors: Array.from({ length: 300 }, () => FLAX),
    weftColors: Array.from({ length: 400 }, () => WELD),
  };
  const towelDims = { settEpi: 24, reedWidthCm: 60, warpLengthCm: 250, takeUpPct: 8, shrinkagePct: 4 };
  const towel = await prisma.draft.create({
    data: draftData(studio.id, people.WEAVER.id, "Flax plain towel", towelGrids, towelColors, towelDims),
  });

  const scarfProject = await prisma.project.create({
    data: {
      studioId: studio.id,
      draftId: scarf.id,
      loomId: looms["Floor loom"].id,
      name: "Madder twill scarf",
      status: "WEAVING",
      picksWoven: 120,
      createdById: people.WEAVER.id,
    },
  });
  const towelProject = await prisma.project.create({
    data: {
      studioId: studio.id,
      draftId: towel.id,
      loomId: looms["Table loom"].id,
      name: "Flax plain towel",
      status: "THREADED",
      picksWoven: 0,
      createdById: people.WEAVER.id,
    },
  });

  // Reserve yarn for the scarf: split the warp across indigo and flax, weft from
  // madder. Each draw decrements the lot inside the seed so on-hand stays honest.
  const plan = computeWeavePlan(scarfGrids, scarfDims);
  const halfWarp = Math.ceil(plan.warpMeters / 2);
  const draws = [
    { code: "INDIGO", lengthM: halfWarp, reason: "WARP" },
    { code: "FLAX", lengthM: plan.warpMeters - halfWarp, reason: "WARP" },
    { code: "MADDER", lengthM: plan.weftMeters, reason: "WEFT" },
  ];
  for (const draw of draws) {
    await prisma.reservation.create({
      data: {
        studioId: studio.id,
        projectId: scarfProject.id,
        yarnLotId: lots[draw.code].id,
        lengthM: draw.lengthM,
        reason: draw.reason,
        actorId: people.WEAVER.id,
      },
    });
    await prisma.yarnLot.update({
      where: { id: lots[draw.code].id },
      data: { lengthOnHandM: { decrement: draw.lengthM } },
    });
  }

  await prisma.finishingLog.create({
    data: {
      projectId: towelProject.id,
      method: "wet-finish",
      measuredShrinkagePct: 4,
      finalWidthCm: 55,
      finalLengthCm: 40,
      notes: "Warm wash, flat dry. Settled to a soft hand.",
      actorId: people.WEAVER.id,
    },
  });

  // Release the towel draft as an immutable, checksummed pattern.
  const snapshot = {
    name: towel.name,
    shafts: towelGrids.shafts,
    treadles: towelGrids.treadles,
    ends: towelGrids.ends,
    picks: towelGrids.picks,
    threading: towelGrids.threading,
    tieUp: towelGrids.tieUp,
    treadling: towelGrids.treadling,
    warpColors: towelColors.warpColors,
    weftColors: towelColors.weftColors,
    ...towelDims,
  };
  const checksum = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
  const release = await prisma.release.create({
    data: {
      studioId: studio.id,
      draftId: towel.id,
      version: 1,
      name: "Flax plain towel v1",
      checksum,
      snapshot,
      createdById: people.MANAGER.id,
    },
  });

  const seedAudit = [
    ["draft.created", "draft", scarf.id, people.WEAVER.id, { name: scarf.name }],
    ["project.started", "project", scarfProject.id, people.WEAVER.id, { status: "WEAVING" }],
    ["yarn.reserved", "reservation", scarfProject.id, people.WEAVER.id, { meters: plan.totalYarnMeters }],
    ["pattern.released", "release", release.id, people.MANAGER.id, { version: 1, checksum }],
  ] as const;
  for (const [action, entityType, entityId, actorId, detail] of seedAudit) {
    await prisma.auditEvent.create({
      data: { studioId: studio.id, actorId, action, entityType, entityId, detail },
    });
  }

  const counts = {
    studios: await prisma.studio.count(),
    looms: await prisma.loom.count(),
    yarnLots: await prisma.yarnLot.count(),
    drafts: await prisma.draft.count(),
    projects: await prisma.project.count(),
    reservations: await prisma.reservation.count(),
    releases: await prisma.release.count(),
  };
  console.log("Seeded", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });