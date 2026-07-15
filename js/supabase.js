// ============================================================
// Conexión a Supabase con tus credenciales reales
// ============================================================
const SUPABASE_URL = 'https://zequgpzlawqjkfzpzkxr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xo8MVPKoFgTm9-tmePS40A_ud2WRzM_';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Revisa si ya hay sesión activa y redirige a la página correcta.
// Se llama al cargar index.html, y también después de un login exitoso.
async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return; // no hay sesión, se queda en index.html (login)

  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (error || !user || !user.role) {
    // Perfil recién creado por el trigger, todavía sin rol asignado
    return;
  }

  window.location.href = user.role === 'buyer' ? 'buyer.html' : 'seller.html';
}

// Solo se auto-ejecuta en index.html (donde existe el formulario de login)
if (document.getElementById('email')) {
  checkAuth();
}
