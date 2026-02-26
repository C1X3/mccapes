"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_CAPE_TEXTURES = [
  "/cape%20renders/copper-cape.png",
  "/cape%20renders/experience-cape.png",
  "/cape%20renders/home-cape.png",
  "/cape%20renders/menace-cape.png",
  "/cape%20renders/tiktok-cape.png",
  "/cape%20renders/twitch-cape.png",
] as const;

const CAPE_FACE_WIDTH = 10;
const CAPE_FACE_HEIGHT = 16;
const TEXTURE_WIDTH = 64;
const TEXTURE_HEIGHT = 32;
const FRONT_FACE = { x: 1, y: 1 };
const BACK_FACE = { x: 12, y: 1 };

// One unit maps to 8 CSS px, so scale-1 vertical is 5x8 units => 40x64 px (10x16 ratio).
const UNIT_PX = 8;
const MOTIF_UNITS = 80;
const PATTERN_ROTATION_DEG = -45;
const PATTERN_ROTATION_SCALE = 0.82;
const EXTRA_MOTIF_COLS = 2;
const EXTRA_MOTIF_ROWS = 1;

type Orientation = "v" | "h";
type Scale = 1 | 2 | 3 | 4 | 5;
type Transform = "id" | "flipX" | "flipY" | "rot180" | "rot90" | "rot270";

type MotifPiece = {
  x: number;
  y: number;
  w: number;
  h: number;
  s: Scale;
  ori: Orientation;
};

type WorldPiece = {
  x: number;
  y: number;
  w: number;
  h: number;
  s: Scale;
  ori: Orientation;
};

const MOTIF_A: MotifPiece[] = [
  { x: 0, y: 0, w: 25, h: 40, s: 5, ori: "v" },
  { x: 25, y: 0, w: 32, h: 20, s: 4, ori: "h" },
  { x: 57, y: 0, w: 10, h: 16, s: 2, ori: "v" },
  { x: 67, y: 0, w: 5, h: 8, s: 1, ori: "v" },
  { x: 72, y: 0, w: 8, h: 5, s: 1, ori: "h" },
  { x: 72, y: 5, w: 8, h: 5, s: 1, ori: "h" },
  { x: 67, y: 8, w: 5, h: 8, s: 1, ori: "v" },
  { x: 72, y: 10, w: 8, h: 5, s: 1, ori: "h" },
  { x: 72, y: 15, w: 8, h: 5, s: 1, ori: "h" },
  { x: 57, y: 16, w: 15, h: 24, s: 3, ori: "v" },
  { x: 25, y: 20, w: 32, h: 20, s: 4, ori: "h" },
  { x: 72, y: 20, w: 8, h: 5, s: 1, ori: "h" },
  { x: 72, y: 25, w: 8, h: 5, s: 1, ori: "h" },
  { x: 72, y: 30, w: 8, h: 5, s: 1, ori: "h" },
  { x: 72, y: 35, w: 8, h: 5, s: 1, ori: "h" },
  { x: 0, y: 40, w: 40, h: 25, s: 5, ori: "h" },
  { x: 40, y: 40, w: 25, h: 40, s: 5, ori: "v" },
  { x: 65, y: 40, w: 10, h: 16, s: 2, ori: "v" },
  { x: 75, y: 40, w: 5, h: 8, s: 1, ori: "v" },
  { x: 75, y: 48, w: 5, h: 8, s: 1, ori: "v" },
  { x: 65, y: 56, w: 15, h: 24, s: 3, ori: "v" },
  { x: 0, y: 65, w: 24, h: 15, s: 3, ori: "h" },
  { x: 24, y: 65, w: 16, h: 10, s: 2, ori: "h" },
  { x: 24, y: 75, w: 8, h: 5, s: 1, ori: "h" },
  { x: 32, y: 75, w: 8, h: 5, s: 1, ori: "h" },
];

