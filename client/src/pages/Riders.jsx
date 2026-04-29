import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/Layout/PageWrapper';
import StatusBadge from '../components/ui/StatusBadge';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { getRiders } from '../api/riders';
import { getOrders } from '../api/orders';
import { useSocket } from '../context/SocketContext';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  createRiderIcon,
  createPickupIcon,
  createDropIcon,
  FitBounds,
  FlyTo,
  STYLED_TILES,
  STYLED_ATTR,
  BANGALORE_CENTER,
  getRoute,
} from '../utils/mapUtils';
import {
  Bike,
  Phone,
  MapPin,
  Star,
  Package,
  IndianRupee,
  Search,
  Navigation,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riderLocations, setRiderLocations] = useState({});
  const [showOrders, setShowOrders] = useState(true);
  const [routeLines, setRouteLines] = useState({});
  const [flyToPos, setFlyToPos] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('rider:locationUpdate', (data) => {
      setRiderLocations((prev) => ({
        ...prev,
        [data.riderId]: { lat: data.lat, lng: data.lng, status: data.status },
      }));
    });
    return () => socket.off('rider:locationUpdate');
  }, [socket]);

  const fetchData = async () => {
    try {
      const [ridersRes, ordersRes] = await Promise.all([
        getRiders(),
        getOrders({ status: 'in_transit' }),
      ]);
      setRiders(ridersRes.data.data);
      setActiveOrders(ordersRes.data.data);

      // Initialize locations
      const locations = {};
      ridersRes.data.data.forEach((rider) => {
        if (rider.currentLocation?.coordinates) {
          locations[rider._id] = {
            lat: rider.currentLocation.coordinates[1],
            lng: rider.currentLocation.coordinates[0],
            status: rider.status,
          };
        }
      });
      setRiderLocations(locations);

      // Fetch routes for active orders
      fetchRoutes(ordersRes.data.data);
    } catch (err) {
      console.error('Fetch riders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async (orders) => {
    const routes = {};
    for (const order of orders) {
      if (order.pickup?.location?.coordinates && order.drop?.location?.coordinates) {
        const pickup = order.pickup.location.coordinates; // [lng, lat]
        const drop = order.drop.location.coordinates;
        const route = await getRoute([pickup, drop]);
        if (route) {
          routes[order._id] = route;
        }
      }
    }
    setRouteLines(routes);
  };

  const filteredRiders = riders.filter((rider) => {
    if (!searchQuery) return true;
    return (
      rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.phone.includes(searchQuery) ||
      rider.zone?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getRiderCoords = (rider) => {
    const loc = riderLocations[rider._id];
    if (loc) return [loc.lat, loc.lng];
    if (rider.currentLocation?.coordinates) {
      return [rider.currentLocation.coordinates[1], rider.currentLocation.coordinates[0]];
    }
    return null;
  };

  const handleRiderClick = (rider) => {
    const isDeselecting = selectedRider?._id === rider._id;
    setSelectedRider(isDeselecting ? null : rider);
    if (!isDeselecting) {
      const coords = getRiderCoords(rider);
      if (coords) setFlyToPos(coords);
    }
  };

  // Collect all positions for auto-fit
  const allPositions = [];
  riders.forEach((r) => {
    const c = getRiderCoords(r);
    if (c) allPositions.push(c);
  });
  if (showOrders) {
    activeOrders.forEach((o) => {
      if (o.pickup?.location?.coordinates) {
        allPositions.push([o.pickup.location.coordinates[1], o.pickup.location.coordinates[0]]);
      }
      if (o.drop?.location?.coordinates) {
        allPositions.push([o.drop.location.coordinates[1], o.drop.location.coordinates[0]]);
      }
    });
  }

  if (loading) return <PageWrapper pageTitle="Riders"><PageLoader /></PageWrapper>;

  return (
    <PageWrapper pageTitle="Riders">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Left: Rider List */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-surface-100">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search riders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
                id="riders-search"
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-500">{riders.length} riders</span>
                <span className="text-xs text-surface-300">•</span>
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {riders.filter((r) => r.status === 'available').length} online
                </span>
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {riders.filter((r) => r.status === 'busy').length} busy
                </span>
              </div>
              <button
                onClick={() => setShowOrders(!showOrders)}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                title={showOrders ? 'Hide order markers' : 'Show order markers'}
              >
                {showOrders ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                Orders
              </button>
            </div>
          </div>

          {/* Rider cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredRiders.map((rider) => (
              <div
                key={rider._id}
                onClick={() => handleRiderClick(rider)}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                  selectedRider?._id === rider._id
                    ? 'bg-primary-50 border-primary-200 shadow-sm'
                    : 'bg-surface-50 border-transparent hover:bg-surface-100 hover:border-surface-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        rider.status === 'available'
                          ? 'bg-emerald-100'
                          : rider.status === 'busy'
                          ? 'bg-amber-100'
                          : 'bg-surface-200'
                      }`}
                    >
                      <Bike
                        className={`w-5 h-5 ${
                          rider.status === 'available'
                            ? 'text-emerald-600'
                            : rider.status === 'busy'
                            ? 'text-amber-600'
                            : 'text-surface-500'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-800">{rider.name}</p>
                      <p className="text-xs text-surface-500">
                        {rider.vehicleType} • {rider.vehicleNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={rider.status} />
                </div>

                {/* Expanded details */}
                {selectedRider?._id === rider._id && (
                  <div className="mt-4 pt-3 border-t border-surface-200 animate-slide-up">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-surface-600">
                        <Phone className="w-3 h-3" /> {rider.phone}
                      </div>
                      <div className="flex items-center gap-1.5 text-surface-600">
                        <MapPin className="w-3 h-3" /> {rider.zone || 'No zone'}
                      </div>
                      <div className="flex items-center gap-1.5 text-surface-600">
                        <Star className="w-3 h-3 text-amber-500" /> {rider.rating}/5
                      </div>
                      <div className="flex items-center gap-1.5 text-surface-600">
                        <Package className="w-3 h-3" /> {rider.totalDeliveries} deliveries
                      </div>
                      <div className="flex items-center gap-1.5 text-surface-600">
                        <IndianRupee className="w-3 h-3" /> ₹{rider.earningsToday} today
                      </div>
                      <div className="flex items-center gap-1.5 text-surface-600">
                        <Navigation className="w-3 h-3" /> {rider.activeOrders?.length || 0} active
                      </div>
                    </div>

                    {rider.activeOrders?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-surface-500 mb-1.5">Active Orders:</p>
                        {rider.activeOrders.map((order) => (
                          <div
                            key={order._id || order}
                            className="text-xs bg-white p-2 rounded-lg border border-surface-200 mb-1 flex items-center gap-2"
                          >
                            <span className="font-medium text-primary-600">
                              {order.orderNumber || 'Order'}
                            </span>
                            {order.drop?.address && (
                              <span className="text-surface-500 truncate flex-1">
                                {order.drop.address}
                              </span>
                            )}
                            {order.status && <StatusBadge status={order.status} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Enhanced Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-surface-100 overflow-hidden relative">
          {/* Map legend */}
          <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-surface-200 px-4 py-3">
            <p className="text-xs font-semibold text-surface-700 mb-2">Map Legend</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-surface-600">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm" /> Rider (Available)
              </div>
              <div className="flex items-center gap-2 text-xs text-surface-600">
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-sm" /> Rider (Busy)
              </div>
              <div className="flex items-center gap-2 text-xs text-surface-600">
                <span className="w-3 h-3 rounded-full bg-surface-400 border border-white shadow-sm" /> Rider (Offline)
              </div>
              {showOrders && (
                <>
                  <div className="flex items-center gap-2 text-xs text-surface-600">
                    <span className="w-3 h-3 rounded bg-emerald-500 border border-white shadow-sm" style={{ transform: 'rotate(45deg)' }} /> Pickup
                  </div>
                  <div className="flex items-center gap-2 text-xs text-surface-600">
                    <span className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm" /> Drop
                  </div>
                </>
              )}
            </div>
          </div>

          <MapContainer
            center={BANGALORE_CENTER}
            zoom={12}
            style={{ height: '100%', width: '100%', minHeight: '400px' }}
            className="rounded-2xl"
          >
            <TileLayer attribution={STYLED_ATTR} url={STYLED_TILES} />

            {/* Auto-fit bounds */}
            {!flyToPos && allPositions.length > 0 && <FitBounds positions={allPositions} />}

            {/* Fly to selected rider */}
            {flyToPos && <FlyTo position={flyToPos} />}

            {/* Rider markers */}
            {riders.map((rider) => {
              const coords = getRiderCoords(rider);
              if (!coords || (coords[0] === 0 && coords[1] === 0)) return null;
              return (
                <Marker
                  key={`rider-${rider._id}`}
                  position={coords}
                  icon={createRiderIcon(riderLocations[rider._id]?.status || rider.status)}
                >
                  <Popup>
                    <div className="min-w-[160px]">
                      <p className="font-bold text-sm text-surface-800">{rider.name}</p>
                      <p className="text-xs text-surface-500 mt-0.5">{rider.vehicleType} • {rider.zone}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className="text-xs font-medium capitalize px-2 py-0.5 rounded-full"
                          style={{
                            background: rider.status === 'available' ? '#d1fae5' : rider.status === 'busy' ? '#fef3c7' : '#f1f5f9',
                            color: rider.status === 'available' ? '#065f46' : rider.status === 'busy' ? '#92400e' : '#475569',
                          }}
                        >
                          {rider.status}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-surface-600">
                        <p>⭐ {rider.rating}/5 • 📦 {rider.activeOrders?.length || 0} active</p>
                        <p className="mt-0.5">📱 {rider.phone}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Order markers + route lines */}
            {showOrders &&
              activeOrders.map((order) => {
                const pickupCoords = order.pickup?.location?.coordinates
                  ? [order.pickup.location.coordinates[1], order.pickup.location.coordinates[0]]
                  : null;
                const dropCoords = order.drop?.location?.coordinates
                  ? [order.drop.location.coordinates[1], order.drop.location.coordinates[0]]
                  : null;

                return (
                  <React.Fragment key={`order-${order._id}`}>
                    {/* Pickup marker */}
                    {pickupCoords && (
                      <Marker position={pickupCoords} icon={createPickupIcon()}>
                        <Popup>
                          <div className="min-w-[140px]">
                            <p className="text-xs font-bold text-emerald-700">📦 PICKUP</p>
                            <p className="font-semibold text-sm mt-1">{order.orderNumber}</p>
                            <p className="text-xs text-surface-500 mt-0.5">{order.pickup.address}</p>
                            <p className="text-xs text-surface-600 mt-1">{order.pickup.contactName} • {order.pickup.contactPhone}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Drop marker */}
                    {dropCoords && (
                      <Marker position={dropCoords} icon={createDropIcon()}>
                        <Popup>
                          <div className="min-w-[140px]">
                            <p className="text-xs font-bold text-red-700">📍 DROP</p>
                            <p className="font-semibold text-sm mt-1">{order.orderNumber}</p>
                            <p className="text-xs text-surface-500 mt-0.5">{order.drop.address}</p>
                            <p className="text-xs text-surface-600 mt-1">{order.drop.contactName} • {order.drop.contactPhone}</p>
                            {routeLines[order._id] && (
                              <p className="text-xs text-primary-600 font-medium mt-1">
                                🚗 {routeLines[order._id].distance} km • ⏱ {routeLines[order._id].duration} min
                              </p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Route line (real road route from OSRM) */}
                    {routeLines[order._id] && (
                      <Polyline
                        positions={routeLines[order._id].coordinates}
                        pathOptions={{
                          color: '#6366f1',
                          weight: 3,
                          opacity: 0.7,
                          dashArray: '8, 6',
                        }}
                      />
                    )}

                    {/* Fallback: straight dashed line if no route */}
                    {!routeLines[order._id] && pickupCoords && dropCoords && (
                      <Polyline
                        positions={[pickupCoords, dropCoords]}
                        pathOptions={{
                          color: '#94a3b8',
                          weight: 2,
                          opacity: 0.5,
                          dashArray: '5, 10',
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
          </MapContainer>
        </div>
      </div>
    </PageWrapper>
  );
}
