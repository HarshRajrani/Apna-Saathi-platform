import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { getOrders } from '../api/orders';
import MerchantLayout from '../components/Layout/MerchantLayout';
import { PageLoader } from '../components/ui/LoadingSpinner';
import StatusBadge from '../components/ui/StatusBadge';
import { MapPin, Phone, User, Package, KeyRound, Clock, Truck, ShieldCheck, CheckCircle2, ChevronRight, Loader2, Link2, Copy, Check } from 'lucide-react';


export default function MerchantOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchOrders();

    if (socket) {
      socket.on('order:new', handleNewOrder);
      socket.on('order:assigned', handleOrderAssigned);
      socket.on('order:statusChanged', handleStatusChange);
    }

    return () => {
      if (socket) {
        socket.off('order:new');
        socket.off('order:assigned');
        socket.off('order:statusChanged');
      }
    };
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = (order) => {
    // Only add if it belongs to this merchant (backend filters it, but just in case)
    setOrders((prev) => [order, ...prev]);
  };

  const handleOrderAssigned = ({ orderId, rider }) => {
    setOrders((prev) =>
      prev.map((order) =>
        order._id === orderId
          ? { ...order, status: 'assigned', rider }
          : order
      )
    );
  };

  const handleStatusChange = ({ orderId, status }) => {
    setOrders((prev) =>
      prev.map((order) =>
        order._id === orderId ? { ...order, status } : order
      )
    );
  };

  if (loading) return <PageLoader />;

  return (
    <MerchantLayout pageTitle="Live Order Tracking">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-indigo-500" /> Live Deliveries
            </h1>
            <p className="text-surface-500 mt-1 dark:text-surface-400">Track and authorize your dispatch handshakes.</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-card border border-surface-200 dark:border-surface-800 p-12 text-center">
            <Package className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">No active orders</h3>
            <p className="text-surface-500">You haven't allocated any new deliveries yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </MerchantLayout>
  );
}

function OrderCard({ order }) {
  const [copied, setCopied] = useState(false);
  const isAssigned = ['assigned', 'picked_up', 'in_transit', 'delivered'].includes(order.status);
  const needsOTP = order.status === 'assigned' || order.status === 'pending';
  const isPending = order.status === 'pending';

  const copyTrackingLink = () => {
    if (!order.trackingId) return;
    const url = `${window.location.origin}/track/${order.trackingId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`
      bg-white dark:bg-surface-900 rounded-2xl shadow-card border 
      transition-all duration-300 relative overflow-hidden group
      ${needsOTP && !isPending ? 'border-indigo-500 shadow-indigo-500/10' : 'border-surface-200 dark:border-surface-800'}
    `}>
      {/* Top Header */}
      <div className="p-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/50 dark:bg-surface-800/20">
        <div>
          <span className="text-xs font-bold tracking-wider text-surface-500 uppercase">{order.orderNumber}</span>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-surface-600 dark:text-surface-400">
            <Clock className="w-3.5 h-3.5" />
            {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(order.createdAt))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.trackingId && (
            <button
              onClick={copyTrackingLink}
              title={`Share tracking link: /track/${order.trackingId}`}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 ${
                copied
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
          )}
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 space-y-4">
        {/* Destination */}
        <div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-white">Delivery to {order.drop.contactName}</p>
              <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{order.drop.address}</p>
            </div>
          </div>
        </div>

        {/* Rider Details */}
        {order.rider ? (
          <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3 border border-surface-100 dark:border-surface-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs ring-2 ring-white dark:ring-surface-900">
                {order.rider.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-surface-900 dark:text-white">{order.rider.name}</p>
                <div className="flex items-center gap-1 text-xs text-surface-500">
                  <Truck className="w-3 h-3" /> {order.rider.vehicleType}
                </div>
              </div>
            </div>
            <a href={`tel:${order.rider.phone}`} className="w-8 h-8 rounded-full bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 flex items-center justify-center text-surface-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
              <Phone className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3 border border-amber-100 dark:border-amber-500/20 flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Waiting for route allocation...
          </div>
        )}

      </div>

      {/* Deep OTP / Action Footer */}
      <div className="px-5 py-4 border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800">
        {needsOTP && order.rider ? (
          <div className="bg-indigo-600 rounded-xl p-4 text-white shadow-lg shadow-indigo-600/20 animate-fade-in relative overflow-hidden">
            <ShieldCheck className="absolute -bottom-2 -right-2 w-16 h-16 text-indigo-500/50 -rotate-12" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-xs font-bold tracking-wider uppercase mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Secure Handshake
                </p>
                <p className="text-sm">Give OTP to rider for pickup</p>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg font-mono text-2xl font-bold tracking-widest border border-white/30">
                {order.otp || '----'}
              </div>
            </div>
          </div>
        ) : order.status === 'delivered' ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 justify-center font-bold text-sm bg-emerald-50 dark:bg-emerald-500/10 py-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" /> Parcel Delivered Successfully
          </div>
        ) : (
          <button className="w-full py-2.5 rounded-lg border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors flex items-center justify-center gap-2">
            View Details <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
}
