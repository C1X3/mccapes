import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

const AFFILIATE_COOKIE_NAME = "mccapes_affiliate";
const TRACKED_COOKIE_NAME = "mccapes_tracked";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export async function POST(request: NextRequest) {
  try {
    const alreadyTracked = request.cookies.get(TRACKED_COOKIE_NAME)?.value;

    if (alreadyTracked) {
      return NextResponse.json({ success: true, alreadyTracked: true });
    }

    const affiliateCode =
      request.cookies.get(AFFILIATE_COOKIE_NAME)?.value || null;

    const ipAddress =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For")?.split(",")[0].trim() ||
      request.headers.get("X-Real-IP") ||
      null;

    let affiliateId: string | null = null;

    if (affiliateCode) {
      const affiliate = await prisma.affiliate.findFirst({
        where: {
          code: { equals: affiliateCode, mode: "insensitive" },
          active: true,
        },
      });

      if (affiliate) {
        affiliateId = affiliate.id;
      }
    }

    await prisma.siteClick.create({
      data: {
        affiliateId,
        ipAddress,
      },
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(TRACKED_COOKIE_NAME, "true", {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error tracking site click:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
