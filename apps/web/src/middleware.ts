import { auth } from './lib/auth';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = new Set(['/', '/login', '/register']);
const ONBOARD_PATH = '/onboard';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn   = !!req.auth;
  const isOnboarded  = !!(req.auth?.user as any)?.isOnboarded;
  const isPublic     = PUBLIC_PATHS.has(pathname);

  // Unauthenticated → login
  if (!isLoggedIn && !isPublic && pathname !== ONBOARD_PATH) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Logged-in but not onboarded → force onboarding
  if (isLoggedIn && !isOnboarded && !isPublic && pathname !== ONBOARD_PATH) {
    return NextResponse.redirect(new URL(ONBOARD_PATH, req.url));
  }

  // Onboarded users shouldn't land on /onboard again
  if (isLoggedIn && isOnboarded && pathname === ONBOARD_PATH) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  // Logged-in users away from auth pages
  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico).*)'],
};
