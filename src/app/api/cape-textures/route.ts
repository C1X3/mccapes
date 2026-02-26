import { readdir } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export async function GET() {
  try {
    const directory = path.join(process.cwd(), "public", "cape renders");
    const entries = await readdir(directory, { withFileTypes: true });

    const textures = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => `/cape renders/${encodeURIComponent(name)}`);

    return NextResponse.json({ textures });
  } catch {
    return NextResponse.json({ textures: [] }, { status: 500 });
  }
}
