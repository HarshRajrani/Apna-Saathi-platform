import { useState, useEffect } from 'react';
import API from '../api/axios';
import { Map, Phone, AlertCircle, CheckCircle, Navigation } from 'lucide-react';

function OTPModal({ isOpen, onClose, onVerify }) {
  const [otp, setOtp] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-center mb-2">Verify Handshake</h3>
        <p className="text-gray-500 text-center text-sm mb-6">Enter the 4-digit code from the merchant/customer.</p>
        
        <input 
          type="number" 
          maxLength="4"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="0000"
          className="w-full text-center text-4xl tracking-widest font-black text-slate-800 border-2 border-slate-200 rounded-xl py-4 mb-6 focus:border-blue-500 focus:outline-none"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl active:bg-gray-200">Cancel</button>
          <button 
            onClick={() => {
              onVerify(otp);
              setOtp('');
            }} 
            className="flex-1 bg-green-500 text-white font-bold py-3 rounded-xl active:bg-green-600"
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActiveRoute() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOtpOpen, setIsOtpOpen] = useState(false);

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get('/riders/me');
      if (res.data.success) {
        setOrders(res.data.data.activeOrders || []);
      }
    } catch (err) {
      alert('Failed to load active batch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  const handleVerify = async (otp) => {
    try {
      if (!selectedOrder) return;
      const res = await API.post('/orders/verify-otp', {
        orderId: selectedOrder._id,
        otp
      });
      if (res.data.success) {
        alert(`Order ${res.data.data.status}`);
        setIsOtpOpen(false);
        fetchActiveOrders(); // Refresh list to drop completed orders
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid OTP');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full text-gray-500">Loading your route...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-10 bg-white shadow rounded-lg border border-gray-100 mt-10">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3" />
        <h3 className="font-bold text-xl text-gray-800">All clear!</h3>
        <p className="text-gray-500 font-medium">Head over to the Jobs Board to accept a new batch.</p>
      </div>
    );
  }

  // Generate sequence showing pickup/drop step by step
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Active Sequence</h2>
      
      {orders.map((order, index) => {
        const isPickedUp = order.status === 'picked_up' || order.status === 'in_transit';
        
        return (
          <div key={order._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <span className="bg-blue-100 text-blue-800 text-xs font-black px-2 py-1 rounded">
                Order #{order.orderNumber}
              </span>
              <span className={`text-xs font-bold uppercase ${isPickedUp ? 'text-orange-500' : 'text-purple-600'}`}>
                {isPickedUp ? 'Dropoff' : 'Pickup'}
              </span>
            </div>
            
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              {isPickedUp ? order.drop?.contactName : order.business?.name}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {isPickedUp ? order.drop?.address : order.business?.address?.street || order.pickup?.address}
            </p>

            <div className="flex gap-2">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(isPickedUp ? order.drop?.address : (order.business?.address?.street || order.pickup?.address))}`}
                target="_blank" rel="noreferrer"
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2 active:bg-gray-200"
              >
                <Map className="w-4 h-4" /> Maps
              </a>
              
              <button 
                onClick={() => {
                  setSelectedOrder(order);
                  setIsOtpOpen(true);
                }}
                className="flex-1 bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 active:bg-green-600 shadow-md"
              >
                <CheckCircle className="w-4 h-4" /> Verify
              </button>
            </div>
          </div>
        )
      })}

      <OTPModal 
        isOpen={isOtpOpen} 
        onClose={() => setIsOtpOpen(false)} 
        onVerify={handleVerify} 
      />
    </div>
  );
}
