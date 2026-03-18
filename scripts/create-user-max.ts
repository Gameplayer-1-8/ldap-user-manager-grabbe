import { Client, Change, Attribute } from 'ldapts';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const LDAP_URI = process.env.LDAP_URI || '';
const LDAP_ADMIN_DN = process.env.LDAP_ADMIN_DN || '';
const LDAP_ADMIN_PASSWORD = process.env.LDAP_ADMIN_PASSWORD || '';
const BASE_DN = process.env.LDAP_BASE_DN || 'dc=grabbe-gymnasium,dc=cloud';

async function createUser() {
  const client = new Client({ url: LDAP_URI });
  try {
    await client.bind(LDAP_ADMIN_DN, LDAP_ADMIN_PASSWORD);
    
    const uid = 'm.mustermann';
    const oldDn = `uid=mmustermann,ou=Lehrer,ou=users,${BASE_DN}`;
    const dn = `uid=${uid},ou=Lehrer,ou=users,${BASE_DN}`;

    const attributes = {
      objectClass: ['inetOrgPerson', 'top'],
      cn: 'Max Mustermann',
      sn: 'Mustermann',
      givenName: 'Max',
      uid: uid,
      mail: 'm.mustermann@grabbe-gymnasium.cloud',
      description: 'Geburtstag: 20.10.2000',
    };

    console.log(`Re-creating user ${dn} as pure inetOrgPerson...`);
    try {
      await client.del(oldDn);
      console.log('Deleted old mmustermann version...');
    } catch(err) {
      // ignore
    }

    try {
      await client.del(dn);
      console.log('Deleted existent m.mustermann version if any...');
    } catch(err) {
      // ignore
    }

    await client.add(dn, attributes);
    console.log('✅ User successfully created!');

    // Fügen wir ihn auch direkt der lehrer-Gruppe hinzu (member bei groupOfNames, memberUid bei posixGroup)
    // Wir wissen die Gruppe "cn=lehrer,ou=groups" hat "groupOfNames". Also nutzen wir 'member'
    const groupDn = `cn=lehrer,ou=groups,${BASE_DN}`;
    try {
        await client.modify(groupDn, [
            new Change({
              operation: 'add',
              modification: new Attribute({ type: 'member', values: [dn] }),
            })
        ]);
        console.log(`✅ User added to group: ${groupDn}`);
    } catch(err: any) {
        console.warn('Could not add to group (maybe already in there):', err.message);
    }

  } catch (error) {
    console.error('Failed to create user:', error);
  } finally {
    await client.unbind().catch(() => {});
  }
}

createUser();
