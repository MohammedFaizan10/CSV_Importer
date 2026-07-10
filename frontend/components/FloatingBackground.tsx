"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ────────────────────────────────────────────
   Configuration
   ──────────────────────────────────────────── */

interface FloatingObjectConfig {
  id: number;
  x: number;
  y: number;
  size: number;
  radius: number;
  rotation: number;
  driftDuration: number;
  delay: number;
  variant: "outlined" | "filled";
  opacity: number;
  driftX: number;
  driftY: number;
}

const OBJECTS_DESKTOP: FloatingObjectConfig[] = [
  { id: 0, x: 5,  y: 10, size: 120, radius: 20, rotation: 12,  driftDuration: 22, delay: 0,   variant: "outlined", opacity: 0.6,  driftX: 12, driftY: 8  },
  { id: 1, x: 80, y: 5,  size: 80,  radius: 16, rotation: -8,  driftDuration: 26, delay: 2.5, variant: "filled",   opacity: 0.45, driftX: 8,  driftY: 10 },
  { id: 2, x: 50, y: 30, size: 60,  radius: 12, rotation: 25,  driftDuration: 20, delay: 5,   variant: "outlined", opacity: 0.5,  driftX: 10, driftY: 7  },
  { id: 3, x: 12, y: 55, size: 100, radius: 18, rotation: -15, driftDuration: 28, delay: 1.2, variant: "filled",   opacity: 0.35, driftX: 7,  driftY: 12 },
  { id: 4, x: 85, y: 50, size: 70,  radius: 50, rotation: 0,   driftDuration: 24, delay: 3.8, variant: "outlined", opacity: 0.55, driftX: 11, driftY: 6  },
  { id: 5, x: 35, y: 72, size: 90,  radius: 20, rotation: 18,  driftDuration: 19, delay: 6.5, variant: "filled",   opacity: 0.3,  driftX: 6,  driftY: 9  },
  { id: 6, x: 68, y: 80, size: 55,  radius: 10, rotation: -22, driftDuration: 25, delay: 4.2, variant: "outlined", opacity: 0.5,  driftX: 9,  driftY: 8  },
  { id: 7, x: 25, y: 18, size: 65,  radius: 50, rotation: 0,   driftDuration: 30, delay: 7,   variant: "filled",   opacity: 0.3,  driftX: 8,  driftY: 10 },
];

const OBJECTS_MOBILE = OBJECTS_DESKTOP.slice(0, 5).map((o) => ({
  ...o,
  size: Math.round(o.size * 0.55),
  driftX: Math.round(o.driftX * 0.6),
  driftY: Math.round(o.driftY * 0.6),
}));

/* ────────────────────────────────────────────
   Keyframes (injected once, static)
   ──────────────────────────────────────────── */

function buildKeyframesCSS(objects: FloatingObjectConfig[]): string {
  return objects
    .map(
      (o) => `
@keyframes fb-drift-${o.id} {
  0%   { transform: translate(0px, 0px) rotate(${o.rotation}deg); }
  25%  { transform: translate(${o.driftX}px, ${-o.driftY}px) rotate(${o.rotation + 2}deg); }
  50%  { transform: translate(${-o.driftX * 0.6}px, ${o.driftY * 0.8}px) rotate(${o.rotation - 1.5}deg); }
  75%  { transform: translate(${o.driftX * 0.4}px, ${-o.driftY * 0.3}px) rotate(${o.rotation + 1}deg); }
  100% { transform: translate(0px, 0px) rotate(${o.rotation}deg); }
}`
    )
    .join("\n");
}

/* ────────────────────────────────────────────
   Container
   ──────────────────────────────────────────── */

export default function FloatingBackground() {
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 640px)");
    const rmql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsMobile(mql.matches);
    setReducedMotion(rmql.matches);

    const onResize = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    const onMotion = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onResize);
    rmql.addEventListener("change", onMotion);
    return () => {
      mql.removeEventListener("change", onResize);
      rmql.removeEventListener("change", onMotion);
    };
  }, []);

  /* Pause animations when tab is hidden */
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const onVis = () => {
      const state = document.hidden ? "paused" : "running";
      layer.querySelectorAll<HTMLElement>(".fb-anim").forEach((el) => {
        el.style.animationPlayState = state;
      });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const objects = isMobile ? OBJECTS_MOBILE : OBJECTS_DESKTOP;

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Static keyframes — injected once */}
      <style>{buildKeyframesCSS(objects)}</style>

      {objects.map((obj) => (
        <FloatingShape key={obj.id} config={obj} reducedMotion={reducedMotion} />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   Individual Shape
   Two-div approach:
   - Outer: positioned + drag transform
   - Inner: CSS animation + visual styling
   ──────────────────────────────────────────── */

function FloatingShape({
  config,
  reducedMotion,
}: {
  config: FloatingObjectConfig;
  reducedMotion: boolean;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [settling, setSettling] = useState(false);

  const clamp = useCallback(
    (dx: number, dy: number) => {
      const baseX = (config.x / 100) * window.innerWidth;
      const baseY = (config.y / 100) * window.innerHeight;
      const minX = -baseX;
      const minY = -baseY;
      const maxX = window.innerWidth - baseX - config.size;
      const maxY = window.innerHeight - baseY - config.size;
      return {
        x: Math.max(minX, Math.min(maxX, dx)),
        y: Math.max(minY, Math.min(maxY, dy)),
      };
    },
    [config.x, config.y, config.size]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      outerRef.current?.setPointerCapture(e.pointerId);
      isDragging.current = true;
      startPointer.current = { x: e.clientX, y: e.clientY };
      startOffset.current = { x: offset.x, y: offset.y };
      setSettling(false);
    },
    [offset]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - startPointer.current.x + startOffset.current.x;
      const dy = e.clientY - startPointer.current.y + startOffset.current.y;
      setOffset(clamp(dx, dy));
    },
    [clamp]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    outerRef.current?.releasePointerCapture(e.pointerId);
    setSettling(true);
    setOffset({ x: 0, y: 0 });
  }, []);

  const onTransitionEnd = useCallback(() => setSettling(false), []);

  const isCircle = config.radius >= 50;

  /* Visual styles — outlined uses accent border, filled uses gradient + glow */
  const innerStyle: React.CSSProperties =
    config.variant === "outlined"
      ? {
          border: "1.5px solid var(--accent)",
          background: "rgba(200, 169, 110, 0.03)",
        }
      : {
          border: "none",
          background:
            "linear-gradient(135deg, var(--accent-dim) 0%, rgba(200, 169, 110, 0.06) 100%)",
          boxShadow: "0 0 40px 8px var(--accent-glow)",
        };

  return (
    <div
      ref={outerRef}
      className="fb-obj"
      style={{
        position: "absolute",
        left: `${config.x}%`,
        top: `${config.y}%`,
        width: config.size,
        height: config.size,
        pointerEvents: "auto",
        cursor: "grab",
        willChange: "transform",
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: settling
          ? "transform 450ms cubic-bezier(0.34, 1.56, 0.64, 1)"
          : "none",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onTransitionEnd={onTransitionEnd}
    >
      <div
        className="fb-anim"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: isCircle ? "50%" : config.radius,
          opacity: config.opacity,
          animation: reducedMotion
            ? "none"
            : `fb-drift-${config.id} ${config.driftDuration}s ease-in-out ${config.delay}s infinite alternate`,
          ...innerStyle,
        }}
      />
    </div>
  );
}
