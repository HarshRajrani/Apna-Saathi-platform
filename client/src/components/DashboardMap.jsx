import { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  createRiderIcon,
  createBusinessIcon,
  createDropIcon,
  FitBounds,
  DARK_TILES,
  DARK_ATTR,
  BANGALORE_CENTER,
} from '../utils/mapUtils';

export default function DashboardMap({ riders = [], orders = [], businesses = [] }) {
  const allPositions = [];

  riders.forEach((r) => {
    if (r.currentLocation?.coordinates) {
      allPositions.push([r.currentLocation.coordinates[1], r.currentLocation.coordinates[0]]);
    }
  });

  orders
    .filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
    .forEach((o) => {
      if (o.drop?.location?.coordinates) {
        allPositions.push([o.drop.location.coordinates[1], o.drop.location.coordinates[0]]);
      }
    });

  return (
    <div className="rounded-2xl overflow-hidden border border-surface-700/30" style={{ height: '100%', minHeight: '300px' }}>
      <MapContainer
        center={BANGALORE_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer attribution={DARK_ATTR} url={DARK_TILES} />
        {allPositions.length > 0 && <FitBounds positions={allPositions} />}

        {/* Business markers */}
        {businesses.map((biz) => {
          if (!biz.address?.location?.coordinates) return null;
          const pos = [biz.address.location.coordinates[1], biz.address.location.coordinates[0]];
          return (
            <Marker key={`biz-${biz._id}`} position={pos} icon={createBusinessIcon()}>
              <Popup>
                <div>
                  <p className="font-bold text-sm">{biz.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{biz.type}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Rider markers */}
        {riders.map((rider) => {
          if (!rider.currentLocation?.coordinates) return null;
          const pos = [rider.currentLocation.coordinates[1], rider.currentLocation.coordinates[0]];
          if (pos[0] === 0 && pos[1] === 0) return null;
          return (
            <Marker key={`rider-${rider._id}`} position={pos} icon={createRiderIcon(rider.status)}>
              <Popup>
                <div>
                  <p className="font-bold text-sm">{rider.name}</p>
                  <p className="text-xs text-gray-500">{rider.vehicleType} • {rider.zone}</p>
                  <p className="text-xs capitalize font-medium mt-1" style={{
                    color: rider.status === 'available' ? '#10b981' : rider.status === 'busy' ? '#f59e0b' : '#94a3b8',
                  }}>
                    {rider.status} • {rider.activeOrders?.length || 0} orders
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Active order drop markers */}
        {orders
          .filter((o) => ['pending', 'assigned', 'picked_up', 'in_transit'].includes(o.status))
          .map((order) => {
            if (!order.drop?.location?.coordinates) return null;
            const pos = [order.drop.location.coordinates[1], order.drop.location.coordinates[0]];
            return (
              <Marker key={`order-${order._id}`} position={pos} icon={createDropIcon()}>
                <Popup>
                  <div>
                    <p className="font-bold text-sm text-red-600">{order.orderNumber}</p>
                    <p className="text-xs text-gray-600">{order.drop.address}</p>
                    <p className="text-xs text-gray-500 capitalize mt-1">{order.status} • ₹{order.deliveryFee}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
