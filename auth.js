// ============================================================
// Login / Registro con gestión de Roles
// ============================================================

function mostrarError(msg) {
  const el = document.getElementById('errorMsg');
  if (el) el.textContent = msg;
}

async function login() {
  mostrarError('');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    mostrarError('Completa correo y contraseña.');
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    mostrarError('No se pudo iniciar sesión: correo o contraseña incorrectos.');
  } else {
    checkAuth();
  }
}

function mostrarRegistro() {
  mostrarError('');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    mostrarError('Completa correo y contraseña antes de crear la cuenta.');
    return;
  }
  if (password.length < 6) {
    mostrarError('La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  document.getElementById('modalRegistro').style.display = 'flex';
}

function cerrarModal() {
  document.getElementById('modalRegistro').style.display = 'none';
}

async function registrarConRol(rol) {
  mostrarError('');
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    cerrarModal();
    mostrarError('Error al registrar: ' + error.message);
    return;
  }

  if (data.session) {
    await supabase.from('users').update({ role: rol }).eq('id', data.user.id);
    cerrarModal();
    checkAuth();
  } else {
    cerrarModal();
    localStorage.setItem('rolPendiente', rol);
    alert('Cuenta creada con éxito. Revisa tu correo para confirmar, luego inicia sesión.');
  }
}

async function loginWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

// Autoaplicar rol si quedó pendiente por verificación de correo electrónico
(async function aplicarRolPendienteSiExiste() {
  const rolPendiente = localStorage.getItem('rolPendiente');
  if (!rolPendiente) return;

  // Esperar un momento breve para asegurar conexión con Supabase
  setTimeout(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('users').update({ role: rolPendiente }).eq('id', session.user.id);
      localStorage.removeItem('rolPendiente');
    }
  }, 1000);
})();
