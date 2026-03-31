import L from 'leaflet';

/**
 * Create a rotating car icon for moving vehicles
 * @param {number} bearing - Direction in degrees (0-360)
 * @param {string} color - Car color (default: #3b82f6)
 * @returns {L.Icon} Leaflet icon
 */
export function createRotatingCarIcon(bearing = 0, color = '#3b82f6') {
  return L.divIcon({
    html: `
      <svg width="44" height="44" viewBox="0 0 44 44" style="transform: rotate(${bearing}deg); transition: transform 0.3s ease-in-out;">
        <!-- Car body -->
        <g transform="translate(22, 22)">
          <!-- Main body -->
          <rect x="-8" y="-12" width="16" height="24" rx="2" fill="${color}" stroke="white" stroke-width="2"/>
          <!-- Car roof -->
          <polygon points="-6,-8 6,-8 4,0 -4,0" fill="${color}" stroke="white" stroke-width="2"/>
          <!-- Windows -->
          <rect x="-5" y="-6" width="4" height="4" fill="rgba(255,255,255,0.4)"/>
          <rect x="1" y="-6" width="4" height="4" fill="rgba(255,255,255,0.4)"/>
          <!-- Headlights -->
          <circle cx="-3" cy="-11" r="1.5" fill="yellow"/>
          <circle cx="3" cy="-11" r="1.5" fill="yellow"/>
          <!-- Direction arrow -->
          <polygon points="0,-14 1,-12 -1,-12" fill="yellow" stroke="white" stroke-width="1"/>
        </g>
      </svg>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
    className: 'car-marker'
  });
}

/**
 * Create a location marker icon
 * @param {string} type - 'origin' or 'destination'
 * @returns {L.Icon} Leaflet icon
 */
export function createLocationMarker(type = 'origin') {
  const icon = type === 'origin' ? '📍' : '🎯';
  const color = type === 'origin' ? '#10b981' : '#ef4444';

  return L.divIcon({
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 18px;
      ">
        ${icon}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
}

/**
 * Create a vehicle status marker (for company dashboard showing multiple vehicles)
 * @param {string} status - Trip status: 'pending', 'approved', 'active', 'completed'
 * @param {number} bearing - Direction in degrees (0-360)
 * @returns {L.Icon} Leaflet icon
 */
export function createVehicleStatusMarker(status = 'pending', bearing = 0) {
  const colors = {
    pending: '#9ca3af',    // gray
    approved: '#3b82f6',   // blue
    active: '#22c55e',     // green
    completed: '#8b5cf6'   // purple
  };

  const color = colors[status] || '#9ca3af';

  return L.divIcon({
    html: `
      <svg width="40" height="40" viewBox="0 0 40 40" style="transform: rotate(${bearing}deg); transition: transform 0.3s ease-in-out;">
        <g transform="translate(20, 20)">
          <!-- Outer circle background -->
          <circle cx="0" cy="0" r="18" fill="${color}" stroke="white" stroke-width="2"/>
          <!-- Car icon inside -->
          <rect x="-6" y="-9" width="12" height="18" rx="1.5" fill="white" stroke="none"/>
          <polygon points="-4,-6 4,-6 3,0 -3,0" fill="white"/>
          <!-- Direction arrow -->
          <polygon points="0,-11 1,-9 -1,-9" fill="yellow" stroke="white" stroke-width="0.5"/>
        </g>
      </svg>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    className: 'vehicle-status-marker'
  });
}

/**
 * Create animated position marker for current vehicle location
 * @returns {L.Icon} Leaflet icon
 */
export function createCurrentPositionMarker() {
  return L.divIcon({
    html: `
      <div style="
        width: 44px;
        height: 44px;
        background-color: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        animation: pulse 2s infinite;
      ">
        <span style="font-size: 22px;">🚗</span>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
        }
      </style>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22]
  });
}
