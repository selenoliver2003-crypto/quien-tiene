// ============================================================
// Autenticación ÚNICA con Google y detección de Roles
// ============================================================

function mostrarError(msg) {
  const el = document.getElementById('errorMsg');
  if (el) el.textContent = msg;
}

// Inicia el flujo de Google OAuth
async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { 
      redirectTo: window.location.origin + window.location.pathname
    }
  });
  if (error) mostrarError('Error al conectar con Google: ' + error.message);
}

// Revisa el estado del usuario logueado con Google
async function procesarSesionGoogle() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return; // Si no hay sesión iniciada, se queda en index.html

  // Buscamos el rol en la tabla 'users'
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Error al obtener perfil:', error.message);
    return;
  }

  // Escenario A: Es un usuario nuevo (o sin rol asignado todavía)
  if (!user || !user.role) {
    document.getElementById('modalRegistro').style.display = 'flex';
  } else {
    // Escenario B: Ya tiene rol, lo redirigimos directo a su panel
    window.location.href = user.role === 'buyer' ? 'buyer.html' : 'seller.html';
  }
}

// Asigna el rol elegido en el modal y hace la redirección
async function asignarRolYRedirigir(rol) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  // Actualizamos el rol en la base de datos
  const { error } = await supabase
    .from('users')
    .update({ role: rol })
    .eq('id', session.user.id);

  if (error) {
    alert('No se pudo guardar tu perfil. Inténtalo de nuevo.');
    console.error(error);
    return;
  }

  // Redirigimos inmediatamente al panel correspondiente
  window.location.href = rol === 'buyer' ? 'buyer.html' : 'seller.html';
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

// Ejecución automática al cargar index.html para procesar el retorno de Google
if (document.getElementById('errorMsg')) {
  // Le damos un pequeño margen para que cargue Supabase antes de evaluar la sesión
  setTimeout(procesarSesionGoogle, 500);
}
