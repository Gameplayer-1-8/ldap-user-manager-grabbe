import { SignJWT, jwtVerify } from 'jose';
import { Client } from 'ldapts';
import { cookies } from 'next/headers';
import { JWT_SECRET, SESSION_COOKIE_NAME } from './constants';

const LDAP_URI = process.env.LDAP_URI || 'ldap://localhost:389';
const LDAP_ADMIN_DN = process.env.LDAP_ADMIN_DN || '';

/**
 * Überprüft die Admin-Credentials durch einen LDAP Bind-Versuch.
 */
export async function validateAdminCredentials(password: string): Promise<boolean> {
  const client = new Client({
    url: LDAP_URI,
    timeout: 5000,
    connectTimeout: 5000,
  });

  try {
    await client.bind(LDAP_ADMIN_DN, password);
    return true;
  } catch (err) {
    console.warn('[Auth] LDAP Login Auth failed:', err);
    return false;
  } finally {
    await client.unbind().catch(() => {});
  }
}

/**
 * Erstellt eine verschlüsselte Session (JWT).
 */
export async function createSession(uid: string) {
  console.log(`[Auth] Creating session for: ${uid}`);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Tage
  const session = await new SignJWT({ uid })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
  console.log(`[Auth] Session cookie set: ${SESSION_COOKIE_NAME}`);
}

/**
 * Verifiziert die Session aus dem Cookie.
 */
export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return null;

  try {
    const { payload } = await jwtVerify(session, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    console.error('[Auth] Session verification failed:', error);
    return null;
  }
}

/**
 * Löscht die Session.
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
