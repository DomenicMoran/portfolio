"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const GRID_CELL_PX = 28;
const MAX_DPR = 1.5;
const WAVE_AMPLITUDE = 0.35;
const WAVE_SPEED = 0.9;
const POINTER_INFLUENCE = 0.65;
const LINE_ALPHA = 0.14;
const FILL_ALPHA = 0.06;
const ACID_RGB = "212,255,69";

type Props = { className?: string };

export function SignalField({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const pointerRef = useRef({ x: 0.5, y: 0.35, active: false });
  const rafRef = useRef(0);
  const pausedRef = useRef(false);
  const reducedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let cols = 0;
    let rows = 0;
    let w = 0;
    let h = 0;
    let phase = 0;
    let dpr = 1;

    const layout = () => {
      const rect = parent.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / GRID_CELL_PX) + 1;
      rows = Math.ceil(h / GRID_CELL_PX) + 1;
    };

    const sample = (ix: number, iy: number, t: number) => {
      const nx = ix / Math.max(cols - 1, 1);
      const ny = iy / Math.max(rows - 1, 1);
      const wave =
        Math.sin(nx * 6.2 + t * WAVE_SPEED) * 0.5 +
        Math.cos(ny * 5.1 - t * 0.7) * 0.35;
      let z = wave * WAVE_AMPLITUDE;
      if (pointerRef.current.active && !reducedRef.current) {
        const dx = nx - pointerRef.current.x;
        const dy = ny - pointerRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        z += Math.max(0, 1 - dist * 2.8) * POINTER_INFLUENCE;
      }
      return z;
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = `rgba(${ACID_RGB},${FILL_ALPHA})`;
      const tStep = reducedRef.current ? 0 : t;

      for (let iy = 0; iy < rows - 1; iy++) {
        for (let ix = 0; ix < cols - 1; ix++) {
          const z00 = sample(ix, iy, tStep);
          const z10 = sample(ix + 1, iy, tStep);
          const z01 = sample(ix, iy + 1, tStep);
          const z11 = sample(ix + 1, iy + 1, tStep);
          const avg = (z00 + z10 + z01 + z11) / 4;
          if (avg < 0.05) continue;
          const x = ix * GRID_CELL_PX;
          const y = iy * GRID_CELL_PX;
          const size = GRID_CELL_PX * (0.55 + avg * 0.35);
          ctx.fillRect(
            x + (GRID_CELL_PX - size) / 2,
            y + (GRID_CELL_PX - size) / 2,
            size,
            size,
          );
        }
      }

      ctx.strokeStyle = `rgba(${ACID_RGB},${LINE_ALPHA})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let iy = 0; iy < rows; iy++) {
        let moved = false;
        for (let ix = 0; ix < cols; ix++) {
          const x = ix * GRID_CELL_PX;
          const y =
            iy * GRID_CELL_PX - sample(ix, iy, tStep) * GRID_CELL_PX * 2;
          if (!moved) {
            ctx.moveTo(x, y);
            moved = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      for (let ix = 0; ix < cols; ix++) {
        let moved = false;
        for (let iy = 0; iy < rows; iy++) {
          const x =
            ix * GRID_CELL_PX + sample(ix, iy, tStep) * GRID_CELL_PX * 0.5;
          const y = iy * GRID_CELL_PX;
          if (!moved) {
            ctx.moveTo(x, y);
            moved = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    };

    const loop = () => {
      if (pausedRef.current) {
        rafRef.current = 0;
        return;
      }
      frameRef.current += 1;
      phase = frameRef.current * 0.016;
      draw(phase);
      if (!reducedRef.current) {
        rafRef.current = window.requestAnimationFrame(loop);
      }
    };

    const onPointer = (clientX: number, clientY: number, active: boolean) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: (clientX - rect.left) / Math.max(rect.width, 1),
        y: (clientY - rect.top) / Math.max(rect.height, 1),
        active,
      };
    };

    layout();
    draw(reducedRef.current ? 0 : phase);

    const ro = new ResizeObserver(() => {
      layout();
      draw(reducedRef.current ? 0 : phase);
    });
    ro.observe(parent);

    const io = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? true;
        pausedRef.current = !visible || document.visibilityState === "hidden";
        if (pausedRef.current) {
          if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        } else if (!reducedRef.current && !rafRef.current) {
          rafRef.current = window.requestAnimationFrame(loop);
        }
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);

    const onVis = () => {
      if (document.visibilityState === "hidden") {
        pausedRef.current = true;
        if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      } else if (!reducedRef.current) {
        pausedRef.current = false;
        if (!rafRef.current)
          rafRef.current = window.requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const move = (e: PointerEvent) => onPointer(e.clientX, e.clientY, true);
    const leave = () => {
      pointerRef.current.active = false;
    };
    parent.addEventListener("pointermove", move, { passive: true });
    parent.addEventListener("pointerleave", leave);

    if (!reducedRef.current && !pausedRef.current) {
      rafRef.current = window.requestAnimationFrame(loop);
    }

    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      parent.removeEventListener("pointermove", move);
      parent.removeEventListener("pointerleave", leave);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none size-full", className)}
    />
  );
}