const MOTIF_B: MotifPiece[] = [
  { x: 0, y: 0, w: 24, h: 15, s: 3, ori: "h" },
  { x: 24, y: 0, w: 25, h: 40, s: 5, ori: "v" },
  { x: 49, y: 0, w: 10, h: 16, s: 2, ori: "v" },
  { x: 59, y: 0, w: 5, h: 8, s: 1, ori: "v" },
  { x: 64, y: 0, w: 16, h: 10, s: 2, ori: "h" },
  { x: 59, y: 8, w: 5, h: 8, s: 1, ori: "v" },
  { x: 64, y: 10, w: 16, h: 10, s: 2, ori: "h" },
  { x: 0, y: 15, w: 24, h: 15, s: 3, ori: "h" },
  { x: 49, y: 16, w: 15, h: 24, s: 3, ori: "v" },
  { x: 64, y: 20, w: 16, h: 10, s: 2, ori: "h" },
  { x: 0, y: 30, w: 24, h: 15, s: 3, ori: "h" },
  { x: 64, y: 30, w: 16, h: 10, s: 2, ori: "h" },
  { x: 24, y: 40, w: 32, h: 20, s: 4, ori: "h" },
  { x: 56, y: 40, w: 24, h: 15, s: 3, ori: "h" },
  { x: 0, y: 45, w: 24, h: 15, s: 3, ori: "h" },
  { x: 56, y: 55, w: 16, h: 10, s: 2, ori: "h" },
  { x: 72, y: 55, w: 8, h: 5, s: 1, ori: "h" },
  { x: 0, y: 60, w: 32, h: 20, s: 4, ori: "h" },
  { x: 32, y: 60, w: 24, h: 15, s: 3, ori: "h" },
  { x: 72, y: 60, w: 8, h: 5, s: 1, ori: "h" },
  { x: 56, y: 65, w: 24, h: 15, s: 3, ori: "h" },
  { x: 32, y: 75, w: 8, h: 5, s: 1, ori: "h" },
  { x: 40, y: 75, w: 8, h: 5, s: 1, ori: "h" },
  { x: 48, y: 75, w: 8, h: 5, s: 1, ori: "h" },
];

const MOTIF_C: MotifPiece[] = [
  { x: 0, y: 0, w: 32, h: 20, s: 4, ori: "h" },
  { x: 32, y: 0, w: 25, h: 40, s: 5, ori: "v" },
  { x: 57, y: 0, w: 10, h: 16, s: 2, ori: "v" },
  { x: 67, y: 0, w: 5, h: 8, s: 1, ori: "v" },
  { x: 72, y: 0, w: 8, h: 5, s: 1, ori: "h" },
  { x: 72, y: 5, w: 8, h: 5, s: 1, ori: "h" },
  { x: 67, y: 8, w: 5, h: 8, s: 1, ori: "v" },
  { x: 72, y: 10, w: 8, h: 5, s: 1, ori: "h" },
  { x: 72, y: 15, w: 8, h: 5, s: 1, ori: "h" },
  { x: 57, y: 16, w: 15, h: 24, s: 3, ori: "v" },
  { x: 0, y: 20, w: 32, h: 20, s: 4, ori: "h" },
  { x: 72, y: 20, w: 8, h: 5, s: 1, ori: "h" },
  { x: 72, y: 25, w: 8, h: 5, s: 1, ori: "h" },
  { x: 72, y: 30, w: 8, h: 5, s: 1, ori: "h" },
  { x: 72, y: 35, w: 8, h: 5, s: 1, ori: "h" },
  { x: 0, y: 40, w: 25, h: 40, s: 5, ori: "v" },
  { x: 25, y: 40, w: 25, h: 40, s: 5, ori: "v" },
  { x: 50, y: 40, w: 25, h: 40, s: 5, ori: "v" },
  { x: 75, y: 40, w: 5, h: 8, s: 1, ori: "v" },
  { x: 75, y: 48, w: 5, h: 8, s: 1, ori: "v" },
  { x: 75, y: 56, w: 5, h: 8, s: 1, ori: "v" },
  { x: 75, y: 64, w: 5, h: 8, s: 1, ori: "v" },
  { x: 75, y: 72, w: 5, h: 8, s: 1, ori: "v" },
];

const MOTIFS = [MOTIF_A, MOTIF_B, MOTIF_C] as const;
const TRANSFORMS: Transform[] = ["id", "flipX", "flipY", "rot180", "rot90", "rot270"];

const LARGE_RANK_PATTERN = [0, 1, 0, 2, 1, 0, 3] as const;
const MID_RANK_PATTERN = [1, 2, 3, 1, 2, 4, 0] as const;
const SMALL_RANK_PATTERN = [2, 3, 4, 5, 3, 4, 5, 4, 5] as const;

const getTextureRank = (texturePath: string) => {
  const decoded = decodeURIComponent(texturePath).toLowerCase();
  if (decoded.includes("experience")) return 0;
  if (decoded.includes("followers") || decoded.includes("tiktok")) return 1;
  if (decoded.includes("menace")) return 2;
  if (decoded.includes("copper")) return 3;
  if (decoded.includes("home")) return 4;
  if (decoded.includes("purple heart") || decoded.includes("twitch")) return 5;
  return 99;
};

