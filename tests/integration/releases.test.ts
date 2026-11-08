import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { releasePattern, verifyRelease } from "@/services/releases";
import { createFixture, resetDatabase, type Fixture } from "./helpers";

let fixture: Fixture;

beforeEach(async () => {
  await resetDatabase();
  fixture = await createFixture();
});

describe("pattern releases", () => {
  it("releases an immutable checksummed version", async () => {
    const release = await releasePattern({
      studioId: fixture.studioId,
      userId: fixture.users.manager,
      draftId: fixture.draftId,
      name: "Twill v1",
    });
    expect(release.version).toBe(1);
    expect(release.checksum).toMatch(/^[0-9a-f]{64}$/);
    const row = await prisma.release.findUniqueOrThrow({ where: { id: release.id } });
    expect(verifyRelease(row)).toBe(true);
  });

  it("increments versions and leaves earlier releases unchanged", async () => {
    const first = await releasePattern({
      studioId: fixture.studioId,
      userId: fixture.users.manager,
      draftId: fixture.draftId,
      name: "v1",
    });
    const second = await releasePattern({
      studioId: fixture.studioId,
      userId: fixture.users.manager,
      draftId: fixture.draftId,
      name: "v2",
    });
    expect(second.version).toBe(2);
    const row1 = await prisma.release.findUniqueOrThrow({ where: { id: first.id } });
    expect(row1.name).toBe("v1");
    expect(row1.checksum).toBe(first.checksum);
    expect(verifyRelease(row1)).toBe(true);
  });

  it("detects a tampered snapshot", async () => {
    const release = await releasePattern({
      studioId: fixture.studioId,
      userId: fixture.users.manager,
      draftId: fixture.draftId,
      name: "Twill v1",
    });
    const row = await prisma.release.findUniqueOrThrow({ where: { id: release.id } });
    expect(verifyRelease(row)).toBe(true);
    const snapshot = row.snapshot as Record<string, unknown>;
    const tampered = { ...row, snapshot: { ...snapshot, name: "Tampered" } };
    expect(verifyRelease(tampered)).toBe(false);
  });

  it("detects a tampered checksum", async () => {
    const release = await releasePattern({
      studioId: fixture.studioId,
      userId: fixture.users.manager,
      draftId: fixture.draftId,
      name: "Twill v1",
    });
    const row = await prisma.release.findUniqueOrThrow({ where: { id: release.id } });
    const last = row.checksum.slice(-1);
    const replacement = last === "A" ? "B" : "A";
    const badChecksum = row.checksum.slice(0, -1) + replacement;
    expect(badChecksum).not.toBe(row.checksum);
    expect(verifyRelease({ ...row, checksum: badChecksum })).toBe(false);
  });

  it("refuses a weaver releasing a pattern", async () => {
    await expect(
      releasePattern({
        studioId: fixture.studioId,
        userId: fixture.users.weaver,
        draftId: fixture.draftId,
        name: "Nope",
      })
    ).rejects.toThrow(/role does not allow/i);
  });
});