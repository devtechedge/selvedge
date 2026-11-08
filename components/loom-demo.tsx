"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  computeDrawdown,
  twill,
  FLAX,
  INDIGO,
  MADDER,
  WELD,
  WALNUT,
  IRON,
} from "@/domain/weave";
import { ClothCanvas } from "./cloth-canvas";

const ENDS = 24;
const PICKS = 24;

const WEFT_OPTIONS = [
  { name: "Madder", hex: MADDER },
  { name: "Weld", hex: WELD },
  { name: "Indigo", hex: INDIGO },
  { name: "Walnut", hex: WALNUT },
  { name: "Iron", hex: IRON },
  { name: "Flax", hex: FLAX },
];

export function LoomDemo() {
  const base = useMemo(() => twill(ENDS, PICKS, 4, 2), []);
  const [woven, setWoven] = useState(12);
  const [weft, setWeft] = useState(MADDER);

  const grids = useMemo(
    () => ({ ...base, picks: woven, treadling: base.treadling.slice(0, woven) }),
    [base, woven]
  );
  const colors = useMemo(
    () => ({
      warpColors: Array.from({ length: ENDS }, (_, e) => (e % 2 === 0 ? INDIGO : FLAX)),
      weftColors: Array.from({ length: woven }, () => weft),
    }),
    [woven, weft]
  );
  const drawdown = useMemo(() => computeDrawdown(grids), [grids]);
  const activeTreadle = base.treadling[woven % PICKS];

  function step() {
    setWoven((w) => (w >= PICKS ? 1 : w + 1));
  }

  return (
    <div className="loom-demo">
      <div className="loom-demo__head">
        <span className="mono">4-shaft floor loom</span>
        <span className="mono">2/2 twill</span>
      </div>

      <div className="split split--even" style={{ gap: "12px" }}>
        <div className="col">
          <p className="kicker">Drawdown</p>
          <div
            className="draft-grid-wrap"
            tabIndex={0}
            aria-label="Scrollable drawdown grid"
          >
            <div
              role="img"
              aria-label={`Drawdown of a 2/2 twill, ${woven} picks woven. Filled cells raise the warp.`}
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${ENDS}, 9px)`,
                gap: "1px",
                width: "max-content",
              }}
            >
              {drawdown.flatMap((row, p) =>
                row.map((up, e) => (
                  <span
                    key={`${p}-${e}`}
                    className={up ? "draft-cell draft-cell--on" : "draft-cell"}
                    style={{ width: 9, height: 9 }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
        <div className="col">
          <p className="kicker">Cloth face</p>
          <div className="loom-demo__cloth">
            <ClothCanvas
              grids={grids}
              colors={colors}
              cellSize={11}
              label={`Woven cloth preview, 2/2 twill with indigo and flax warp and ${weft} weft.`}
            />
          </div>
        </div>
      </div>

      <div className="treadle-strip">
        <span className="mono" style={{ fontSize: 9 }}>
          Treadle
        </span>
        <div className="treadle-strip__keys" role="group" aria-label="Loom treadles">
          {[0, 1, 2, 3].map((t) => (
            <button
              key={t}
              type="button"
              className={t === activeTreadle ? "treadle-key treadle-key--active" : "treadle-key"}
              onClick={step}
              aria-label={`Treadle ${t + 1}. Weave one pick.`}
              aria-pressed={t === activeTreadle}
            >
              {t + 1}
            </button>
          ))}
        </div>
        <button type="button" className="text-button" onClick={() => setWoven(1)}>
          Unweave
        </button>
        <span className="mono" style={{ fontSize: 9, marginLeft: "auto" }}>
          {woven}/{PICKS} picks
        </span>
      </div>

      <div className="color-picker" role="group" aria-label="Weft yarn color">
        {WEFT_OPTIONS.map((option) => (
          <button
            key={option.hex}
            type="button"
            className={weft === option.hex ? "color-chip color-chip--active" : "color-chip"}
            onClick={() => setWeft(option.hex)}
            aria-pressed={weft === option.hex}
          >
            <span className="color-chip__dot" style={{ background: option.hex }} aria-hidden="true" />
            {option.name}
          </button>
        ))}
      </div>

      <p className="loom-demo__note">
        Step a treadle to open the shed and grow the cloth. Switch the weft to see color-and-weave.
        The drawdown is computed live by the deterministic engine, with no network call.
      </p>
      <Link href="/login" className="button button--wide" style={{ marginTop: 14 }}>
        Save to your studio
      </Link>
    </div>
  );
}