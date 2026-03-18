import { Client } from 'ldapts';

const LDAP_URI = process.env.LDAP_URI || 'ldap://localhost:389';
const LDAP_ADMIN_DN = process.env.LDAP_ADMIN_DN || '';
const LDAP_ADMIN_PASSWORD = process.env.LDAP_ADMIN_PASSWORD || '';
const LDAP_USERS_OU = process.env.LDAP_USERS_OU || process.env.LDAP_BASE_DN || '';
const LDAP_GROUPS_OU = process.env.LDAP_GROUPS_OU || process.env.LDAP_BASE_DN || '';

export async function getLdapClient(): Promise<Client> {
  const client = new Client({
    url: LDAP_URI,
    timeout: 5000,
    connectTimeout: 5000,
  });

  try {
    await client.bind(LDAP_ADMIN_DN, LDAP_ADMIN_PASSWORD);
    return client;
  } catch (error) {
    console.error('LDAP Bind Error:', error);
    await client.unbind().catch(() => {});
    throw error;
  }
}

export async function searchUsers(filter: string = '(objectClass=*)') {
  const client = await getLdapClient();
  try {
    const { searchEntries } = await client.search(LDAP_USERS_OU, {
      scope: 'sub',
      filter: filter,
      attributes: ['uid', 'cn', 'sn', 'givenName', 'mail', 'displayName', 'initials', 'grabbeBirthday', 'telephoneNumber', 'mobile', 'facsimileTelephoneNumber', 'jpegPhoto', 'cloudQuota', 'mailQuota'],
    });
    return searchEntries;
  } finally {
    await client.unbind().catch(() => {});
  }
}

export async function searchGroups(filter: string = '(objectClass=*)') {
  const client = await getLdapClient();
  try {
    const { searchEntries } = await client.search(LDAP_GROUPS_OU, {
      scope: 'sub',
      filter: filter,
      attributes: ['cn', 'description', 'member', 'uniqueMember', 'memberUid'],
    });
    return searchEntries;
  } finally {
    await client.unbind().catch(() => {});
  }
}

export async function getUserDns(uids: string[]): Promise<string[]> {
  if (!uids || uids.length === 0) return [];
  
  const client = await getLdapClient();
  try {
    // Erstelle einen LDAP-Filter: (|(uid=user1)(uid=user2)...)
    const filter = `(|${uids.map(uid => `(uid=${uid})`).join('')})`;
    
    const { searchEntries } = await client.search(LDAP_USERS_OU, {
      scope: 'sub',
      filter: filter,
      attributes: ['dn'], // Wir brauchen nur die DN
    });
    
    // Extrahiere die DNs aus den Suchergebnissen
    return searchEntries.map(entry => entry.dn);
  } finally {
    await client.unbind().catch(() => {});
  }
}
