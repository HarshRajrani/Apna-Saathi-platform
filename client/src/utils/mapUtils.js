import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ============================================================
// CUSTOM MARKER ICONS
// ============================================================

export const createRiderIcon = (status) => {
  const colors = {
    available: '#10b981',
    busy: '#f59e0b',
    offline: '#94a3b8',
  };
  const color = colors[status] || colors.offline;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 38px; height: 38px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 3px 12px rgba(0,0,0,0.35);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/>
          <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-3 11.5V14l-3-3 4-3 2 3h2"/>
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
};

export const createPickupIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 30px; height: 30px;
        background: #10b981;
        border: 2px solid white;
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(16,185,129,0.4);
        transform: rotate(45deg);
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(-45deg);">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
};

export const createDropIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 28px; height: 28px;
        background: #ef4444;
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(239,68,68,0.4);
        transform: rotate(-45deg);
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);">
          <circle cx="12" cy="12" r="4"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
};

export const createBusinessIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px; height: 32px;
        background: #6366f1;
        border: 2px solid white;
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 3px 10px rgba(99,102,241,0.4);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18M3 7v14M21 7v14M6 21V10M10 21V10M14 21V10M18 21V10M3 7l9-4 9 4"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
};

// Numbered stop icon for batch routes
export const createStopIcon = (number, color = '#6366f1') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 26px; height: 26px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        color: white;
        font-size: 11px;
        font-weight: 700;
        font-family: Inter, sans-serif;
      ">
        ${number}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -16],
  });
};

// ============================================================
// BATCH CLUSTER COLORS
// ============================================================

export const CLUSTER_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
];

// ============================================================
// MAP HELPER COMPONENTS
// ============================================================

// Auto-fit map bounds to show all markers
export function FitBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions && positions.length > 0) {
      const validPositions = positions.filter(
        (p) => p && p[0] !== 0 && p[1] !== 0 && !isNaN(p[0]) && !isNaN(p[1])
      );
      if (validPositions.length > 0) {
        const bounds = L.latLngBounds(validPositions);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    }
  }, [positions, map]);

  return null;
}

// Fly to a specific location
export function FlyTo({ position, zoom = 14 }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom, { duration: 1 });
    }
  }, [position, map, zoom]);

  return null;
}

// ============================================================
// MAP TILE LAYERS
// ============================================================

// Dark tile layer for dashboard
export const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
export const DARK_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

// Light tile layer for detail pages
export const LIGHT_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const LIGHT_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Colored/styled tile layer
export const STYLED_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
export const STYLED_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

// ============================================================
// GEOCODING (Nominatim — Free, no API key)
// ============================================================

export async function geocodeAddress(address) {
  try {
    const encoded = encodeURIComponent(address + ', India');
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&countrycodes=in`,
      {
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    const data = await res.json();
    return data.map((item) => ({
      display: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
    }));
  } catch (err) {
    console.error('Geocoding error:', err);
    return [];
  }
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    const data = await res.json();
    return data.display_name || '';
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    return '';
  }
}

// ============================================================
// ROUTE FETCHING (OSRM — Free, no API key)
// ============================================================

export async function getRoute(waypoints) {
  // waypoints = [[lng, lat], [lng, lat], ...]
  if (!waypoints || waypoints.length < 2) return null;

  try {
    const coords = waypoints.map((wp) => `${wp[0]},${wp[1]}`).join(';');
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );
    const data = await res.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        // Convert [lng, lat] to [lat, lng] for Leaflet
        coordinates: route.geometry.coordinates.map((c) => [c[1], c[0]]),
        distance: (route.distance / 1000).toFixed(1), // km
        duration: Math.ceil(route.duration / 60), // minutes
      };
    }
    return null;
  } catch (err) {
    console.error('Routing error:', err);
    return null;
  }
}

// Get distance and duration between two points
export async function getDistanceTime(from, to) {
  // from/to = [lng, lat]
  const route = await getRoute([from, to]);
  if (route) {
    return { distance: route.distance, duration: route.duration };
  }
  return null;
}

// Bangalore center
export const BANGALORE_CENTER = [12.9716, 77.5946];

export { MapContainer, TileLayer, Marker, Popup, Polyline, Circle };
