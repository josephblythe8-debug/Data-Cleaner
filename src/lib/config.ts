/**
 * MOCK_MODE is on by default so the app runs with zero setup. It only
 * switches off when real Supabase credentials are present in the env,
 * or the flag is explicitly forced.
 */
const explicitFlag = import.meta.env.VITE_MOCK_MODE

const hasSupabaseCredentials = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export const MOCK_MODE: boolean =
  explicitFlag !== undefined ? explicitFlag !== 'false' : !hasSupabaseCredentials