const sortTexturesByPriority = (input: string[]) =>
  [...input].sort((a, b) => {
    const rankDiff = getTextureRank(a) - getTextureRank(b);
    if (rankDiff !== 0) return rankDiff;
    return a.localeCompare(b);
  });

const mod = (value: number, size: number) => ((value % size) + size) % size;

const overlaps = (a0: number, a1: number, b0: number, b1: number) =>
  Math.min(a1, b1) > Math.max(a0, b0);

const touchesEdge = (a: WorldPiece, b: WorldPiece) => {
  const touchX =
    (a.x + a.w === b.x || b.x + b.w === a.x) &&
    overlaps(a.y, a.y + a.h, b.y, b.y + b.h);
  const touchY =
    (a.y + a.h === b.y || b.y + b.h === a.y) &&
    overlaps(a.x, a.x + a.w, b.x, b.x + b.w);
  return touchX || touchY;
};

const pickTexture = (
  orderedTextures: string[],
  requestedRank: number,
  disallowed: Set<string>,
) => {
  if (orderedTextures.length === 0) return "";
  const start = requestedRank % orderedTextures.length;

  for (let offset = 0; offset < orderedTextures.length; offset += 1) {
    const texture = orderedTextures[(start + offset) % orderedTextures.length];
    if (!disallowed.has(texture)) {
      return texture;
    }
  }

  return orderedTextures[start];
};

const transformPiece = (piece: MotifPiece, transform: Transform): MotifPiece => {
  if (transform === "id") return piece;
  if (transform === "flipX") {
    return { ...piece, x: MOTIF_UNITS - (piece.x + piece.w) };
  }
  if (transform === "flipY") {
    return { ...piece, y: MOTIF_UNITS - (piece.y + piece.h) };
  }
  if (transform === "rot180") {
    return {
      ...piece,
      x: MOTIF_UNITS - (piece.x + piece.w),
      y: MOTIF_UNITS - (piece.y + piece.h),
    };
  }
  if (transform === "rot90") {
    return {
      x: MOTIF_UNITS - (piece.y + piece.h),
      y: piece.x,
      w: piece.h,
      h: piece.w,
      s: piece.s,
      ori: piece.ori === "v" ? "h" : "v",
    };
  }
  return {
    x: piece.y,
    y: MOTIF_UNITS - (piece.x + piece.w),
    w: piece.h,
    h: piece.w,
    s: piece.s,
    ori: piece.ori === "v" ? "h" : "v",
  };
};

type CapeFaceSliceProps = {
  texture: string;
  frontFace: boolean;
  orientation: Orientation;
  scale: Scale;
  x: number;
  y: number;
};

const CapeFaceSlice = ({
  texture,
  frontFace,
  orientation,
  scale,
  x,
  y,
}: CapeFaceSliceProps) => {
  const faceOffset = frontFace ? FRONT_FACE : BACK_FACE;
  const verticalSize = { w: 10 * scale * 4, h: 16 * scale * 4 };
  const horizontalSize = { w: 16 * scale * 4, h: 10 * scale * 4 };
  const outer = orientation === "v" ? verticalSize : horizontalSize;

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        width: outer.w,
        height: outer.h,
        left: x,
        top: y,
      }}
    >
      <svg
        viewBox={`0 0 ${CAPE_FACE_WIDTH} ${CAPE_FACE_HEIGHT}`}
        className="absolute left-1/2 top-1/2"
        aria-hidden="true"
        focusable="false"
        style={{
          width: verticalSize.w,
          height: verticalSize.h,
          transform:
            orientation === "h"
              ? "translate(-50%, -50%) rotate(90deg)"
              : "translate(-50%, -50%)",
          imageRendering: "pixelated",
        }}
      >
        <image
          href={texture}
          x={-faceOffset.x}
          y={-faceOffset.y}
          width={TEXTURE_WIDTH}
          height={TEXTURE_HEIGHT}
          preserveAspectRatio="none"
        />
      </svg>
    </div>
  );
};

type CapeLatticePatternProps = {
  className?: string;
  motifCount?: number;
  rowCount?: number;
  showVignette?: boolean;
};

