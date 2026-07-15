// ============================================================
// Buscador del comprador — Flujo Corregido
// ============================================================

let sesionActual = null;

async function iniciarBuyer() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }
  sesionActual = session;

  const ubicacion = await obtenerUbicacion();
  if (!ubicacion) {
    mostrarAviso('No pudimos usar tu ubicación. Los resultados no se podrán ordenar por cercanía, pero la búsqueda funciona igual.');
  }

  document.getElementById('btnBuscar').addEventListener('click', ejecutarBusqueda);
  document.getElementById('inputBuscar').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ejecutarBusqueda();
  });
  document.getElementById('btnLogout').addEventListener('click', logout);
}

function mostrarAviso(msg) {
  const el = document.getElementById('avisoUbicacion');
  if (el) el.textContent = msg;
}

function formatearDistancia(km) {
  if (km === null || km === undefined) return 'distancia no disponible';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

async function ejecutarBusqueda() {
  const termino = document.getElementById('inputBuscar').value.trim();
  const panel = document.getElementById('panelResultados');
  const estado = document.getElementById('estadoBusqueda');

  if (!termino) {
    estado.textContent = 'Escribe qué producto buscas.';
    return;
  }

  estado.textContent = 'Buscando...';
  panel.innerHTML = '';

  const { data, error } = await supabase
    .from('products')
    .select(`id, name, price, stock, lat, lng, sellers ( business_name )`)
    .ilike('name', `%${termino}%`)
    .eq('available', true);

  if (error) {
    estado.textContent = 'Hubo un error al buscar: ' + error.message;
    return;
  }

  if (!data || data.length === 0) {
    estado.textContent = `Nadie tiene "${termino}" disponible ahorita cerca de ti.`;
    return;
  }

  // Obtenemos la ubicación en el momento de buscar para garantizar cálculos exactos
  const gpsUser = ubicacionActual;

  const conDistancia = data.map((r) => ({
    ...r,
    distanciaKm: gpsUser ? distanciaKm(gpsUser.lat, gpsUser.lng, r.lat, r.lng) : null
  }));

  // Ordenamos de menor a mayor distancia si el GPS está listo
  conDistancia.sort((a, b) => {
    if (a.distanciaKm === null) return 1;
    if (b.distanciaKm === null) return -1;
    return a.distanciaKm - b.distanciaKm;
  });

  estado.textContent = `${conDistancia.length} resultado(s) para "${termino}" — toca un recuadro para abrir Google Maps`;
  renderizarPanel(conDistancia);
}

function renderizarPanel(resultados) {
  const panel = document.getElementById('panelResultados');
  panel.innerHTML = '';

  resultados.forEach((r) => {
    const s = r.sellers;
    if (!s) return;

    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-negocio';

    const precioTexto = r.price ? `$${Number(r.price).toFixed(2)}` : 'precio no indicado';
    const stockTexto = r.stock !== null && r.stock !== undefined ? ` · stock: ${r.stock}` : '';

    tarjeta.innerHTML = `
      <div class="tarjeta-cabeza">
        <h3>${escaparHtml(s.business_name)}</h3>
        <span class="pulso-disponible" title="disponible ahora"></span>
      </div>
      <p class="tarjeta-producto">${escaparHtml(r.name)} — ${precioTexto}${stockTexto}</p>
      <p class="tarjeta-meta">${formatearDistancia(r.distanciaKm)} · toca para ver en Google Maps</p>
    `;

    tarjeta.addEventListener('click', () => abrirEnGoogleMaps(r.lat, r.lng, s.business_name));
    panel.appendChild(tarjeta);
  });
}

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

// Retraso controlado para evitar conflictos de inicialización con Supabase
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(iniciarBuyer, 300);
});
