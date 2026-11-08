import type { Metadata } from "next";
import Link from "next/link";
import { hasRole, requireStudio } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ActionForm } from "@/components/action-form";
import { createDraftAction } from "@/app/studio-actions";
import { STRUCTURES, STRUCTURE_LABELS } from "@/domain/types";

export const metadata: Metadata = { title: "Drafts" };

export default async function DraftsPage() {
  const context = await requireStudio();
  const drafts = await prisma.draft.findMany({
    where: { studioId: context.studioId },
    orderBy: { updatedAt: "desc" },
  });
  const canEdit = hasRole(context.role, ["WEAVER", "MANAGER"]);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="kicker">The draft board</p>
          <h1>Drafts</h1>
        </div>
        <p className="page-head__note">
          Each draft is four linked grids: threading, tie-up, treadling and the drawdown they
          produce. Open one to edit the cloth and reserve yarn.
        </p>
      </div>

      <div className="split">
        <div className="col">
          {drafts.length === 0 ? (
            <p className="empty-note">No drafts yet. Create one from a structure to begin.</p>
          ) : (
            <div className="card-grid">
              {drafts.map((draft) => (
                <Link key={draft.id} href={`/drafts/${draft.id}`} className="card">
                  <div className="card__head">
                    <span className="mono">{draft.shafts} shafts</span>
                    <span className="mono">rev {draft.revision}</span>
                  </div>
                  <h3>{draft.name}</h3>
                  <p>
                    {draft.ends} ends x {draft.picks} picks at {draft.settEpi} epi.
                  </p>
                  <div className="card__meta">
                    <span>{draft.reedWidthCm} cm reed</span>
                    <span>{draft.treadles} treadles</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {canEdit ? (
          <div className="col">
            <div className="panel">
              <div className="panel__head">
                <div>
                  <span className="mono">Weaver or manager</span>
                  <h2>New draft</h2>
                </div>
              </div>
              <ActionForm action={createDraftAction} submitLabel="Create draft" pendingLabel="Creating...">
                <label className="field">
                  <span>Name</span>
                  <input name="name" defaultValue="New draft" required maxLength={120} />
                </label>
                <label className="field">
                  <span>Structure</span>
                  <select name="structure" defaultValue="twill22">
                    {STRUCTURES.map((s) => (
                      <option key={s} value={s}>
                        {STRUCTURE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="field-row">
                  <label className="field">
                    <span>Warp ends</span>
                    <input name="ends" type="number" min={1} max={2000} defaultValue={48} required />
                  </label>
                  <label className="field">
                    <span>Weft picks</span>
                    <input name="picks" type="number" min={1} max={4000} defaultValue={48} required />
                  </label>
                  <label className="field">
                    <span>Sett (epi)</span>
                    <input name="settEpi" type="number" min={1} defaultValue={20} required />
                  </label>
                  <label className="field">
                    <span>Reed width (cm)</span>
                    <input name="reedWidthCm" type="number" min={1} defaultValue={50} required />
                  </label>
                  <label className="field">
                    <span>Warp length (cm)</span>
                    <input name="warpLengthCm" type="number" min={1} defaultValue={200} required />
                  </label>
                  <label className="field">
                    <span>Take-up (%)</span>
                    <input name="takeUpPct" type="number" min={0} max={50} defaultValue={10} required />
                  </label>
                  <label className="field">
                    <span>Shrinkage (%)</span>
                    <input name="shrinkagePct" type="number" min={0} max={50} defaultValue={5} required />
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