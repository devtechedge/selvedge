import type { Metadata } from "next";
import { requireStudio } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyRelease } from "@/services/releases";
import { ClothCanvas } from "@/components/cloth-canvas";

export const metadata: Metadata = { title: "Releases" };

interface SnapshotShape {
  shafts: number;
  treadles: number;
  ends: number;
  picks: number;
  threading: number[];
  tieUp: boolean[][];
  treadling: number[];
  warpColors: string[];
  weftColors: string[];
}

export default async function ReleasesPage() {
  const context = await requireStudio();
  const releases = await prisma.release.findMany({
    where: { studioId: context.studioId },
    include: { draft: true, createdBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="page-head">
        <div>
          <p className="kicker">The pattern archive</p>
          <h1>Released patterns</h1>
        </div>
        <p className="page-head__note">
          A release freezes a draft into an immutable, checksummed snapshot. It is never edited. The
          checksum is recomputed from the stored snapshot on every visit, so tampering would show.
        </p>
      </div>

      {releases.length === 0 ? (
        <p className="empty-note">No patterns released yet. A manager releases one from a draft.</p>
      ) : (
        <div className="card-grid">
          {releases.map((release) => {
            const snap = release.snapshot as unknown as SnapshotShape;
            const verified = verifyRelease(release);
            const grids = {
              shafts: snap.shafts,
              treadles: snap.treadles,
              ends: snap.ends,
              picks: snap.picks,
              threading: snap.threading,
              tieUp: snap.tieUp,
              treadling: snap.treadling,
            };
            const colors = { warpColors: snap.warpColors, weftColors: snap.weftColors };
            return (
              <div key={release.id} className="card">
                <div className="card__head">
                  <span className="mono">version {release.version}</span>
                  <span className={verified ? "status status--released" : "status status--low"}>
                    {verified ? "verified" : "checksum mismatch"}
                  </span>
                </div>
                <div className="cloth-frame" style={{ marginBottom: 12 }}>
                  <ClothCanvas grids={grids} colors={colors} cellSize={4} label={`Woven cloth for released pattern ${release.name}.`} />
                </div>
                <h3>{release.name}</h3>
                <p>
                  From {release.draft.name}, released by {release.createdBy.name}.
                </p>
                <p className="release-checksum">SHA-256 {release.checksum}</p>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}