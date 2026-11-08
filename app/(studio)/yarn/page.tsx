import type { Metadata } from "next";
import { hasRole, requireStudio } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ActionForm } from "@/components/action-form";
import { addYarnLotAction, intakeAction } from "@/app/studio-actions";

export const metadata: Metadata = { title: "Yarn" };

export default async function YarnPage() {
  const context = await requireStudio();
  const lots = await prisma.yarnLot.findMany({
    where: { studioId: context.studioId },
    orderBy: { code: "asc" },
  });
  const canDye = hasRole(context.role, ["DYER", "MANAGER"]);

  return (
    <>
      <div className="page-head">
        <div>
          <p className="kicker">The yarn cabinet</p>
          <h1>Yarn library</h1>
        </div>
        <p className="page-head__note">
          Naturally dyed yarn, tracked by dye lot. Reserving yarn for a project draws from a lot
          atomically, so two projects can never overdraw the same lot.
        </p>
      </div>

      <div className="split">
        <div className="col">
          <div className="panel">
            <div className="panel__head">
              <div>
                <span className="mono">{lots.length} dye lots</span>
                <h2>On hand</h2>
              </div>
            </div>
            <div className="table-wrap" tabIndex={0} aria-label="Yarn dye lots table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Color</th>
                    <th>Code</th>
                    <th>Fiber</th>
                    <th>Lot</th>
                    <th className="num">On hand (m)</th>
                    <th className="num">Reorder (m)</th>
                  </tr>
                </thead>
                <tbody>
                  {lots.map((lot) => (
                    <tr key={lot.id}>
                      <td>
                        <span className="swatch" style={{ background: lot.colorHex }} aria-hidden="true" />
                        {lot.colorName}
                      </td>
                      <td className="mono">{lot.code}</td>
                      <td>{lot.fiber}</td>
                      <td className="mono">{lot.lotNumber}</td>
                      <td className="num">
                        {lot.lengthOnHandM}{" "}
                        {lot.lengthOnHandM <= lot.reorderM ? (
                          <span className="status status--low">low</span>
                        ) : null}
                      </td>
                      <td className="num">{lot.reorderM}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {canDye ? (
          <div className="col">
            <div className="panel">
              <div className="panel__head">
                <div>
                  <span className="mono">Dyer or manager</span>
                  <h2>Record intake</h2>
                </div>
              </div>
              <ActionForm action={intakeAction} submitLabel="Add intake" pendingLabel="Recording...">
                <label className="field">
                  <span>Dye lot</span>
                  <select name="yarnLotId" required defaultValue={lots[0]?.id ?? ""}>
                    {lots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.colorName} ({lot.code})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Meters received</span>
                  <input name="meters" type="number" min={1} defaultValue={100} required />
                </label>
              </ActionForm>
            </div>

            <div className="panel">
              <div className="panel__head">
                <div>
                  <span className="mono">Dyer or manager</span>
                  <h2>New dye lot</h2>
                </div>
              </div>
              <ActionForm action={addYarnLotAction} submitLabel="Add dye lot" pendingLabel="Adding...">
                <div className="field-row">
                  <label className="field">
                    <span>Code</span>
                    <input name="code" placeholder="INDIGO" required maxLength={20} />
                  </label>
                  <label className="field">
                    <span>Lot number</span>
                    <input name="lotNumber" placeholder="SV-2611-IN" required maxLength={40} />
                  </label>
                </div>
                <label className="field">
                  <span>Name</span>
                  <input name="name" placeholder="Woad indigo" required maxLength={120} />
                </label>
                <div className="field-row">
                  <label className="field">
                    <span>Fiber</span>
                    <input name="fiber" placeholder="wool" required maxLength={40} />
                  </label>
                  <label className="field">
                    <span>Color name</span>
                    <input name="colorName" placeholder="Indigo" required maxLength={60} />
                  </label>
                  <label className="field">
                    <span>Color hex</span>
                    <input name="colorHex" placeholder="#2f4a6d" defaultValue="#2f4a6d" required />
                  </label>
                </div>
                <label className="field">
                  <span>Dye recipe</span>
                  <input name="dyeRecipe" placeholder="Woad vat, three dips" required maxLength={240} />
                </label>
                <div className="field-row">
                  <label className="field">
                    <span>On hand (m)</span>
                    <input name="lengthOnHandM" type="number" min={0} defaultValue={500} required />
                  </label>
                  <label className="field">
                    <span>Reorder (m)</span>
                    <input name="reorderM" type="number" min={0} defaultValue={100} required />
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