export const CapeLatticePattern = ({
  className = "",
  motifCount = 8,
  rowCount = 3,
  showVignette = true,
}: CapeLatticePatternProps) => {
  const [textures, setTextures] = useState<string[]>([...DEFAULT_CAPE_TEXTURES]);

  useEffect(() => {
    let active = true;

    const loadTextures = async () => {
      try {
        const response = await fetch("/api/cape-textures");
        if (!response.ok) return;
        const data = (await response.json()) as { textures?: string[] };
        if (!active || !Array.isArray(data.textures) || data.textures.length === 0) {
          return;
        }
        setTextures(data.textures);
      } catch {
        // Keep fallback textures.
      }
    };

    void loadTextures();
    return () => {
      active = false;
    };
  }, []);

  const orderedTextures = useMemo(
    () => sortTexturesByPriority(textures),
    [textures],
  );

  const worldPieces = useMemo(() => {
    const pieces: WorldPiece[] = [];
    for (let row = -EXTRA_MOTIF_ROWS; row < rowCount + EXTRA_MOTIF_ROWS; row += 1) {
      const xOffsetUnits = row % 2 === 0 ? 0 : MOTIF_UNITS / 2;
      for (
        let col = -1 - EXTRA_MOTIF_COLS;
        col < motifCount + EXTRA_MOTIF_COLS;
        col += 1
      ) {
        const motif = MOTIFS[mod(row * 3 + col, MOTIFS.length)];
        const transform = TRANSFORMS[mod(row * 5 + col, TRANSFORMS.length)];
        const originX = (col * MOTIF_UNITS + xOffsetUnits) * UNIT_PX;
        const originY = row * MOTIF_UNITS * UNIT_PX;

        for (const piece of motif) {
          const transformed = transformPiece(piece, transform);
          pieces.push({
            x: originX + transformed.x * UNIT_PX,
            y: originY + transformed.y * UNIT_PX,
            w: transformed.w * UNIT_PX,
            h: transformed.h * UNIT_PX,
            s: transformed.s,
            ori: transformed.ori,
          });
        }
      }
    }
    return pieces.sort((a, b) => a.y - b.y || a.x - b.x);
  }, [motifCount, rowCount]);

  const renderPieces = useMemo(() => {
    const placed: Array<WorldPiece & { texture: string; frontFace: boolean }> = [];
    const scaleCounters: Record<Scale, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    for (let index = 0; index < worldPieces.length; index += 1) {
      const piece = worldPieces[index]!;
      const disallowed = new Set<string>();

      for (const other of placed) {
        if (touchesEdge(piece, other)) {
          disallowed.add(other.texture);
        }
      }

      const counter = scaleCounters[piece.s];
      const rankPattern =
        piece.s >= 4
          ? LARGE_RANK_PATTERN
          : piece.s === 3
            ? MID_RANK_PATTERN
            : SMALL_RANK_PATTERN;
      const requestedRank = rankPattern[counter % rankPattern.length];
      const texture = pickTexture(orderedTextures, requestedRank, disallowed);
      const frontFace =
        (Math.floor(piece.x / (5 * UNIT_PX)) +
          Math.floor(piece.y / (5 * UNIT_PX)) +
          index) %
          2 ===
        0;

      scaleCounters[piece.s] += 1;
      placed.push({ ...piece, texture, frontFace });
    }

    return placed;
  }, [orderedTextures, worldPieces]);

  const patternBounds = useMemo(() => {
    if (renderPieces.length === 0) {
      return { minX: 0, minY: 0, width: 0, height: 0 };
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const piece of renderPieces) {
      minX = Math.min(minX, piece.x);
      minY = Math.min(minY, piece.y);
      maxX = Math.max(maxX, piece.x + piece.w);
      maxY = Math.max(maxY, piece.y + piece.h);
    }

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [renderPieces]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: patternBounds.width,
          height: patternBounds.height,
          transform: `translate(-50%, -50%) rotate(${PATTERN_ROTATION_DEG}deg) scale(${PATTERN_ROTATION_SCALE})`,
          transformOrigin: "center",
        }}
      >
        {renderPieces.map((piece, index) => (
          <CapeFaceSlice
            key={`${piece.x}-${piece.y}-${piece.s}-${piece.ori}-${index}`}
            texture={piece.texture}
            frontFace={piece.frontFace}
            orientation={piece.ori}
            scale={piece.s}
            x={piece.x - patternBounds.minX}
            y={piece.y - patternBounds.minY}
          />
        ))}
      </div>
      {showVignette ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_46%,rgba(0,0,0,0.12)_100%)]" />
      ) : null}
    </div>
  );
};

const CapeLattice = () => {
  return (
    <section className="relative overflow-hidden border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_8%)]">
      <div className="relative h-[26rem] md:h-[30rem]">
        <CapeLatticePattern
          motifCount={7}
          rowCount={3}
        />
      </div>
    </section>
  );
};

export default CapeLattice;
