import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

let socket;

export const useRiderLocation = (activeBatchId = null) => {
  const { user, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'rider') return;
    
    // Initialize Socket
    if (!socket) {
      socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        withCredentials: true
      });
    }

    // Join room when activeBatchId changes
    if (activeBatchId && socket) {
      socket.emit('joinBatch', activeBatchId);
    }

    const startTracking = () => {
      if ('geolocation' in navigator) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            
            // Emit to socket
            socket.emit('rider:location', {
              riderId: user.riderId || user._id, // Depends on how rider ID is passed in auth
              lat: latitude,
              lng: longitude,
              activeBatchId: activeBatchId
            });

            // Make an API call every 10-30s if desired, to sync DB aggressively
            // (The server.js snippet you have listens to socket, but also 'rider:location' syncs db)
          },
          (error) => {
            console.error('Geolocation error:', error.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 5000
          }
        );
        
        return watchId;
      }
    };

    const watchId = startTracking();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [isAuthenticated, user, activeBatchId]);

  return { socket };
};
