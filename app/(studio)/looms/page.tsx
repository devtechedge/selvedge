import type { Metadata } from "next";
import Link from "next/link";
import { hasRole, requireStudio } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ActionForm } from "@/components/action-form";
import { addLoomAction } from "@/app/studio-actions";

export const metadata: Metadata = { title: "Looms" };

export default async function LoomsPage() {
  const context = await requireStudio();
  const looms = await prisma.loom.findMany({
    where: { studioId: context.studioId },
    include: { projects: { where: { status: { not: "FINISHED" } }, take: 1 } },
    orderBy: { name: "asc" },
  });
  const canManage = hasRole(context.role, ["MANAGER"]);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="kicker">The loom board</p>
          <h1>Looms</h1>
        </div>
        <p className="page-head__note">
          A draft can only be dressed on a loom with enough shafts and treadles. The studio enforces
          that on the server, not just in the buttons.
        </p>
      </div>

      <div className="split">
        <div className="col">
          <div className="card-grid">
            {looms.map((loom) => (
              <div key={loom.id} className="card">
                <div className="card__head">
                  <span className="mono">{loom.shafts} shafts</span>
                  <span className={`status status--${loom.status.toLowerCase()}`}>{loom.status}</span>
                </div>
                <h3>{loom.name}</h3>
                <p>
                  {loom.treadles} treadles, {loom.reedWidthCm} cm reed width.
                </p>
                <div className="card__meta">
                  {loom.projects[0] ? (
                    <Link href={`/projects/${loom.projects[0].id}`} className="quiet-link">
                      {loom.projects[0].name}
                    </Link>
                  ) : (
                    <span>Free to dress</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {canManage ? (
          <div className="col">
            <div className="panel">
              <div className="panel__head">
                <div>
                  <span className="mono">Manager only</span>
                  <h2>Add a loom</h2>
                </div>
              </div>
              <ActionForm action={addLoomAction} submitLabel="Add loom" pendingLabel="Adding...">
                <label className="field">
                  <span>Name</span>
                  <input name="name" placeholder="Rigid heddle loom" required maxLength={80} />
                </label>
                <div className="field-row">
                  <label className="field">
                    <span>Shafts</span>
                    <input name="shafts" type="number" min={2} max={32} defaultValue={4} required />
                  </label>
                  <label className="field">
                    <span>Treadles</span>
                    <input name="treadles" type="number" min={1} max={64} defaultValue={4} required />
                  </label>
                  <label className="field">
                    <span>Reed width (cm)</span>
                    <input name="reedWidthCm" type="number" min={1} defaultValue={60} required />
                  </label>
                </div>
              </ActionForm>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}