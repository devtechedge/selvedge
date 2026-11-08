"use client";

import { useEffect, useRef } from "react";
import {
  computeClothFace,
  computeDrawdown,
  type ColorOrders,
  type DraftGrids,
} from "@/domain/weave";

interface ClothCanvasProps {
  grids: DraftGrids;
  colors: ColorOrders;
  cellSize?: number;
  label: string;
}

// Renders the woven face on a canvas so even a full 240 x 600 cloth stays fast.
// Each cell is filled with the face color, then a lighter stripe shows the
// thread direction: vertical where the warp is raised, horizontal for the weft.
export function ClothCanvas({ grids, colors, cellSize = 8, label }: ClothCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const longest = Math.max(grids.ends, grids.picks, 1);
    const cell = Math.max(1, Math.min(cellSize, Math.floor(1200 / longest)));
    const width = grids.ends * cell;
    const height = grids.picks * cell;
    canvas.width = width;
    canvas.height = height;

    const face = computeClothFace(computeDrawdown(grids), colors);
    for (let p = 0; p < grids.picks; p++) {
      for (let e = 0; e < grids.ends; e++) {
        const c = face[p][e];
        ctx.fillStyle = c.color;
        ctx.fillRect(e * cell, p * cell, cell, cell);
        if (cell >= 3) {
          ctx.fillStyle = "rgba(255,255,255,0.16)";
          if (c.warpUp) {
            ctx.fillRect(e * cell + cell * 0.34, p * cell, cell * 0.32, cell);
          } else {
            ctx.fillRect(e * cell, p * cell + cell * 0.34, cell, cell * 0.32);
          }
        }
      }
    }
  }, [grids, colors, cellSize]);

  return <canvas ref={ref} role="img" aria-label={label} />;
}