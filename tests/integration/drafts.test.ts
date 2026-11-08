import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  createDraft,
  draftToColors,
  draftToDims,
  draftToGrids,
  saveDraft,
} from "@/services/drafts";
import { createFixture, resetDatabase, type Fixture } from "./helpers";

let fixture: Fixture;

beforeEach(async () => {
  await resetDatabase();
  fixture = await createFixture();
});

async function loadDraft() {
  return prisma.draft.findUniqueOrThrow({ where: { id: fixture.draftId } });
}

function saveInput(draft: Awaited<ReturnType<typeof loadDraft>>, expectedRevision: number, name: string) {
  return {
    studioId: fixture.studioId,
    userId: fixture.users.weaver,
    draftId: fixture.draftId,
    expectedRevision,
    name,
    ...draftToGrids(draft),
    ...draftToColors(draft),
    ...draftToDims(draft),
  };
}

describe("draft autosave", () => {
  it("saves a new revision", async () => {
    const draft = await loadDraft();
    const revision = await saveDraft(saveInput(draft, 1, "Renamed"));
    expect(revision).toBe(2);
    const after = await loadDraft();
    expect(after.revision).toBe(2);
    expect(after.name).toBe("Renamed");
  });

  it("rejects a stale save and keeps the newer revision", async () => {
    const original = await loadDraft();
    await saveDraft(saveInput(original, 1, "First save"));
    await expect(saveDraft(saveInput(original, 1, "Stale overwrite"))).rejects.toThrow(
      /changed since you opened/i
    );
    const after = await loadDraft();
    expect(after.revision).toBe(2);
    expect(after.name).toBe("First save");
  });

  it("rejects a draft grid that references a missing shaft", async () => {
    const draft = await loadDraft();
    const input = saveInput(draft, 1, "Bad grid");
    input.threading[0] = 99;
    await expect(saveDraft(input)).rejects.toThrow(/shaft/i);
  });
});

describe("draft creation roles", () => {
  it("creates a draft as a weaver", async () => {
    const id = await createDraft({
      studioId: fixture.studioId,
      userId: fixture.users.weaver,
      name: "Plain study",
      structure: "plain",
      ends: 24,
      picks: 24,
      settEpi: 20,
      reedWidthCm: 50,
      warpLengthCm: 200,
      takeUpPct: 10,
      shrinkagePct: 5,
    });
    const draft = await prisma.draft.findUniqueOrThrow({ where: { id } });
    expect(draft.revision).toBe(1);
    expect(draft.shafts).toBe(2);
  });

  it("refuses a dyer creating a draft", async () => {
    await expect(
      createDraft({
        studioId: fixture.studioId,
        userId: fixture.users.dyer,
        name: "Nope",
        structure: "plain",
        ends: 24,
        picks: 24,
        settEpi: 20,
        reedWidthCm: 50,
        warpLengthCm: 200,
        takeUpPct: 10,
        shrinkagePct: 5,
      })
    ).rejects.toThrow(/role does not allow/i);
  });
});