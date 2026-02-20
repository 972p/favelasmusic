import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Only protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get('admin_session');
    
    if (authCookie?.value !== 'true') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Add aggressive cache control headers to prevent LiteSpeed from caching RSC payloads
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');

  return res;
}

export const config = {
  matcher: '/admin/:path*',
};
