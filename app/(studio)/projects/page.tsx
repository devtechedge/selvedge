import type { Metadata } from "next";
import Link from "next/link";
import { hasRole, requireStudio } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ActionForm } from "@/components/action-form";
import { createProjectAction } from "@/app/studio-actions";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const context = await requireStudio();
  const [projects, drafts] = await Promise.all([
    prisma.project.findMany({
      where: { studioId: context.studioId },
      include: { draft: true, loom: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.draft.findMany({ where: { studioId: context.studioId }, orderBy: { name: "asc" } }),
  ]);
  const canEdit = hasRole(context.role, ["WEAVER", "MANAGER"]);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="kicker">Cloth in progress</p>
          <h1>Projects</h1>
        </div>
        <p className="page-head__note">
          A project takes a draft from warp to finished cloth: reserve yarn, dress a loom, weave pick
          by pick, then log the finishing.
        </p>
      </div>

      <div className="split">
        <div className="col">
          {projects.length === 0 ? (
            <p className="empty-note">No projects yet. Start one from a draft.</p>
          ) : (
            <div className="card-grid">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="card">
                  <div className="card__head">
                    <span className="mono">{project.draft.shafts} shafts</span>
                    <span className={`status status--${project.status.toLowerCase()}`}>{project.status}</span>
                  </div>
                  <h3>{project.name}</h3>
                  <p>
                    {project.draft.name} on {project.loom?.name ?? "no loom yet"}.
                  </p>
                  <div className="progress-track" aria-hidden="true">
                    <span
                      className="progress-fill"
                      style={{ width: `${Math.round((project.picksWoven / project.draft.picks) * 100)}%` }}
                    />
                  </div>
                  <div className="card__meta">
                    <span>
                      {project.picksWoven}/{project.draft.picks} picks
                    </span>
                    <span>{project.draft.ends} ends</span>
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
                  <h2>Start a project</h2>
                </div>
              </div>
              {drafts.length === 0 ? (
                <p className="empty-note">Create a draft first.</p>
              ) : (
                <ActionForm action={createProjectAction} submitLabel="Start project" pendingLabel="Starting...">
                  <label className="field">
                    <span>Draft</span>
                    <select name="draftId" required defaultValue={drafts[0]?.id ?? ""}>
                      {drafts.map((draft) => (
                        <option key={draft.id} value={draft.id}>
                          {draft.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Project name</span>
                    <input name="name" placeholder="Madder twill scarf" required maxLength={120} />
                  </label>
                </ActionForm>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}