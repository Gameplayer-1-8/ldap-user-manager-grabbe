import { Client } from 'ldapts';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const LDAP_URI = process.env.LDAP_URI || '';
const LDAP_ADMIN_DN = process.env.LDAP_ADMIN_DN || '';
const LDAP_ADMIN_PASSWORD = process.env.LDAP_ADMIN_PASSWORD || '';
const BASE_DN = process.env.LDAP_BASE_DN || 'dc=grabbe-gymnasium,dc=cloud';

const OLD_OU = `ou=Lehrer,cn=users,${BASE_DN}`;
const NEW_USERS_OU = `ou=Lehrer,ou=users,${BASE_DN}`;
const NEW_GROUPS_OU = `ou=groups,${BASE_DN}`;

async function migrate() {
  const client = new Client({ url: LDAP_URI });
  try {
    await client.bind(LDAP_ADMIN_DN, LDAP_ADMIN_PASSWORD);
    console.log(`Bound to LDAP as ${LDAP_ADMIN_DN}`);
    
    // Find all entries in the old OU
    let searchEntries: any[] = [];
    try {
      const result = await client.search(OLD_OU, {
        scope: 'one', // only immediate children
        filter: '(objectClass=*)',
      });
      searchEntries = result.searchEntries;
    } catch (err: any) {
        console.error(`Error searching old OU (${OLD_OU}):`, err.message);
        console.log("Perhaps the old OU doesn't exist anymore?");
        return;
    }

    console.log(`Found ${searchEntries.length} entries in ${OLD_OU}. Starting migration...`);

    for (const entry of searchEntries) {
        const dn = entry.dn;
        // Determine if user or group
        const objectClasses = Array.isArray(entry.objectClass) 
            ? entry.objectClass 
            : (entry.objectClass ? [entry.objectClass] : []);
            
        // Using toString() to handle buffer/string variations in ldapts
        const objClassesStr = objectClasses.map(c => c.toString().toLowerCase());
        
        const isUser = objClassesStr.includes('inetorgperson') || objClassesStr.includes('posixaccount') || objClassesStr.includes('person');
        const isGroup = objClassesStr.includes('groupofnames') || objClassesStr.includes('posixgroup') || objClassesStr.includes('groupofuniquenames');

        const rdn = dn.split(',')[0]; // e.g. uid=max or cn=mygroup
        let newSuperior = '';

        if (isUser) {
            newSuperior = NEW_USERS_OU;
        } else if (isGroup) {
            newSuperior = NEW_GROUPS_OU;
        } else {
            console.log(`⚠️  Skipping ${dn} - unknown objectClass type`);
            continue;
        }

        const newDn = `${rdn},${newSuperior}`;

        try {
            // Because ldapts modifyDN sometimes has issues with controls, we copy and delete.
            const attributes = { ...entry };
            delete attributes.dn;
            delete attributes.controls;

            await client.add(newDn, attributes);
            await client.del(dn);
            
            console.log(`✅ Moved: ${rdn} -> ${newSuperior}`);
        } catch(err: any) {
            console.error(`❌ Failed to move ${dn}:`, err.message);
        }
    }

    console.log('Migration Complete.');
  } catch (err) {
    console.error('Fatal Migration Error:', err);
  } finally {
    await client.unbind().catch(() => {});
  }
}
migrate();
