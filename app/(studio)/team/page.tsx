import type { Metadata } from "next";
import { hasRole, requireStudio } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ActionForm } from "@/components/action-form";
import { changeRoleAction } from "@/app/studio-actions";
import { ROLES } from "@/domain/types";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const context = await requireStudio();
  const members = await prisma.membership.findMany({
    where: { studioId: context.studioId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  const canManage = hasRole(context.role, ["MANAGER"]);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="kicker">The studio people</p>
          <h1>Team</h1>
        </div>
        <p className="page-head__note">
          Weavers draft and weave, dyers keep the yarn, and managers run the looms and release
          patterns. Every role is enforced on the server.
        </p>
      </div>

      <div className="panel">
        <div className="panel__head">
          <div>
            <span className="mono">{members.length} members</span>
            <h2>Roles</h2>
          </div>
        </div>
        <div className="table-wrap" tabIndex={0} aria-label="Studio members table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                {canManage ? <th>Change role</th> : null}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.user.name}</td>
                  <td className="mono">{member.user.email}</td>
                  <td>
                    <span className="status status--weaving">{member.role}</span>
                  </td>
                  {canManage ? (
                    <td>
                      <ActionForm
                        action={changeRoleAction}
                        submitLabel="Update"
                        pendingLabel="..."
                        buttonClassName="button button--small button--ghost"
                        className="field-row"
                      >
                        <input type="hidden" name="membershipId" value={member.id} />
                        <label className="field">
                          <span className="sr-only">Role for {member.user.name}</span>
                          <select name="role" defaultValue={member.role} aria-label={`Role for ${member.user.name}`}>
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </label>
                      </ActionForm>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}