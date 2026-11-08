"use client";

import { useMemo, useState } from "react";
import {
  computeWeavePlan,
  defaultColorOrders,
  structureByName,
  FLAX,
  INDIGO,
  MADDER,
  WELD,
  WALNUT,
  IRON,
} from "@/domain/weave";
import { STRUCTURES, STRUCTURE_LABELS, type Structure } from "@/domain/types";
import { saveDraftAction, createProjectAction, releaseAction } from "@/app/studio-actions";
import { DraftGrid } from "./draft-grid";
import { ClothCanvas } from "./cloth-canvas";
import { ActionForm } from "./action-form";

const COLOR_OPTIONS = [
  { name: "Flax", hex: FLAX },
  { name: "Indigo", hex: INDIGO },
  { name: "Madder", hex: MADDER },
  { name: "Weld", hex: WELD },
  { name: "Walnut", hex: WALNUT },
  { name: "Iron", hex: IRON },
];

export interface DraftEditorInitial {
  name: string;
  revision: number;
  threading: number[];
  tieUp: boolean[][];
  treadling: number[];
  warpColors: string[];
  weftColors: string[];
  settEpi: number;
  reedWidthCm: number;
  warpLengthCm: number;
  takeUpPct: number;
  shrinkagePct: number;
}

interface DraftEditorProps {
  draftId: string;
  canEdit: boolean;
  canRelease: boolean;
  initial: DraftEditorInitial;
}

