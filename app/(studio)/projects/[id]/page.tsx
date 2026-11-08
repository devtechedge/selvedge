import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasRole, requireStudio } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ActionForm } from "@/components/action-form";
import { ClothCanvas } from "@/components/cloth-canvas";
import {
  assignLoomAction,
  finishAction,
  reserveYarnAction,
  weaveAction,
} from "@/app/studio-actions";
import { computeWeavePlan } from "@/domain/weave";
import { draftToColors, draftToDims, draftToGrids } from "@/services/drafts";
import { FINISHING_METHODS, RESERVATION_REASONS } from "@/domain/types";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  return { title: project?.name ?? "Project" };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const context = await requireStudio();
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, studioId: context.studioId },
    include: {
      draft: true,
      loom: true,
      reservations: { include: { yarnLot: true }, orderBy: { createdAt: "asc" } },
      finishing: { include: { actor: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) notFound();

  const [lots, freeLooms] = await Promise.all([
    prisma.yarnLot.findMany({ where: { studioId: context.studioId }, orderBy: { code: "asc" } }),
    prisma.loom.findMany({ where: { studioId: context.studioId, status: "AVAILABLE" }, orderBy: { name: "asc" } }),
  ]);

  const canEdit = hasRole(context.role, ["WEAVER", "MANAGER"]);
  const grids = draftToGrids(project.draft);
  const colors = draftToColors(project.draft);
  const plan = computeWeavePlan(grids, draftToDims(project.draft));
  const progress = Math.round((project.picksWoven / project.draft.picks) * 100);
  const active = project.status !== "FINISHED";

  return (
    <>
      <div className="page-head">
        <div>
          <p className="kicker">Project</p>
          <h1>{project.name}</h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <span className={`status status--${project.status.toLowerCase()}`}>{project.status}</span>
          <Link href="/projects" className="quiet-link">
            All projects
          </Link>
        </div>
      </div>

      <div className="split">
        <div className="col">
          <div className="panel">
            <div className="panel__head">
              <div>
                <span className="mono">{project.draft.name}</span>
                <h2>Cloth on the beam</h2>
              </div>
              <span className="mono">
                {project.picksWoven}/{project.draft.picks} picks
              </span>
            </div>
            <div className="cloth-frame">
              <ClothCanvas grids={grids} colors={colors} cellSize={5} label={`Cloth for ${project.name}, ${grids.ends} ends by ${grids.picks} picks.`} />
            </div>
            <div className="progress-track" aria-hidden="true">
              <span className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="micro">
              {progress}% woven. {project.loom ? `Dressed on the ${project.loom.name}.` : "Not dressed on a loom yet."}
            </p>
            <dl className="weave-math" style={{ marginTop: 16 }}>
              <div>
                <dt>Warp yarn</dt>
                <dd>{plan.warpMeters} <small>m</small></dd>
              </div>
              <div>
                <dt>Weft yarn</dt>
                <dd>{plan.weftMeters} <small>m</small></dd>
              </div>
              <div>
                <dt>Finished width</dt>
                <dd>{plan.finishedWidthCm} <small>cm</small></dd>
              </div>
              <div>
                <dt>Finished length</dt>
                <dd>{plan.finishedLengthCm} <small>cm</small></dd>
              </div>
            </dl>
          </div>

          <div className="panel">
            <div className="panel__head">
              <div>
                <span className="mono">{project.reservations.length} draws</span>
                <h2>Reserved yarn</h2>
              </div>
            </div>
            {project.reservations.length === 0 ? (
              <p className="empty-note">No yarn reserved yet.</p>
            ) : (
              <div className="table-wrap" tabIndex={0} aria-label="Reserved yarn table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Dye lot</th>
                      <th>Reason</th>
                      <th className="num">Length (m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.reservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td>
                          <span className="swatch" style={{ background: reservation.yarnLot.colorHex }} aria-hidden="true" />
                          {reservation.yarnLot.colorName} ({reservation.yarnLot.lotNumber})
                        </td>
                        <td className="mono">{reservation.reason}</td>
                        <td className="num">{reservation.lengthM}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {project.finishing.length > 0 ? (
            <div className="panel">
              <div className="panel__head">
                <div>
                  <span className="mono">Off the loom</span>
                  <h2>Finishing log</h2>
                </div>
              </div>
              {project.finishing.map((log) => (
                <div key={log.id} className="card" style={{ marginBottom: 10 }}>
                  <div className="card__head">
                    <span className="mono">{log.method}</span>
                    <span className="mono">{log.measuredShrinkagePct}% shrinkage</span>
                  </div>
                  <p>
                    Finished {log.finalWidthCm} cm x {log.finalLengthCm} cm by {log.actor.name}.
                  </p>
                  {log.notes ? <p>{log.notes}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {canEdit && active ? (
          <div className="col">
            <div className="panel">
              <div className="panel__head">
                <div>
                  <span className="mono">Atomic draw</span>
                  <h2>Reserve yarn</h2>
                </div>
              </div>
              <ActionForm action={reserveYarnAction} submitLabel="Reserve yarn" pendingLabel="Reserving...">
                <input type="hidden" name="projectId" value={project.id} />
                <label className="field">
                  <span>Dye lot</span>
                  <select name="yarnLotId" required defaultValue={lots[0]?.id ?? ""}>
                    {lots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.colorName} ({lot.lengthOnHandM} m on hand)
                      </option>
                    ))}
                  </select>
                </label>
                <div className="field-row">
                  <label className="field">
                    <span>Length (m)</span>
                    <input name="lengthM" type="number" min={1} defaultValue={100} required />
                  </label>
                  <label className="field">
                    <span>Reason</span>
                    <select name="reason" defaultValue="WARP">
                      {RESERVATION_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </ActionForm>
            </div>

            {project.status === "WARP" ? (
              <div className="panel">
                <div className="panel__head">
                  <div>
                    <span className="mono">Shafts and treadles checked</span>
                    <h2>Dress a loom</h2>
                  </div>
                </div>
                {freeLooms.length === 0 ? (
                  <p className="empty-note">No loom is free. Finish a project to free one.</p>
                ) : (
                  <ActionForm action={assignLoomAction} submitLabel="Dress loom" pendingLabel="Dressing...">
                    <input type="hidden" name="projectId" value={project.id} />
                    <label className="field">
                      <span>Available loom</span>
                      <select name="loomId" required defaultValue={freeLooms[0]?.id ?? ""}>
                        {freeLooms.map((loom) => (
                          <option key={loom.id} value={loom.id}>
                            {loom.name} ({loom.shafts} shafts, {loom.treadles} treadles)
                          </option>
                        ))}
                      </select>
                    </label>
                  </ActionForm>
                )}
              </div>
            ) : null}

            {project.status === "THREADED" || project.status === "WEAVING" ? (
              <div className="panel">
                <div className="panel__head">
                  <div>
                    <span className="mono">Pick by pick</span>
                    <h2>Weave</h2>
                  </div>
                </div>
                <ActionForm action={weaveAction} submitLabel="Weave picks" pendingLabel="Weaving...">
                  <input type="hidden" name="projectId" value={project.id} />
                  <label className="field">
                    <span>Picks to weave</span>
                    <input name="picks" type="number" min={1} max={project.draft.picks - project.picksWoven} defaultValue={10} required />
                  </label>
                </ActionForm>
              </div>
            ) : null}

            {project.status === "WEAVING" ? (
              <div className="panel">
                <div className="panel__head">
                  <div>
                    <span className="mono">Off the loom</span>
                    <h2>Finish cloth</h2>
                  </div>
                </div>
                <ActionForm action={finishAction} submitLabel="Finish and free loom" pendingLabel="Finishing...">
                  <input type="hidden" name="projectId" value={project.id} />
                  <label className="field">
                    <span>Method</span>
                    <select name="method" defaultValue="wet-finish">
                      {FINISHING_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="field-row">
                    <label className="field">
                      <span>Shrinkage (%)</span>
                      <input name="measuredShrinkagePct" type="number" min={0} max={80} defaultValue={5} required />
                    </label>
                    <label className="field">
                      <span>Final width (cm)</span>
                      <input name="finalWidthCm" type="number" min={1} defaultValue={plan.finishedWidthCm} required />
                    </label>
                    <label className="field">
                      <span>Final length (cm)</span>
                      <input name="finalLengthCm" type="number" min={1} defaultValue={plan.finishedLengthCm} required />
                    </label>
                  </div>
                  <label className="field">
                    <span>Notes</span>
                    <textarea name="notes" maxLength={500} placeholder="Warm wash, flat dry." />
                  </label>
                </ActionForm>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}