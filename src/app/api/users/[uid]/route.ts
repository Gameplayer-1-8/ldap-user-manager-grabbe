import { NextResponse } from 'next/server';
import { getLdapClient } from '../../../../lib/ldap';
import { hashPassword } from '../../../../lib/auth';
import { Change, Attribute } from 'ldapts';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const body = await request.json();
    const { givenName, sn, displayName, mail, userPassword, initials, birthday, phone, mobile, fax, department, photo, cloudQuota, mailQuota, disabled } = body;

    const baseDn = process.env.LDAP_USERS_OU;
    if (!baseDn) throw new Error('LDAP_USERS_OU is not configured.');

    const client = await getLdapClient();

    try {
      const { searchEntries } = await client.search(baseDn, {
        scope: 'sub',
        filter: `(uid=${uid})`,
        attributes: ['dn', 'objectClass'],
      });

      if (searchEntries.length === 0) {
        return NextResponse.json({ error: 'Benutzer nicht gefunden.' }, { status: 404 });
      }

      let dn = searchEntries[0].dn;
      
      if (department) {
        let targetParent = process.env.LDAP_USERS_OU;
        if (department === 'lehrer') targetParent = `ou=Lehrer,${targetParent}`;
        else if (department === 'verwaltung') targetParent = `ou=Verwaltung,${targetParent}`;

        if (!dn.toLowerCase().includes(targetParent!.toLowerCase())) {
          const oldDn = dn;
          const newDn = `uid=${uid},${targetParent}`;
          
          await client.modifyDN(oldDn, newDn);
          dn = newDn;

          const groupsOu = process.env.LDAP_GROUPS_OU;
          if (groupsOu) {
            const { searchEntries: memberGroups } = await client.search(groupsOu, {
              scope: 'sub',
              filter: `(|(member=${oldDn})(uniqueMember=${oldDn}))`,
              attributes: ['dn', 'member', 'uniqueMember'],
            });

            for (const group of memberGroups) {
              const groupDn = group.dn;
              const attrType = group.member ? 'member' : 'uniqueMember';
              const existingMembers = Array.isArray(group[attrType]) 
                ? group[attrType] as string[] 
                : [group[attrType] as string];

              const updatedMembers = existingMembers.map(m => 
                m.toLowerCase() === oldDn.toLowerCase() ? newDn : m
              );

              await client.modify(groupDn, [
                new Change({
                  operation: 'replace',
                  modification: new Attribute({ type: attrType, values: updatedMembers })
                })
              ]);
            }
          }
        }
      }

      const changes: Change[] = [];

      if (givenName) changes.push(new Change({ operation: 'replace', modification: new Attribute({ type: 'givenName', values: [givenName] }) }));
      if (sn) changes.push(new Change({ operation: 'replace', modification: new Attribute({ type: 'sn', values: [sn] }) }));
      if (displayName) changes.push(new Change({ operation: 'replace', modification: new Attribute({ type: 'displayName', values: [displayName] }) }));
      if (mail) changes.push(new Change({ operation: 'replace', modification: new Attribute({ type: 'mail', values: [mail] }) }));
      if (initials) changes.push(new Change({ operation: 'replace', modification: new Attribute({ type: 'initials', values: [initials] }) }));
      if (phone) changes.push(new Change({ operation: 'replace', modification: new Attribute({ type: 'telephoneNumber', values: [phone] }) }));
      if (mobile) changes.push(new Change({ operation: 'replace', modification: new Attribute({ type: 'mobile', values: [mobile] }) }));
      if (fax) changes.push(new Change({ operation: 'replace', modification: new Attribute({ type: 'facsimileTelephoneNumber', values: [fax] }) }));
      
      if (photo) {
        const base64Data = photo.includes(',') ? photo.split(',')[1] : photo;
        changes.push(new Change({ 
          operation: 'replace', 
          modification: new Attribute({ type: 'jpegPhoto', values: [Buffer.from(base64Data, 'base64')] }) 
        }));
      }
      
      if (birthday) {
        changes.push(new Change({ operation: 'replace', modification: new Attribute({ type: 'grabbeBirthday', values: [birthday] }) }));
      }

      if (userPassword) {
        changes.push(new Change({ 
          operation: 'replace', 
          modification: new Attribute({ type: 'userPassword', values: [hashPassword(userPassword)] }) 
        }));
      }

      if (cloudQuota !== undefined) {
        const formattedCloud = cloudQuota ? (cloudQuota.toString().endsWith('GB') ? cloudQuota.toString() : `${cloudQuota}GB`) : '';
        changes.push(new Change({ 
          operation: 'replace', 
          modification: new Attribute({ type: 'cloudQuota', values: [formattedCloud] }) 
        }));
      }

      if (mailQuota !== undefined) {
        const formattedMail = (mailQuota === 'infinite') ? 'infinite' : (mailQuota ? (mailQuota.toString().endsWith('GB') ? mailQuota.toString() : `${mailQuota}GB`) : '');
        changes.push(new Change({ 
          operation: 'replace', 
          modification: new Attribute({ type: 'mailQuota', values: [formattedMail] }) 
        }));
      }

      if (disabled !== undefined) {
        changes.push(new Change({ 
          operation: 'replace', 
          modification: new Attribute({ type: 'employeeType', values: [disabled ? 'disabled' : 'active'] }) 
        }));
      }

      // Add grabbePerson if any custom field is written and it's not already there
      const currentOCs = searchEntries[0].objectClass ? (Array.isArray(searchEntries[0].objectClass) ? searchEntries[0].objectClass : [searchEntries[0].objectClass]) : [];
      const hasGrabbePerson = currentOCs.some((oc: any) => oc.toString().toLowerCase() === 'grabbeperson');

      if ((birthday || cloudQuota || mailQuota) && !hasGrabbePerson) {
        changes.push(new Change({ operation: 'add', modification: new Attribute({ type: 'objectClass', values: ['grabbePerson'] }) }));
      }

      if (changes.length > 0) {
        await client.modify(dn, changes);
      }

      return NextResponse.json({ success: true, message: 'User updated' });
    } finally {
      await client.unbind().catch(() => {});
    }
  } catch (error: any) {
    console.error('API Error /api/users/[uid] PATCH:', error);
    return NextResponse.json(
      { error: error.message || 'Fehler beim Aktualisieren des Benutzers' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const baseDn = process.env.LDAP_USERS_OU;
    if (!baseDn) throw new Error('LDAP_USERS_OU is not configured.');

    const client = await getLdapClient();

    try {
      const { searchEntries } = await client.search(baseDn, {
        scope: 'sub',
        filter: `(uid=${uid})`,
        attributes: ['dn'],
      });

      if (searchEntries.length === 0) {
        return NextResponse.json({ error: 'Benutzer nicht gefunden.' }, { status: 404 });
      }

      const dn = searchEntries[0].dn;

      const groupsOu = process.env.LDAP_GROUPS_OU;
      const adminDn = process.env.LDAP_ADMIN_DN;
      
      if (groupsOu) {
        const { searchEntries: memberGroups } = await client.search(groupsOu, {
          scope: 'sub',
          filter: `(|(member=${dn})(uniqueMember=${dn}))`,
          attributes: ['dn', 'member', 'uniqueMember'],
        });

        for (const group of memberGroups) {
          const groupDn = group.dn;
          const attrType = group.member ? 'member' : 'uniqueMember';
          const existingMembers = Array.isArray(group[attrType]) 
            ? group[attrType] as string[] 
            : [group[attrType] as string];

          let newMembers = existingMembers.filter(m => m.toLowerCase() !== dn.toLowerCase());

          if (newMembers.length === 0 && adminDn) {
            newMembers = [adminDn];
          }

          if (newMembers.length > 0) {
            await client.modify(groupDn, [
              new Change({
                operation: 'replace',
                modification: new Attribute({ type: attrType, values: newMembers })
              })
            ]);
          }
        }
      }

      await client.del(dn);
      return NextResponse.json({ success: true, message: 'User deleted' });
    } finally {
      await client.unbind().catch(() => {});
    }
  } catch (error: any) {
    console.error('API Error /api/users/[uid] DELETE:', error);
    return NextResponse.json(
      { error: error.message || 'Fehler beim Löschen des Benutzers' },
      { status: 500 }
    );
  }
}
