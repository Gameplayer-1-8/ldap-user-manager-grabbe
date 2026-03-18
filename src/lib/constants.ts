export const JWT_SECRET_KEY = process.env.JWT_SECRET || 'grabbe_fallback_secret_32_chars_long_!!';
export const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY);
export const SESSION_COOKIE_NAME = 'session';
