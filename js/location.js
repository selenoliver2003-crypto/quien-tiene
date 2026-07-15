// ============================================================
// Ubicación — Geolocation API real del navegador.
// ============================================================

let ubicacionActual = null; // { lat, lng } o null si no hay permiso

function obtenerUbicacion() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      console.warn('Este navegador no soporta geolocalización.');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        ubicacionActual = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        resolve(ubicacionActual);
      },
      (err) => {
        console.warn('No se pudo obtener la ubicación:', err.message);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}

// Distancia real en kilómetros entre dos coordenadas (fórmula de Haversine)
function distanciaKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v === null || v === undefined)) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Abre la ubicación exacta en la app real de Google Maps
function abrirEnGoogleMaps(lat, lng, nombreNegocio) {
  if (lat === null || lng === null || lat === undefined || lng === undefined) {
    alert('Este producto todavía no tiene una ubicación registrada.');
    return;
  }
  const query = encodeURIComponent(`${lat},${lng}`);
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  window.open(url, '_blank', 'noopener');
}
