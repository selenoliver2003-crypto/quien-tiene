// ============================================================
// Panel del vendedor — Flujo Corregido
// ============================================================

let sesionActual = null;
let sellerIdActual = null;

async function iniciarSeller() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }
  sesionActual = session;

  const { data: seller } = await supabase
    .from('sellers')
    .select('id, business_name')
    .eq('user_id', session.user.id)
    .single();

  if (seller) {
    sellerIdActual = seller.id;
    document.getElementById('cajaNegocio').style.display = 'none';
    cargarProductos();
  } else {
    // Primera vez: pide el nombre del negocio una sola vez.
    document.getElementById('cajaNegocio').style.display = 'flex';
  }

  document.getElementById('btnGuardarNegocio').addEventListener('click', guardarNegocio);
  document.getElementById('btnPublicar').addEventListener('click', publicarProducto);
  document.getElementById('btnLogout').addEventListener('click', logout);
}

async function guardarNegocio() {
  const errorEl = document.getElementById('errorNegocio');
  const nombre = document.getElementById('businessName').value.trim();
  errorEl.textContent = '';

  if (!nombre) {
    errorEl.textContent = 'Escribe el nombre de tu negocio.';
    return;
  }

  const { data, error } = await supabase
    .from('sellers')
    .insert({ user_id: sesionActual.user.id, business_name: nombre })
    .select('id')
    .single();

  if (error) {
    errorEl.textContent = 'No se pudo guardar: ' + error.message;
    return;
  }

  sellerIdActual = data.id;
  document.getElementById('cajaNegocio').style.display = 'none';
  cargarProductos();
}

async function publicarProducto() {
  const errorEl = document.getElementById('errorProducto');
  const nombre = document.getElementById('productName').value.trim();
  const stock = document.getElementById('productStock').value;
  const precio = document.getElementById('productPrice').value;
  errorEl.textContent = '';

  if (!sellerIdActual) {
    errorEl.textContent = 'Primero guarda el nombre de tu negocio, arriba.';
    return;
  }
  if (!nombre) {
    errorEl.textContent = 'Escribe qué producto vas a publicar.';
    return;
  }

  const btn = document.getElementById('btnPublicar');
  btn.disabled = true;
  btn.textContent = 'Ubicando...';

  const ubicacion = await obtenerUbicacion();

  if (!ubicacion) {
    errorEl.textContent = 'No pudimos obtener tu ubicación. Revisa el permiso de ubicación e intenta de nuevo.';
    btn.disabled = false;
    btn.textContent = '📍 Usar mi ubicación y publicar';
    return;
  }

  const { error } = await supabase.from('products').insert({
    seller_id: sellerIdActual,
    name: nombre,
    stock: stock ? Number(stock) : null,
    price: precio ? Number(precio) : null,
    available: true,
    lat: ubicacion.lat,
    lng: ubicacion.lng
  });

  btn.disabled = false;
  btn.textContent = '📍 Usar mi ubicación y publicar';

  if (error) {
    errorEl.textContent = 'No se pudo publicar: ' + error.message;
    return;
  }

  document.getElementById('productName').value = '';
  document.getElementById('productStock').value = '';
  document.getElementById('productPrice').value = '';
  cargarProductos();
}

async function cargarProductos() {
  const lista = document.getElementById('listaProductos');
  lista.innerHTML = 'Cargando...';

  const { data, error } = await supabase
    .from('products')
    .select('id, name, stock, price, available, updated_at')
    .eq('seller_id', sellerIdActual)
    .order('updated_at', { ascending: false });

  if (error) {
    lista.innerHTML = `<p class="error-msg">Error al cargar: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    lista.innerHTML = '<p class="estado-busqueda">Todavía no has publicado ningún producto.</p>';
    return;
  }

  lista.innerHTML = '';
  data.forEach((p) => {
    const item = document.createElement('div');
    item.className = 'tarjeta-negocio';

    const precioTexto = p.price ? `$${Number(p.price).toFixed(2)}` : 'sin precio';
    const stockTexto = p.stock !== null && p.stock !== undefined ? ` · stock: ${p.stock}` : '';
    const estiloPunto = p.available ? '' : 'background:#ccc; animation:none;';

    item.innerHTML = `
      <div class="tarjeta-cabeza">
        <h3>${escaparHtmlSeller(p.name)}</h3>
        <span class="pulso-disponible" style="${estiloPunto}" title="${p.available ? 'disponible' : 'agotado'}"></span>
      </div>
      <p class="tarjeta-producto">${precioTexto}${stockTexto}</p>
      <div class="tarjeta-acciones">
        <button class="btn-secondary btn-toggle">${p.available ? 'Marcar agotado' : 'Marcar disponible'}</button>
        <button class="btn-secondary btn-borrar">Borrar</button>
      </div>
    `;

    item.querySelector('.btn-toggle').addEventListener('click', () => cambiarDisponibilidad(p.id, !p.available));
    item.querySelector('.btn-borrar').addEventListener('click', () => borrarProducto(p.id));

    lista.appendChild(item);
  });
}

async function cambiarDisponibilidad(id, nuevoValor) {
  await supabase.from('products').update({ available: nuevoValor, updated_at: new Date().toISOString() }).eq('id', id);
  cargarProductos();
}

async function borrarProducto(id) {
  if (!confirm('¿Borrar este producto?')) return;
  await supabase.from('products').delete().eq('id', id);
  cargarProductos();
}

function escaparHtmlSeller(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

// Retraso controlado para evitar conflictos de inicialización con Supabase
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(iniciarSeller, 300);
});
