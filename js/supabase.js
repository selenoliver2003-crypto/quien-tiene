// ============================================================
// Conexión limpia a Supabase
// ============================================================
const SUPABASE_URL = 'https://zequgpzlawqjkfzpzkxr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xo8MVPKoFgTm9-tmePS40A_ud2WRzM_';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
