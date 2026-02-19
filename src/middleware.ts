import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get('admin_session');
    
    // Check if cookie exists and matches the secret (hashed or simple check)
    // For simple env based auth, we just check existence usually, 
    // or we can verify a value if we set a specific token.
    // Here we will check if it equals the value we set in the login route.
    
    if (authCookie?.value !== 'true') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