export function DraftEditor({ draftId, canEdit, canRelease, initial }: DraftEditorProps) {
  const [name, setName] = useState(initial.name);
  const [revision, setRevision] = useState(initial.revision);
  const [threading, setThreading] = useState(initial.threading);
  const [tieUp, setTieUp] = useState(initial.tieUp);
  const [treadling, setTreadling] = useState(initial.treadling);
  const [warpColors, setWarpColors] = useState(initial.warpColors);
  const [weftColors, setWeftColors] = useState(initial.weftColors);
  const [dims, setDims] = useState({
    settEpi: initial.settEpi,
    reedWidthCm: initial.reedWidthCm,
    warpLengthCm: initial.warpLengthCm,
    takeUpPct: initial.takeUpPct,
    shrinkagePct: initial.shrinkagePct,
  });
  const [structure, setStructure] = useState<Structure>("twill22");
  const [genEnds, setGenEnds] = useState(initial.threading.length);
  const [genPicks, setGenPicks] = useState(initial.treadling.length);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const ends = threading.length;
  const picks = treadling.length;
  const shafts = tieUp[0]?.length ?? 2;
  const treadles = tieUp.length;

  const grids = useMemo(
    () => ({ shafts, treadles, ends, picks, threading, tieUp, treadling }),
    [shafts, treadles, ends, picks, threading, tieUp, treadling]
  );
  const colors = useMemo(() => ({ warpColors, weftColors }), [warpColors, weftColors]);
  const plan = useMemo(() => computeWeavePlan({ ends, picks }, dims), [ends, picks, dims]);

  const threadingOn = useMemo(
    () => Array.from({ length: shafts }, (_, s) => Array.from({ length: ends }, (_, e) => threading[e] === s)),
    [shafts, ends, threading]
  );
  const treadlingOn = useMemo(
    () => Array.from({ length: picks }, (_, p) => Array.from({ length: treadles }, (_, t) => treadling[p] === t)),
    [picks, treadles, treadling]
  );

  function applyStructure() {
    const g = structureByName(structure, genEnds, genPicks);
    const c = defaultColorOrders(genEnds, genPicks);
    setThreading(g.threading);
    setTieUp(g.tieUp);
    setTreadling(g.treadling);
    setWarpColors(c.warpColors);
    setWeftColors(c.weftColors);
    setMsg(null);
  }

  function setDim(key: keyof typeof dims, value: number) {
    setDims((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("draftId", draftId);
    fd.set("expectedRevision", String(revision));
    fd.set("name", name);
    fd.set("shafts", String(shafts));
    fd.set("treadles", String(treadles));
    fd.set("ends", String(ends));
    fd.set("picks", String(picks));
    fd.set("threading", JSON.stringify(threading));
    fd.set("tieUp", JSON.stringify(tieUp));
    fd.set("treadling", JSON.stringify(treadling));
    fd.set("warpColors", JSON.stringify(warpColors));
    fd.set("weftColors", JSON.stringify(weftColors));
    fd.set("settEpi", String(dims.settEpi));
    fd.set("reedWidthCm", String(dims.reedWidthCm));
    fd.set("warpLengthCm", String(dims.warpLengthCm));
    fd.set("takeUpPct", String(dims.takeUpPct));
    fd.set("shrinkagePct", String(dims.shrinkagePct));
    const result = await saveDraftAction({}, fd);
    setSaving(false);
    if (result.ok && result.revision) {
      setRevision(result.revision);
      setMsg({ ok: true, text: result.message ?? "Draft saved." });
    } else {
      setMsg({ ok: false, text: result.error ?? "The draft could not be saved." });
    }
  }

  return (
    <div className="draft-layout">
      <div className="col">
        <div className="panel">
          <div className="panel__head">
            <div>
              <span className="mono">Draft board</span>
              <h2>{name}</h2>
            </div>
            <span className="mono">
              {shafts} shafts / {treadles} treadles / rev {revision}
            </span>
          </div>

          {canEdit ? (
            <div className="draft-controls">
              <label className="field">
                <span>Structure</span>
                <select value={structure} onChange={(e) => setStructure(e.target.value as Structure)}>
                  {STRUCTURES.map((s) => (
                    <option key={s} value={s}>
                      {STRUCTURE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" style={{ maxWidth: 90 }}>
                <span>Ends</span>
                <input type="number" min={1} max={2000} value={genEnds} onChange={(e) => setGenEnds(Number(e.target.value))} />
              </label>
              <label className="field" style={{ maxWidth: 90 }}>
                <span>Picks</span>
                <input type="number" min={1} max={4000} value={genPicks} onChange={(e) => setGenPicks(Number(e.target.value))} />
              </label>
              <button type="button" className="button button--ghost button--small" onClick={applyStructure}>
                Apply structure
              </button>
            </div>
          ) : null}

          <p className="kicker">Tie-up (treadle x shaft)</p>
          <DraftGrid
            on={tieUp}
            label="Tie-up"
            cellSize={18}
            onCell={(r, c) =>
              setTieUp((grid) => grid.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? !v : v)) : row)))
            }
          />

          <p className="kicker" style={{ marginTop: 16 }}>
            Threading (shaft x end)
          </p>
          <DraftGrid
            on={threadingOn}
            label="Threading"
            cellSize={12}
            onCell={(s, e) => setThreading((arr) => arr.map((v, i) => (i === e ? s : v)))}
            onNumber={(n, _s, e) => {
              if (n <= shafts) setThreading((arr) => arr.map((v, i) => (i === e ? n - 1 : v)));
            }}
          />

          <p className="kicker" style={{ marginTop: 16 }}>
            Treadling (pick x treadle)
          </p>
          <DraftGrid
            on={treadlingOn}
            label="Treadling"
            cellSize={12}
            onCell={(p, t) => setTreadling((arr) => arr.map((v, i) => (i === p ? t : v)))}
            onNumber={(n, p) => {
              if (n <= treadles) setTreadling((arr) => arr.map((v, i) => (i === p ? n - 1 : v)));
            }}
          />
        </div>

        <div className="panel">
          <div className="panel__head">
            <div>
              <span className="mono">Drawdown</span>
              <h2>Cloth face</h2>
            </div>
            <span className="mono">
              {ends} ends x {picks} picks
            </span>
          </div>
          <div className="cloth-frame">
            <ClothCanvas grids={grids} colors={colors} cellSize={6} label={`Cloth face for ${name}, ${ends} ends by ${picks} picks.`} />
          </div>
        </div>
      </div>

      <div className="col">
        <div className="panel">
          <div className="panel__head">
            <div>
              <span className="mono">Color and weave</span>
              <h2>Yarn colors</h2>
            </div>
          </div>
          <p className="kicker">Warp</p>
          <div className="color-picker" role="group" aria-label="Warp color">
            {COLOR_OPTIONS.map((option) => (
              <button
                key={option.hex}
                type="button"
                className="color-chip"
                onClick={() => setWarpColors(Array.from({ length: ends }, () => option.hex))}
                disabled={!canEdit}
              >
                <span className="color-chip__dot" style={{ background: option.hex }} aria-hidden="true" />
                {option.name}
              </button>
            ))}
          </div>
          <p className="kicker" style={{ marginTop: 14 }}>
            Weft
          </p>
          <div className="color-picker" role="group" aria-label="Weft color">
            {COLOR_OPTIONS.map((option) => (
              <button
                key={option.hex}
                type="button"
                className="color-chip"
                onClick={() => setWeftColors(Array.from({ length: picks }, () => option.hex))}
                disabled={!canEdit}
              >
                <span className="color-chip__dot" style={{ background: option.hex }} aria-hidden="true" />
                {option.name}
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel__head">
            <div>
              <span className="mono">Sett and dimensions</span>
              <h2>Weave math</h2>
            </div>
          </div>
          {canEdit ? (
            <div className="field-row" style={{ marginBottom: 16 }}>
              <label className="field">
                <span>Sett (epi)</span>
                <input type="number" min={1} value={dims.settEpi} onChange={(e) => setDim("settEpi", Number(e.target.value))} />
              </label>
              <label className="field">
                <span>Reed width (cm)</span>
                <input type="number" min={1} value={dims.reedWidthCm} onChange={(e) => setDim("reedWidthCm", Number(e.target.value))} />
              </label>
              <label className="field">
                <span>Warp length (cm)</span>
                <input type="number" min={1} value={dims.warpLengthCm} onChange={(e) => setDim("warpLengthCm", Number(e.target.value))} />
              </label>
              <label className="field">
                <span>Take-up (%)</span>
                <input type="number" min={0} max={50} value={dims.takeUpPct} onChange={(e) => setDim("takeUpPct", Number(e.target.value))} />
              </label>
              <label className="field">
                <span>Shrinkage (%)</span>
                <input type="number" min={0} max={50} value={dims.shrinkagePct} onChange={(e) => setDim("shrinkagePct", Number(e.target.value))} />
              </label>
            </div>
          ) : null}
          <dl className="weave-math">
            <div>
              <dt>Ideal ends</dt>
              <dd>{plan.idealEnds} <small>ends</small></dd>
            </div>
            <div>
              <dt>Warp yarn</dt>
              <dd>{plan.warpMeters} <small>m</small></dd>
            </div>
            <div>
              <dt>Weft yarn</dt>
              <dd>{plan.weftMeters} <small>m</small></dd>
            </div>
            <div>
              <dt>Total yarn</dt>
              <dd>{plan.totalYarnMeters} <small>m</small></dd>
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

        {canEdit ? (
          <div className="panel">
            <div className="panel__head">
              <div>
                <span className="mono">Autosave</span>
                <h2>Save draft</h2>
              </div>
            </div>
            <label className="field" style={{ marginBottom: 14 }}>
              <span>Draft name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </label>
            <button type="button" className="button button--wide" onClick={save} disabled={saving}>
              {saving ? "Saving..." : `Save revision ${revision + 1}`}
            </button>
            {msg ? (
              <p className={msg.ok ? "form-ok" : "form-error"} role={msg.ok ? "status" : "alert"}>
                {msg.text}
              </p>
            ) : null}
            <p className="micro" style={{ marginTop: 12 }}>
              Saves are revision-checked. If someone edited this draft since you opened it, the save
              is rejected so you never overwrite their work.
            </p>
          </div>
        ) : null}

        {canEdit ? (
          <div className="panel">
            <div className="panel__head">
              <div>
                <span className="mono">From draft to cloth</span>
                <h2>Start a project</h2>
              </div>
            </div>
            <ActionForm action={createProjectAction} submitLabel="Start project" pendingLabel="Starting...">
              <input type="hidden" name="draftId" value={draftId} />
              <label className="field">
                <span>Project name</span>
                <input name="name" defaultValue={`${name} project`} required maxLength={120} />
              </label>
            </ActionForm>
          </div>
        ) : null}

        {canRelease ? (
          <div className="panel">
            <div className="panel__head">
              <div>
                <span className="mono">Manager only</span>
                <h2>Release pattern</h2>
              </div>
            </div>
            <ActionForm action={releaseAction} submitLabel="Release immutable version" pendingLabel="Releasing...">
              <input type="hidden" name="draftId" value={draftId} />
              <label className="field">
                <span>Release name</span>
                <input name="name" defaultValue={`${name} v${revision}`} required maxLength={120} />
              </label>
            </ActionForm>
          </div>
        ) : null}
      </div>
    </div>
  );
}