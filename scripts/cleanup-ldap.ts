import { Client } from 'ldapts';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const LDAP_URI = process.env.LDAP_URI || '';
const LDAP_ADMIN_DN = process.env.LDAP_ADMIN_DN || '';
const LDAP_ADMIN_PASSWORD = process.env.LDAP_ADMIN_PASSWORD || '';
const BASE_DN = process.env.LDAP_BASE_DN || 'dc=grabbe-gymnasium,dc=cloud';

async function cleanup() {
  const client = new Client({ url: LDAP_URI });
  try {
    await client.bind(LDAP_ADMIN_DN, LDAP_ADMIN_PASSWORD);
    
    const toDelete = [
      `cn=moodle-access,ou=groups,${BASE_DN}`,
      `cn=dashboard-admins,ou=groups,${BASE_DN}`
    ];

    for (const dn of toDelete) {
        try {
            await client.del(dn);
            console.log(`Deleted ${dn}`);
        } catch (err: any) {
            console.log(`Could not delete ${dn} (might not exist): ${err.message}`);
        }
    }
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await client.unbind().catch(() => {});
  }
}

cleanup();
