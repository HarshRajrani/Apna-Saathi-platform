import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { Package, CheckCircle2, Bike, MapPin, Clock, Loader2, AlertCircle } from 'lucide-react';

// ─── Haversine formula ────────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Rider icon ───────────────────────────────────────────────────────
const riderIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#4F46E5;width:40px;height:40px;border-radius:50%;border:3px solid white;box-shadow:0 4px 14px rgba(79,70,229,0.5);display:flex;align-items:center;justify-content:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M15 6a1 1 0 0 0 0-2H9l-3 9"/><path d="M14 9l-3-4M9 15h7.4A2 2 0 0 0 18 13.4L16 6H8"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const dropIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#10B981;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 4px 14px rgba(16,185,129,0.4);display:flex;align-items:center;justify-content:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// ─── Map auto-follow rider ────────────────────────────────────────────
function MapRecenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng]);
  return null;
}

// ─── Status steps ─────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'pending',    label: 'Order Confirmed',  icon: '📋' },
  { key: 'assigned',   label: 'Out for Pickup',   icon: '🏪' },
  { key: 'picked_up',  label: 'In Transit',       icon: '🚴' },
  { key: 'in_transit', label: 'Arriving Soon',    icon: '📍' },
  { key: 'delivered',  label: 'Delivered',        icon: '✅' },
];

function getStepIndex(status) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

