import React, { useState, useEffect } from 'react';
import { pick } from '../../utils/i18n';
import { Store, Home, Phone, Navigation } from 'lucide-react';

// A simulated live-delivery view: shows the rider moving from the shop to the
// customer's home, the rider's name + phone, and an ETA. (A real deployment
// would plug the rider's live GPS coordinates into `progress`.)
export default function LiveDeliveryTracker({ order, shop, language }) {
  const [progress, setProgress] = useState(0.06);

  useEffect(() => {
    // Advance the rider along the route for the demo.
    const id = setInterval(() => {
      setProgress(p => (p >= 1 ? 1 : Math.min(1, p + 0.015)));
    }, 700);
    return () => clearInterval(id);
  }, [order?.id]);

  const rider = order?.assignedRider || pick(language, { ne: 'पसले आफैं', en: 'The shopkeeper', mai: 'दोकानदार', bho: 'दोकानदार' });
  // Try to pull a phone number out of the rider string, else use the shop phone.
  const phoneMatch = String(rider).match(/(\+?9\d[\d\s-]{7,})/);
  const riderPhone = (phoneMatch ? phoneMatch[1] : shop?.phone || '').replace(/\s/g, '');
  const riderName = String(rider).replace(/\(.*?\)/g, '').trim() || rider;

  const totalMin = Math.max(1, Math.round((shop?.distanceKm || 1.2) * 6));
  const etaMin = Math.max(0, Math.ceil(totalMin * (1 - progress)));

  const L = (o) => pick(language, o);

  return (
    <div className="live-delivery-card">
      <div className="ld-head">
        <Navigation size={16} className="ld-live-icon" />
        <span>{L({ ne: 'प्रत्यक्ष डेलिभरी', en: 'Live delivery', mai: 'प्रत्यक्ष डेलिभरी', bho: 'लाइव डेलिभरी' })}</span>
        <span className="ld-eta">{progress >= 1
          ? L({ ne: 'पुग्यो!', en: 'Arrived!', mai: 'पहुँचल!', bho: 'पहुँच गइल!' })
          : `~${etaMin} ${L({ ne: 'मिनेट', en: 'min', mai: 'मिनट', bho: 'मिनट' })}`}</span>
      </div>

      {/* Simulated map / route */}
      <div className="ld-map">
        <div className="ld-route-line" />
        <div className="ld-route-progress" style={{ width: `${progress * 100}%` }} />
        <div className="ld-pin shop"><Store size={14} /></div>
        <div className="ld-pin home"><Home size={14} /></div>
        <div className="ld-rider" style={{ left: `calc(${progress * 100}% )` }}>🛵</div>
      </div>
      <div className="ld-labels">
        <span>{shop?.name || L({ ne: 'पसल', en: 'Shop', mai: 'दोकान', bho: 'दोकान' })}</span>
        <span>{L({ ne: 'तपाईंको घर', en: 'Your home', mai: 'अहाँक घर', bho: 'रउरा घर' })}</span>
      </div>

      {/* Rider contact */}
      <div className="ld-rider-row">
        <div className="ld-rider-avatar">🧑‍✈️</div>
        <div className="ld-rider-info">
          <strong>{riderName}</strong>
          <small>{L({ ne: 'तपाईंको सामान ल्याउँदै', en: 'Bringing your order', mai: 'अहाँक सामान अनैत', bho: 'रउरा सामान लावत' })}</small>
        </div>
        {riderPhone && (
          <a className="ld-call-btn" href={`tel:${riderPhone}`}>
            <Phone size={16} />
            <span>{L({ ne: 'फोन', en: 'Call', mai: 'फोन', bho: 'फोन' })}</span>
          </a>
        )}
      </div>
    </div>
  );
}
