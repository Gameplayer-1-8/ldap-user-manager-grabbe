import crypto from 'crypto';

/**
 * Erstellt einen {SSHA} Hash für ein Passwort.
 * Salzt das Passwort undhasht es mit SHA-1.
 * 
 * @param password Das Klartext-Passwort
 * @returns Der fertig formattierte {SSHA}... String
 */
export function hashPassword(password: string): string {
  // 1. Zufälliges Salt generieren (4 Bytes sind Standard für SSHA)
  const salt = crypto.randomBytes(4);

  // 2. Passwort und Salt kombinieren und SHA-1 Hashen
  const sha1 = crypto.createHash('sha1');
  sha1.update(password);
  sha1.update(salt);
  const hash = sha1.digest();

  // 3. Hash und Salt zusammenfügen und Base64 encodieren
  const combined = Buffer.concat([hash, salt]);
  const base64 = combined.toString('base64');

  // 4. Präfix {SSHA} hinzufügen
  return `{SSHA}${base64}`;
}
