import { NextRequest, NextResponse } from "next/server";
import { buildFlatCapeFromPublicTexture } from "@/server/email/cape-flat";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");

  if (!src) {
    return NextResponse.json({ error: "src is required" }, { status: 400 });
  }

  try {
    const png = await buildFlatCapeFromPublicTexture(src);

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_src") {
      return NextResponse.json({ error: "invalid src" }, { status: 400 });
    }

    console.error("Failed to generate flat cape image", error);
    return NextResponse.json(
      { error: "failed to generate image" },
      { status: 500 },
    );
  }
}
