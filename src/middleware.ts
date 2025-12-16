import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AFFILIATE_COOKIE_NAME = 'mccapes_affiliate';
const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export async function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const refCode = searchParams.get('ref');
  
  if (refCode) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('ref');
    
    const response = NextResponse.redirect(cleanUrl);
    
    response.cookies.set(AFFILIATE_COOKIE_NAME, refCode, {
      maxAge: AFFILIATE_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    const baseUrl = request.nextUrl.origin;
    const ipAddress = request.headers.get('CF-Connecting-IP') || 
                      request.headers.get('X-Forwarded-For') || 
                      request.headers.get('X-Real-IP') || 
                      'unknown';
    
    try {
      await fetch(`${baseUrl}/api/affiliate-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: refCode,
          ipAddress: ipAddress.split(',')[0].trim(),
        }),
      });
    } catch (error) {
      console.error('Failed to track affiliate click:', error);
    }
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
