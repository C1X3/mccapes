import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AFFILIATE_COOKIE_NAME = 'mccapes_affiliate';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export function proxy(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const refCode = searchParams.get('ref');
  
  if (refCode) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('ref');
    
    const response = NextResponse.redirect(cleanUrl);
    
    response.cookies.set(AFFILIATE_COOKIE_NAME, refCode, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
