import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AFFILIATE_COOKIE_NAME = "mccapes_affiliate";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

const RESERVED_ROUTES = [
  "admin",
  "api",
  "cart",
  "faq",
  "order",
  "privacy",
  "shop",
  "terms",
  "videos",
  "vouches",
  "about",
  "_next",
  "favicon.ico",
];

export function proxy(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;

  // Handle legacy ?ref= query parameter for backward compatibility
  const refCode = searchParams.get("ref");
  if (refCode) {
    // Redirect to path-based format: /{code}
    const redirectUrl = new URL(`/${refCode}`, request.url);
    const response = NextResponse.redirect(redirectUrl);
    
    response.cookies.set(AFFILIATE_COOKIE_NAME, refCode, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    
    return response;
  }

  const pathSegments = pathname.split("/").filter(Boolean);

  // Only process root-level paths (e.g., /code, not /shop/something)
  if (pathSegments.length !== 1) {
    return NextResponse.next();
  }

  const potentialCode = pathSegments[0];

  // Skip reserved routes
  if (RESERVED_ROUTES.includes(potentialCode.toLowerCase())) {
    return NextResponse.next();
  }

  // Skip files with extensions
  if (potentialCode.includes(".")) {
    return NextResponse.next();
  }

  // Treat as affiliate code - set cookie and redirect to home
  const response = NextResponse.redirect(new URL("/", request.url));

  response.cookies.set(AFFILIATE_COOKIE_NAME, potentialCode, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
