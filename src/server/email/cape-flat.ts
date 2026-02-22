import fs from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";

const CAPE_TEXTURE_WIDTH = 64;
const CAPE_TEXTURE_HEIGHT = 32;
const CAPE_PANEL_WIDTH = 10;
const CAPE_PANEL_HEIGHT = 16;

const FRONT_RECT = { x: 1, y: 1, w: CAPE_PANEL_WIDTH, h: CAPE_PANEL_HEIGHT };
const BACK_RECT = { x: 12, y: 1, w: CAPE_PANEL_WIDTH, h: CAPE_PANEL_HEIGHT };

function scorePanel(png: PNG, rect: { x: number; y: number; w: number; h: number }) {
  let nonTransparent = 0;
  let colorEnergy = 0;

  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx] ?? 0;
      const g = png.data[idx + 1] ?? 0;
      const b = png.data[idx + 2] ?? 0;
      const a = png.data[idx + 3] ?? 0;

      if (a > 20) {
        nonTransparent++;
        colorEnergy += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
      }
    }
  }

  return nonTransparent * 1000 + colorEnergy;
}

function writePixel(png: PNG, x: number, y: number, rgba: [number, number, number, number]) {
  const idx = (png.width * y + x) << 2;
  png.data[idx] = rgba[0];
  png.data[idx + 1] = rgba[1];
  png.data[idx + 2] = rgba[2];
  png.data[idx + 3] = rgba[3];
}

function readPixel(png: PNG, x: number, y: number): [number, number, number, number] {
  const idx = (png.width * y + x) << 2;
  return [
    png.data[idx] ?? 0,
    png.data[idx + 1] ?? 0,
    png.data[idx + 2] ?? 0,
    png.data[idx + 3] ?? 0,
  ];
}

function pickCapePanel(png: PNG) {
  const frontScore = scorePanel(png, FRONT_RECT);
  const backScore = scorePanel(png, BACK_RECT);
  return backScore >= frontScore ? BACK_RECT : FRONT_RECT;
}

export function buildFlatCapeFromTexture(texturePngBuffer: Buffer) {
  const parsed = PNG.sync.read(texturePngBuffer);
  if (parsed.width !== CAPE_TEXTURE_WIDTH || parsed.height !== CAPE_TEXTURE_HEIGHT) {
    // Non-cape texture shape. Return original payload unchanged.
    return texturePngBuffer;
  }

  const rect = pickCapePanel(parsed);
  const outW = 220;
  const outH = 352;
  const output = new PNG({ width: outW, height: outH });

  const scaleX = outW / rect.w;
  const scaleY = outH / rect.h;

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const sourceX = rect.x + Math.min(rect.w - 1, Math.floor(x / scaleX));
      const sourceY = rect.y + Math.min(rect.h - 1, Math.floor(y / scaleY));
      const rgba = readPixel(parsed, sourceX, sourceY);
      writePixel(output, x, y, rgba);
    }
  }

  return PNG.sync.write(output);
}

function normalizePublicSrc(src: string) {
  if (!src.startsWith("/")) return null;
  if (!src.startsWith("/cape renders/")) return null;

  const normalized = src.replace(/\\/g, "/");
  const relativePath = normalized.replace(/^\/+/, "");
  const filePath = path.join(process.cwd(), "public", relativePath);

  const publicRoot = path.join(process.cwd(), "public") + path.sep;
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(publicRoot)) return null;

  return resolved;
}

export async function buildFlatCapeFromPublicTexture(src: string) {
  const filePath = normalizePublicSrc(src);
  if (!filePath) {
    throw new Error("invalid_src");
  }

  const raw = await fs.readFile(filePath);
  return buildFlatCapeFromTexture(raw);
}

export function toFlatCapeImageUrl(src: string, appUrl: string) {
  const encodedSrc = encodeURIComponent(src);
  return `${appUrl}/api/email/cape-flat?src=${encodedSrc}`;
}
