import { NextResponse } from 'next/server';
import { searchUsers, getLdapClient } from '../../../lib/ldap';
import { hashPassword } from '../../../lib/auth';

export async function GET() {
  try {
    const users = await searchUsers('(|(objectClass=inetOrgPerson)(objectClass=posixAccount))');
    const formatted = users.map(u => {
      let cn = '';
      if (Array.isArray(u.cn)) {
        cn = u.cn[0]?.toString() || '';
      } else {
        cn = u.cn?.toString() || '';
      }

      let uid = '';
      if (Array.isArray(u.uid)) {
        uid = u.uid[0]?.toString() || '';
      } else {
        uid = u.uid?.toString() || cn || 'unknown';
      }

      let displayName = u.displayName?.toString() || cn || uid;
      let sn = u.sn?.toString() || '';
      
      let initials = u.initials?.toString() || '';
      if (!initials && sn.length > 0) {
          initials = sn.substring(0, 3).toUpperCase();
      } else if (!initials) {
          initials = uid.substring(0, 3).toUpperCase();
      }

      let department = 'users';
      if (u.dn.toLowerCase().includes('ou=lehrer')) department = 'lehrer';
      else if (u.dn.toLowerCase().includes('ou=verwaltung')) department = 'verwaltung';

      return {
        uid,
        displayName,
        mail: u.mail?.toString() || '-',
        initials: initials.toUpperCase(),
        birthday: u.grabbeBirthday?.toString() || null,
        department,
        phone: u.telephoneNumber?.toString() || null,
        mobile: u.mobile?.toString() || null,
        fax: u.facsimileTelephoneNumber?.toString() || null,
        photo: u.jpegPhoto ? `data:image/jpeg;base64,${Buffer.from(u.jpegPhoto as Buffer).toString('base64')}` : null,
        cloudQuota: u.cloudQuota?.toString() || null,
        mailQuota: u.mailQuota?.toString() || null,
        disabled: u.employeeType?.toString() === 'disabled',
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API Error /api/users:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, givenName, sn, displayName, mail, userPassword, initials, birthday, department, phone, mobile, fax, photo, cloudQuota, mailQuota, disabled } = body;

    if (!uid || !sn || !givenName) {
      return NextResponse.json({ error: 'uid, givenName und sn (Nachname) sind Pflichtfelder.' }, { status: 400 });
    }

    const cn = displayName || `${givenName} ${sn}`;
    let baseDn = process.env.LDAP_USERS_OU;
    if (!baseDn) throw new Error('LDAP_USERS_OU is not configured.');

    if (department === 'lehrer') {
      baseDn = `ou=Lehrer,${baseDn}`;
    } else if (department === 'verwaltung') {
      baseDn = `ou=Verwaltung,${baseDn}`;
    }

    const dn = `uid=${uid},${baseDn}`;

    const objectClass = ['inetOrgPerson', 'top'];
    if (birthday || cloudQuota || mailQuota) {
        objectClass.push('grabbePerson');
    }

    const attributes: any = {
      objectClass,
      cn,
      sn,
      givenName,
      uid,
      displayName: cn,
    };

    if (mail) attributes.mail = mail;
    if (userPassword) attributes.userPassword = hashPassword(userPassword);
    if (initials) attributes.initials = initials;
    if (birthday) attributes.grabbeBirthday = birthday;
    if (phone) attributes.telephoneNumber = phone;
    if (mobile) attributes.mobile = mobile;
    if (fax) attributes.facsimileTelephoneNumber = fax;
    if (photo) {
      const base64Data = photo.split(',')[1] || photo;
      attributes.jpegPhoto = Buffer.from(base64Data, 'base64');
    }
    if (cloudQuota) attributes.cloudQuota = cloudQuota.toString().endsWith('GB') ? cloudQuota.toString() : `${cloudQuota}GB`;
    if (mailQuota) {
      attributes.mailQuota = (mailQuota === 'infinite') ? 'infinite' : (mailQuota.toString().endsWith('GB') ? mailQuota.toString() : `${mailQuota}GB`);
    }
    if (disabled !== undefined) {
      attributes.employeeType = disabled ? 'disabled' : 'active';
    }

    const client = await getLdapClient();
    try {
      if (initials) {
        const existingWithInitials = await client.search(process.env.LDAP_USERS_OU!, {
          scope: 'sub',
          filter: `(initials=${initials})`,
          attributes: ['uid'],
        });
        if (existingWithInitials.searchEntries.length > 0) {
          return NextResponse.json({ error: `Das Kürzel '${initials}' ist bereits vergeben.` }, { status: 409 });
        }
      }

      await client.add(dn, attributes);
      
      if (baseDn.toLowerCase().includes('ou=lehrer')) {
        const groupDn = `cn=lehrer,ou=groups,${process.env.LDAP_BASE_DN}`;
        const { Change, Attribute } = await import('ldapts');
        await client.modify(groupDn, [
          new Change({ operation: 'add', modification: new Attribute({ type: 'member', values: [dn] }) })
        ]).catch(err => console.warn('Could not add to group automatically:', err.message));
      }

    } finally {
      await client.unbind().catch(() => {});
    }

    return NextResponse.json({ success: true, message: 'User created' }, { status: 201 });
  } catch (error: any) {
    console.error('API Error /api/users POST:', error);
    const isAlreadyExists = error.code === 68 || 
                          error.name === 'AlreadyExistsError' || 
                          error.message?.includes('Already exists');

    return NextResponse.json(
      { error: isAlreadyExists ? `Der Benutzer existiert bereits oder die UID ist belegt.` : (error.message || 'Fehler beim Erstellen des Benutzers') },
      { status: isAlreadyExists ? 409 : 500 }
    );
  }
}
