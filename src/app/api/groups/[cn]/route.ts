import { NextResponse } from 'next/server';
import { getLdapClient, getUserDns } from '../../../../lib/ldap';
import { Change, Attribute } from 'ldapts';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cn: string }> }
) {
  try {
    const { cn } = await params;
    const body = await request.json();
    const { description, members } = body;

    const baseDn = process.env.LDAP_GROUPS_OU;
    if (!baseDn) throw new Error('LDAP_GROUPS_OU is not configured.');

    const dn = `cn=${cn},${baseDn}`;
    const client = await getLdapClient();

    try {
      const changes: Change[] = [];

      if (description !== undefined) {
        changes.push(new Change({ 
          operation: 'replace', 
          modification: new Attribute({ type: 'description', values: [description] }) 
        }));
      }

      if (members && Array.isArray(members)) {
        // Resolve UIDs to real DNs
        const resolvedMemberDns = await getUserDns(members);
        const memberDns = resolvedMemberDns.length > 0 
          ? resolvedMemberDns 
          : [process.env.LDAP_ADMIN_DN!]; // groupOfNames muss mind. 1 Mitglied haben

        changes.push(new Change({ 
          operation: 'replace', 
          modification: new Attribute({ type: 'member', values: memberDns }) 
        }));
      }

      if (changes.length > 0) {
        await client.modify(dn, changes);
      }

      return NextResponse.json({ success: true, message: 'Group updated' });
    } finally {
      await client.unbind().catch(() => {});
    }
  } catch (error: any) {
    console.error('API Error /api/groups/[cn] PATCH:', error);
    return NextResponse.json(
      { error: error.message || 'Fehler beim Aktualisieren der Gruppe' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ cn: string }> }
) {
  try {
    const { cn } = await params;
    const baseDn = process.env.LDAP_GROUPS_OU;
    if (!baseDn) throw new Error('LDAP_GROUPS_OU is not configured.');

    const dn = `cn=${cn},${baseDn}`;
    const client = await getLdapClient();

    try {
      await client.del(dn);
      return NextResponse.json({ success: true, message: 'Group deleted' });
    } finally {
      await client.unbind().catch(() => {});
    }
  } catch (error: any) {
    console.error('API Error /api/groups/[cn] DELETE:', error);
    return NextResponse.json(
      { error: error.message || 'Fehler beim Löschen der Gruppe' },
      { status: 500 }
    );
  }
}
