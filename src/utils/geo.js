/* Geolocation helpers for "nearest shops" based on the user's live location. */

// Great-circle distance in km between two {lat, lng} points, or null if missing.
export function haversineKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null || a.lng == null || b.lng == null) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Ask the browser for the current location. Resolves to {lat, lng} or rejects.
export function getCurrentLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) { reject(new Error('no-geolocation')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000, ...options }
    );
  });
}

// A shop's distance from the user: real geo distance if both have coords, else
// the shop's stored distanceKm as a fallback.
export function shopDistanceKm(userLoc, shop) {
  const geo = haversineKm(userLoc, shop);
  if (geo != null) return geo;
  return typeof shop?.distanceKm === 'number' ? shop.distanceKm : null;
}
