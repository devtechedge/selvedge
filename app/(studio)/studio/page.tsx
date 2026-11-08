import Link from "next/link";
import { requireStudio } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function DeskPage() {
  const context = await requireStudio();
  const studioId = context.studioId;

  const [draftCount, projectCount, releaseCount, yarnLots, projects] = await Promise.all([
    prisma.draft.count({ where: { studioId } }),
    prisma.project.count({ where: { studioId } }),
    prisma.release.count({ where: { studioId } }),
    prisma.yarnLot.findMany({ where: { studioId }, orderBy: { code: "asc" } }),
    prisma.project.findMany({
      where: { studioId },
      include: { draft: true, loom: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  const low = yarnLots.filter((lot) => lot.lengthOnHandM <= lot.reorderM);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="kicker">Selvedge Works</p>
          <h1>The desk</h1>
        </div>
        <p className="page-head__note">
          Everything the studio is holding: drafts on the board, cloth on the looms, yarn in the
          cabinet, and the patterns released so far.
        </p>
      </div>

      <p className="notice">
        This is a shared demo studio. Sign in as a weaver, dyer or manager from the login page. The
        seed resets the cloth and dye lots; nothing here is a real order.
      </p>

      <div className="card-grid" style={{ marginBottom: 28 }}>
        <Link href="/drafts" className="card">
          <div className="card__head">
            <span className="mono">Drafts</span>
          </div>
          <h3>{draftCount}</h3>
          <p>Threading, tie-up and treadling ready to weave.</p>
        </Link>
        <Link href="/projects" className="card">
          <div className="card__head">
            <span className="mono">Projects</span>
          </div>
          <h3>{projectCount}</h3>
          <p>Warped, dressed and weaving on the looms.</p>
        </Link>
        <Link href="/yarn" className="card">
          <div className="card__head">
            <span className="mono">Dye lots</span>
          </div>
          <h3>{yarnLots.length}</h3>
          <p>{low.length} at or below the reorder point.</p>
        </Link>
        <Link href="/releases" className="card">
          <div className="card__head">
            <span className="mono">Releases</span>
          </div>
          <h3>{releaseCount}</h3>
          <p>Immutable, checksummed patterns.</p>
        </Link>
      </div>

      <div className="panel">
        <div className="panel__head">
          <div>
            <span className="mono">On the looms</span>
            <h2>Recent projects</h2>
          </div>
          <Link href="/projects" className="quiet-link">
            All projects
          </Link>
        </div>
        {projects.length === 0 ? (
          <p className="empty-note">No projects yet. Draft cloth, then start a project.</p>
        ) : (
          <div className="table-wrap" tabIndex={0} aria-label="Recent projects table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Draft</th>
                  <th>Loom</th>
                  <th>Status</th>
                  <th className="num">Picks</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <Link href={`/projects/${project.id}`} className="quiet-link">
                        {project.name}
                      </Link>
                    </td>
                    <td>{project.draft.name}</td>
                    <td>{project.loom?.name ?? "Undressed"}</td>
                    <td>
                      <span className={`status status--${project.status.toLowerCase()}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="num">
                      {project.picksWoven}/{project.draft.picks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}