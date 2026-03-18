import { NextResponse } from 'next/server';
import { searchGroups, getLdapClient, getUserDns } from '../../../lib/ldap';

export async function GET() {
  try {
    const groups = await searchGroups('(|(objectClass=groupOfNames)(objectClass=posixGroup)(objectClass=groupOfUniqueNames))');
    
    const formatted = groups.map(g => {
      let cn = '';
      if (Array.isArray(g.cn)) {
        cn = g.cn[0]?.toString() || '';
      } else {
        cn = g.cn?.toString() || 'unknown';
      }

      let members = [
        ...(Array.isArray(g.member) ? g.member : (g.member ? [g.member] : [])),
        ...(Array.isArray(g.uniqueMember) ? g.uniqueMember : (g.uniqueMember ? [g.uniqueMember] : [])),
        ...(Array.isArray(g.memberUid) ? g.memberUid : (g.memberUid ? [g.memberUid] : []))
      ].map(m => m.toString());

      const adminDn = process.env.LDAP_ADMIN_DN;
      if (adminDn) {
        members = members.filter(m => m.toLowerCase() !== adminDn.toLowerCase());
      }

      return {
        cn,
        description: g.description?.toString() || '-',
        memberCount: members.length,
        members,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API Error /api/groups GET:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cn, description, members } = body;

    if (!cn) {
      return NextResponse.json({ error: 'cn (Gruppenname) ist ein Pflichtfeld.' }, { status: 400 });
    }

    const baseDn = process.env.LDAP_GROUPS_OU;
    if (!baseDn) throw new Error('LDAP_GROUPS_OU is not configured.');

    const dn = `cn=${cn},${baseDn}`;
    
    // Resolve UIDs to real DNs
    const resolvedMemberDns = await getUserDns(members || []);
    const memberDns = resolvedMemberDns.length > 0 
      ? resolvedMemberDns 
      : [process.env.LDAP_ADMIN_DN!];

    const attributes = {
      objectClass: ['groupOfNames', 'top'],
      cn,
      description: description || '',
      member: memberDns,
    };

    const client = await getLdapClient();
    try {
      await client.add(dn, attributes);
      return NextResponse.json({ success: true, message: 'Group created' }, { status: 201 });
    } finally {
      await client.unbind().catch(() => {});
    }
  } catch (error: any) {
    console.error('API Error /api/groups POST:', error);
    const isAlreadyExists = error.code === 68 || error.name === 'AlreadyExistsError';
    return NextResponse.json(
      { error: isAlreadyExists ? `Die Gruppe existiert bereits.` : (error.message || 'Fehler beim Erstellen der Gruppe') },
      { status: isAlreadyExists ? 409 : 500 }
    );
  }
}
