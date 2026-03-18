import { NextResponse } from 'next/server';
import { validateAdminCredentials, createSession } from '../../../../lib/auth-service';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Passwort ist erforderlich.' }, { status: 400 });
    }

    const isValid = await validateAdminCredentials(password);

    if (isValid) {
      await createSession('admin');
      return NextResponse.json({ success: true, message: 'Login erfolgreich' });
    } else {
      return NextResponse.json({ error: 'Ungültiges Passwort.' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
