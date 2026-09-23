import { getStoredOwnerSession } from './ownerAuth';

// This browser-safe key can only read/write data permitted by the Supabase RLS
// policies. Never place a Supabase secret/service-role key in this application.
const SUPABASE_URL = 'https://tosdqjdvjdgntsrfqgot.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9UzPFCT3BImOfltGmLZt2A_nQovxSBV';
const STORE_ID = 'easybudgetstore-main';

function headers(accessToken) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export async function loadSharedStore() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/site_store?id=eq.${STORE_ID}&select=data,updated_at&limit=1`,
    { headers: headers() }
  );
  if (!response.ok) throw new Error('Could not load the shared website data.');
  const rows = await response.json();
  return rows?.[0]?.data || null;
}

export async function saveSharedStore(store) {
  const session = getStoredOwnerSession();
  if (!session?.access_token) throw new Error('Admin session is required to save shared website data.');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/site_store?on_conflict=id`, {
    method: 'POST',
    headers: {
      ...headers(session.access_token),
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({ id: STORE_ID, data: store, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error('Could not save changes to the shared website data.');
}
