import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check for session cookies (handles both local and production secure cookies)
  const hasSessionToken = 
    request.cookies.has('next-auth.session-token') || 
    request.cookies.has('__Secure-next-auth.session-token') ||
    request.cookies.has('authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token');

  const pathname = request.nextUrl.pathname;

  // Protect Dashboard Routes
  if (pathname.startsWith('/dashboard')) {
    if (!hasSessionToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Protect Client Routes (if you have protected client routes)
  // Assuming /client-portal is protected, but /client-login is public
  if (pathname.startsWith('/client-portal')) {
    if (!hasSessionToken) {
      return NextResponse.redirect(new URL('/client-login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  // Match all routes under /dashboard and /client-portal
  matcher: ['/dashboard/:path*', '/client-portal/:path*'],
}
