"use client";

import { useRef } from "react";

interface DraftGridProps {
  on: boolean[][];
  onCell: (r: number, c: number) => void;
  onNumber?: (n: number, r: number, c: number) => void;
  label: string;
  cellSize?: number;
}

// One of the four linked draft grids. Cells are ARIA gridcells in rows; arrow
// keys move focus, space or enter activates, and number keys assign a shaft or
// treadle. The scroll region is focusable so keyboard users can reach it.
export function DraftGrid({ on, onCell, onNumber, label, cellSize = 16 }: DraftGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rows = on.length;
  const cols = on[0]?.length ?? 0;

  function handleKey(event: React.KeyboardEvent) {
    const target = event.target as HTMLElement;
    const r = Number(target.dataset.r);
    const c = Number(target.dataset.c);
    if (Number.isNaN(r) || Number.isNaN(c)) return;
    let nr = r;
    let nc = c;
    switch (event.key) {
      case "ArrowUp":
        nr = Math.max(0, r - 1);
        break;
      case "ArrowDown":
        nr = Math.min(rows - 1, r + 1);
        break;
      case "ArrowLeft":
        nc = Math.max(0, c - 1);
        break;
      case "ArrowRight":
        nc = Math.min(cols - 1, c + 1);
        break;
      case " ":
      case "Enter":
        event.preventDefault();
        onCell(r, c);
        return;
      default:
        if (/^[1-9]$/.test(event.key) && onNumber) {
          event.preventDefault();
          onNumber(Number(event.key), r, c);
        }
        return;
    }
    event.preventDefault();
    const next = ref.current?.querySelector<HTMLElement>(`[data-r="${nr}"][data-c="${nc}"]`);
    next?.focus();
  }

  return (
    <div className="draft-grid-wrap" tabIndex={0} aria-label={`${label} scroll region`}>
      <div
        ref={ref}
        role="grid"
        aria-label={label}
        onKeyDown={handleKey}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gap: 1,
          width: "max-content",
        }}
      >
        {on.map((row, r) => (
          <div key={r} role="row" style={{ display: "contents" }}>
            {row.map((isOn, c) => (
              <button
                key={`${r}-${c}`}
                type="button"
                role="gridcell"
                data-r={r}
                data-c={c}
                tabIndex={0}
                aria-label={`${label}, row ${r + 1}, column ${c + 1}${isOn ? ", set" : ""}`}
                aria-selected={isOn}
                className={isOn ? "draft-cell draft-cell--on" : "draft-cell"}
                style={{ width: cellSize, height: cellSize }}
                onClick={() => onCell(r, c)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}