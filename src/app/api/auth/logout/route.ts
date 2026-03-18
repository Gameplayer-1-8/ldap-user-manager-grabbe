import { NextResponse } from 'next/server';
import { deleteSession } from '../../../../lib/auth-service';

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ success: true, message: 'Logout erfolgreich' });
  } catch (error: any) {
    console.error('Logout API Error:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
