import { Client } from 'ldapts';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const LDAP_URI = process.env.LDAP_URI || '';
const LDAP_ADMIN_DN = process.env.LDAP_ADMIN_DN || '';
const LDAP_ADMIN_PASSWORD = process.env.LDAP_ADMIN_PASSWORD || '';
const BASE_DN = process.env.LDAP_BASE_DN || 'dc=grabbe-gymnasium,dc=cloud';

async function setup() {
  const client = new Client({ url: LDAP_URI });
  try {
    await client.bind(LDAP_ADMIN_DN, LDAP_ADMIN_PASSWORD);
    console.log('Successfully bound to LDAP.');

    const entriesToAdd: { dn: string; attributes: Record<string, string | string[]> }[] = [
      // Base OUs
      {
        dn: `ou=users,${BASE_DN}`,
        attributes: {
          objectClass: ['organizationalUnit', 'top'],
          ou: 'users',
        }
      },
      {
        dn: `ou=groups,${BASE_DN}`,
        attributes: {
          objectClass: ['organizationalUnit', 'top'],
          ou: 'groups',
        }
      },
      // Sub-OUs for Users
      {
        dn: `ou=Lehrer,ou=users,${BASE_DN}`,
        attributes: {
          objectClass: ['organizationalUnit', 'top'],
          ou: 'Lehrer',
        }
      },
      {
        dn: `ou=Verwaltung,ou=users,${BASE_DN}`,
        attributes: {
          objectClass: ['organizationalUnit', 'top'],
          ou: 'Verwaltung',
        }
      },
    ];

    // Groups (groupOfNames requires at least one member, we use the Admin DN)
    const groups = ['lehrer', 'verwaltung', 'nextcloud-admins'];
    for (const group of groups) {
      entriesToAdd.push({
        dn: `cn=${group},ou=groups,${BASE_DN}`,
        attributes: {
          objectClass: ['groupOfNames', 'top'],
          cn: group,
          description: `Group for ${group}`,
          member: LDAP_ADMIN_DN
        }
      });
    }

    for (const entry of entriesToAdd) {
      try {
        await client.add(entry.dn, entry.attributes);
        console.log(`Created: ${entry.dn}`);
      } catch (err: any) {
        if (err.message && err.message.includes('Already exists')) {
          console.log(`Already exists: ${entry.dn}`);
        } else {
          console.error(`Failed to create ${entry.dn}:`, err.message);
        }
      }
    }

    console.log('LDAP Structure Setup Complete.');
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await client.unbind().catch(() => {});
  }
}

setup();
