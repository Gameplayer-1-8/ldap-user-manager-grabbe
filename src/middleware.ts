import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';
import { jwtVerify } from 'jose';
import { JWT_SECRET, SESSION_COOKIE_NAME } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Processing path: ${pathname}`);

  // 1. Erlaube Zugriff auf Login-Seite und Auth-APIs
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 2. Erlaube Zugriff auf statische Dateien und Bilder
  if (
    pathname.startsWith('/_next') || 
    pathname.includes('.') || 
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // 3. Überprüfe die Session
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  console.log(`[Middleware] Session Cookie (${SESSION_COOKIE_NAME}): ${session ? 'Gefunden' : 'Fehlt'}`);

  if (!session) {
    console.log('[Middleware] Keine Session, redirect zu /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verifiziere das Token
    await jwtVerify(session, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    console.log('[Middleware] JWT verifiziert, Zugriff erlaubt');
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] JWT Verifizierung fehlgeschlagen:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
