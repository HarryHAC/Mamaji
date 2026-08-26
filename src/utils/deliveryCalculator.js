// Delivery fee computation supporting both Base+KM and Slab models

export function calculateDeliveryFee(shop, distanceKm, orderType = 'delivery') {
  if (orderType === 'pickup') {
    return 0;
  }

  if (!shop) return 30; // fallback standard local fee

  const distance = Math.max(0.5, Number(distanceKm) || shop.distanceKm || 1);

  if (shop.deliveryModel === 'distanceSlabs' && shop.deliverySlabs && shop.deliverySlabs.length > 0) {
    // Sort slabs by ascending distance
    const sortedSlabs = [...shop.deliverySlabs].sort((a, b) => a.maxKm - b.maxKm);
    for (const slab of sortedSlabs) {
      if (distance <= slab.maxKm) {
        return Math.round(slab.charge);
      }
    }
    // If distance exceeds highest slab, use the highest slab charge + penalty
    const lastSlab = sortedSlabs[sortedSlabs.length - 1];
    return Math.round(lastSlab.charge + (distance - lastSlab.maxKm) * 15);
  }

  // Default: Base + per km
  const base = Number(shop.baseDeliveryCharge) || 20;
  const perKm = Number(shop.perKmCharge) || 15;
  const total = base + (distance * perKm);
  return Math.round(total);
}

// Convert numbers to Devanagari numerals
export function toDevanagariNumerals(num) {
  if (num === null || num === undefined) return '';
  const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(num).replace(/[0-9]/g, (w) => devanagariDigits[+w]);
}