export default function PublicTracker() {
  const { trackingId } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riderPos, setRiderPos] = useState(null); // { lat, lng }
  const [uiStatus, setUiStatus] = useState('pending');
  const socketRef = useRef(null);

  // ─── Initial data fetch ───────────────────────────────────────────
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/public/track/${trackingId}`
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setOrderData(json.data);
        setUiStatus(json.data.status);
        if (json.data.rider?.currentLocation?.coordinates) {
          const [lng, lat] = json.data.rider.currentLocation.coordinates;
          setRiderPos({ lat, lng });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [trackingId]);

  // ─── Socket: join private tracking room (READ-ONLY) ──────────────
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Read-only socket — no auth token sent
    const socket = io(socketUrl, { withCredentials: false });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinTracking', trackingId);
    });

    socket.on('rider:locationUpdate', ({ lat, lng }) => {
      setRiderPos({ lat, lng });

      // Geo-fencing: if rider < 500m from destination, auto-update UI
      if (orderData?.destinationCoords) {
        const [destLng, destLat] = orderData.destinationCoords;
        const distKm = haversineKm(lat, lng, destLat, destLng);
        if (distKm < 0.5) {
          setUiStatus('in_transit'); // "Arriving Soon"
        }
      }
    });

    socket.on('order:statusChanged', ({ status }) => {
      setUiStatus(status);
    });

    return () => socket.disconnect();
  }, [trackingId, orderData]);

  // ─── ETA calculation ──────────────────────────────────────────────
  function getETA() {
    if (!riderPos || !orderData?.destinationCoords) return null;
    const [destLng, destLat] = orderData.destinationCoords;
    const km = haversineKm(riderPos.lat, riderPos.lng, destLat, destLng);
    const mins = Math.round((km / 20) * 60); // ~20 km/h average urban speed
    return { km: km.toFixed(1), mins };
  }

  const eta = getETA();
  const currentStep = getStepIndex(uiStatus);
  const [destLng, destLat] = orderData?.destinationCoords || [77.209, 28.613];
  const mapCenter = riderPos || { lat: destLat, lng: destLng };

  // ─── Render ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your delivery status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tracking Not Found</h2>
          <p className="text-gray-500 text-sm mb-1">{error}</p>
          <p className="text-gray-400 text-xs mt-4">Tracking ID: <span className="font-mono font-bold">{trackingId}</span></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 shadow-sm sticky top-0 z-50">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Delivery from</p>
          <h1 className="text-base font-bold text-gray-900 truncate">{orderData?.merchantName}</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Tracking ID</p>
          <p className="font-mono text-sm font-bold text-indigo-600">{trackingId}</p>
        </div>
      </div>

      {/* ─── Live Map ───────────────────────────────────────────── */}
      <div className="relative" style={{ height: '340px' }}>
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={14}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap"
          />
          {riderPos && (
            <Marker position={[riderPos.lat, riderPos.lng]} icon={riderIcon}>
              <Popup>{orderData?.rider?.firstName || 'Your Rider'} is on the way!</Popup>
            </Marker>
          )}
          <Marker position={[destLat, destLng]} icon={dropIcon}>
            <Popup>Your delivery address</Popup>
          </Marker>
          {riderPos && <MapRecenter lat={riderPos.lat} lng={riderPos.lng} />}
        </MapContainer>

        {/* Live indicator badge */}
        {riderPos && uiStatus !== 'delivered' && (
          <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md flex items-center gap-2 border border-white">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-gray-700">Live Tracking</span>
          </div>
        )}
      </div>

      {/* ─── ETA Card ───────────────────────────────────────────── */}
      {eta && uiStatus !== 'delivered' ? (
        <div className="mx-4 -mt-5 relative z-10 bg-indigo-600 rounded-3xl p-5 shadow-xl shadow-indigo-600/25 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-xs font-medium mb-1">Rider is</p>
              <p className="text-3xl font-black">{eta.km} km away</p>
            </div>
            <div className="text-right bg-white/15 rounded-2xl px-4 py-3">
              <p className="text-indigo-200 text-xs">Est. arrival</p>
              <p className="text-2xl font-black">{eta.mins}<span className="text-sm font-normal ml-1">min</span></p>
            </div>
          </div>
          {eta.km < 0.5 && (
            <div className="mt-3 bg-white/20 rounded-2xl px-3 py-2 flex items-center gap-2">
              <Bike className="w-4 h-4" />
              <span className="text-sm font-semibold">🎉 Your rider is almost there!</span>
            </div>
          )}
        </div>
      ) : uiStatus === 'delivered' ? (
        <div className="mx-4 -mt-5 relative z-10 bg-emerald-500 rounded-3xl p-5 shadow-xl shadow-emerald-500/25 text-white flex items-center gap-4">
          <CheckCircle2 className="w-12 h-12 text-white flex-shrink-0" />
          <div>
            <p className="font-black text-lg">Delivered!</p>
            <p className="text-emerald-100 text-sm">Your parcel has been delivered successfully.</p>
          </div>
        </div>
      ) : (
        <div className="mx-4 -mt-5 relative z-10 bg-white rounded-3xl p-5 shadow-xl border border-gray-100 flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          <div>
            <p className="font-bold text-gray-800">Waiting for rider assignment</p>
            <p className="text-gray-400 text-xs">You'll see live location once a rider picks up your order</p>
          </div>
        </div>
      )}

      {/* ─── Status Stepper ─────────────────────────────────────── */}
      <div className="bg-white mx-4 mt-4 rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" /> Delivery Progress
        </h3>
        <div className="space-y-0">
          {STATUS_STEPS.map((step, idx) => {
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;
            const isFuture = idx > currentStep;
            return (
              <div key={step.key} className="flex gap-4 relative">
                {/* Line connector */}
                {idx < STATUS_STEPS.length - 1 && (
                  <div
                    className={`absolute left-[18px] top-9 w-0.5 h-8 ${
                      isDone ? 'bg-indigo-500' : 'bg-gray-200'
                    }`}
                  />
                )}
                {/* Circle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base z-10 transition-all duration-500 ${
                    isDone
                      ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30'
                      : isActive
                      ? 'bg-indigo-600 shadow-xl shadow-indigo-600/40 ring-4 ring-indigo-100 scale-110'
                      : 'bg-gray-100'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-white" /> : step.icon}
                </div>
                {/* Label */}
                <div className="pb-8">
                  <p
                    className={`font-semibold text-sm mt-1.5 ${
                      isActive ? 'text-indigo-600' : isDone ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                    {isActive && (
                      <span className="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                        Now
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Destination ────────────────────────────────────────── */}
      <div className="bg-white mx-4 rounded-3xl shadow-sm border border-gray-100 p-5 mb-8 flex items-start gap-3">
        <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Delivering to</p>
          <p className="font-bold text-gray-800">{orderData?.recipientName}</p>
          <p className="text-sm text-gray-500 mt-0.5">{orderData?.destinationAddress}</p>
        </div>
      </div>
    </div>
  );
}
