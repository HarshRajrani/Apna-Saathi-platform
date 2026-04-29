import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import API from '../api/axios';
import MerchantLayout from '../components/Layout/MerchantLayout';
import AddressSearch from '../components/ui/AddressSearch';
import { PackagePlus, Send, Loader2, Lock, Zap, CheckCircle2, Crown, Shield, Clock } from 'lucide-react';

// Formatted marker icon
const customIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={customIcon} />
  );
}

// ── Subscription Gate Overlay Modal ──
const GATE_PLANS = [
  {
    id: 'daily',
    name: 'Daily Pass',
    price: 99,
    period: '/day',
    icon: Clock,
    description: 'Perfect for trial or single-day use.',
    features: ['Unlimited deliveries for 24 hours', 'Standard support'],
    gradient: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/20',
  },
  {
    id: 'monthly',
    name: 'Monthly Pro',
    price: 2499,
    period: '/month',
    icon: Zap,
    description: 'Best value for active businesses.',
    features: ['Unlimited deliveries for 30 days', 'Priority batching', 'Premium support'],
    isPopular: true,
    gradient: 'from-indigo-600 to-violet-600',
    shadow: 'shadow-indigo-600/30',
  },
  {
    id: 'yearly',
    name: 'Enterprise',
    price: 19999,
    period: '/year',
    icon: Crown,
    description: 'Maximum savings for high-volume.',
    features: ['365 days unlimited access', 'Dedicated support', 'Custom integrations'],
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/20',
  },
];

function SubscriptionGateModal({ onClose }) {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-checkout-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan) => {
    setLoadingPlan(plan.id);
    setError(null);

    try {
      // 1. Load Razorpay Checkout script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError('Failed to load payment gateway. Please try again.');
        setLoadingPlan(null);
        return;
      }

      // 2. Create order on backend
      const { data } = await API.post('/subscription/create-order', { plan: plan.id });
      const orderData = data.data;

      // 3. Open Razorpay Checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'DeliveryPartner',
        description: `${plan.name} Subscription`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // 4. Verify payment
            await API.post('/subscription/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan.id,
            });

            // 5. Reload to unblock
            window.location.reload();
          } catch (err) {
            setError('Payment verification failed. Contact support if amount was deducted.');
            setLoadingPlan(null);
          }
        },
        prefill: {
          name: 'Merchant',
          email: 'merchant@deliverypartner.com',
        },
        theme: {
          color: '#4F46E5',
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize payment');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm" />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-4xl mx-4 animate-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
            <Lock className="w-4 h-4" />
            Subscription Required
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Unlock Order Creation</h2>
          <p className="text-surface-400 max-w-lg mx-auto">
            Subscribe to a plan to start creating delivery orders. All plans include unlimited deliveries.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 mx-auto max-w-md bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {GATE_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`
                relative bg-surface-900/80 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300
                ${plan.isPopular
                  ? 'border-indigo-500/50 shadow-2xl shadow-indigo-600/10 scale-[1.04] md:-translate-y-2'
                  : 'border-surface-700/50 hover:border-surface-600/50'
                }
              `}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg shadow-indigo-600/30">
                  <Zap className="w-3 h-3 fill-current" /> BEST VALUE
                </div>
              )}

              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4 shadow-lg ${plan.shadow}`}>
                <plan.icon className="w-5 h-5 text-white" />
              </div>

              <h3 className="text-surface-300 font-bold uppercase tracking-wider text-xs">{plan.name}</h3>

              <div className="mt-2 mb-1 flex items-baseline text-white">
                <span className="text-3xl font-black tracking-tight">₹{plan.price.toLocaleString()}</span>
                <span className="text-surface-400 ml-1 text-sm font-medium">{plan.period}</span>
              </div>

              <p className="text-surface-400 text-sm mb-5 min-h-[36px]">{plan.description}</p>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlan !== null}
                className={`
                  w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                  ${plan.isPopular
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-surface-800 hover:bg-surface-700 text-white border border-surface-600/50'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {loadingPlan === plan.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <>
                    <Shield className="w-4 h-4" /> Subscribe Now
                  </>
                )}
              </button>

              <div className="mt-5 space-y-2.5">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-surface-300 text-xs">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MerchantNewOrder() {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState([28.6139, 77.2090]); 
  const [message, setMessage] = useState(null);
  const [showGate, setShowGate] = useState(false);
  const [subStatus, setSubStatus] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    weight: '',
    category: 'other',
    priority: false
  });

  const navigate = useNavigate();

  // ── Check subscription on mount ──
  useEffect(() => {
    const checkSub = async () => {
      try {
        const res = await API.get('/subscription/status');
        const data = res.data.data;
        setSubStatus(data);

        if (!data.isPaid || data.status === 'expired' || data.status === 'inactive') {
          setShowGate(true);
        }
      } catch (err) {
        console.error('Subscription check failed:', err);
        // If subscription check fails, don't block (could be new user)
      } finally {
        setCheckingSubscription(false);
      }
    };
    checkSub();
  }, []);

  const handleAddressSelect = (loc) => {
    setCoordinates([loc.lat, loc.lng]);
    setAddress(loc.display);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address || !coordinates) {
      showMessage('error', 'Please select destination address from the map or search.');
      return;
    }
    if (Number(formData.weight) > 10) {
      showMessage('error', 'Maximum allowed weight is 10kg');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        pickup: {
          address: 'Merchant Store Location', 
          contactName: 'Store Manager',
          contactPhone: '9999999999',
          location: { type: 'Point', coordinates: [77.2090, 28.6139] }
        },
        drop: {
          address: address,
          contactName: formData.recipientName,
          contactPhone: formData.recipientPhone,
          location: { type: 'Point', coordinates: [coordinates[1], coordinates[0]] }
        },
        weight: Number(formData.weight),
        category: formData.category,
        priority: formData.priority ? 'urgent' : 'normal',
        platform: 'own'
      };

      await API.post('/orders', payload);
      showMessage('success', 'Delivery order allocated successfully!');
      setTimeout(() => navigate('/merchant/orders'), 1000);
    } catch (err) {
      // If 402 — subscription expired
      if (err.response?.status === 402) {
        setShowGate(true);
        return;
      }
      showMessage('error', err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSubscription) {
    return (
      <MerchantLayout pageTitle="New Delivery Allocation">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout pageTitle="New Delivery Allocation">
      {/* Subscription Gate Overlay */}
      {showGate && <SubscriptionGateModal />}

      {/* Grace period banner */}
      {subStatus?.isInGracePeriod && (
        <div className="mx-4 lg:mx-8 mt-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span><strong>Grace Period:</strong> Your subscription expired. You have 24 hours to renew before access is blocked.</span>
        </div>
      )}

      {/* Toast Messages */}
      {message && (
        <div className="fixed top-20 right-4 z-50 animate-slide-up">
          <div className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            'bg-red-50 border-red-200 text-red-800'
          }`}>
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      <div className={`p-4 lg:p-8 max-w-4xl mx-auto transition-all duration-300 ${showGate ? 'filter blur-sm pointer-events-none select-none' : ''}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <PackagePlus className="w-5 h-5 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Allocate Consumer Details</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-900 rounded-2xl shadow-card border border-surface-200 dark:border-surface-800 overflow-hidden">
          
          <div className="p-6 md:p-8 border-b border-surface-100 dark:border-surface-800 space-y-6 flex-1">
            {/* Group 1: Recipient Identity */}
            <div>
              <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                1. Recipient Identity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Recipient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    className="input-field"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label-text">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm font-medium">+91</span>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      placeholder="9876543210"
                      className="input-field pl-11"
                      value={formData.recipientPhone}
                      onChange={(e) => setFormData({...formData, recipientPhone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Group 2: Geolocation */}
            <div className="pt-4">
              <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                2. The Destination (Geospatial)
              </h3>
              <div className="mb-4">
                <AddressSearch 
                  label="Search Delivery Address" 
                  value={address}
                  onChange={setAddress}
                  onSelect={handleAddressSelect}
                />
              </div>
              
              <div className="h-[300px] w-full rounded-xl overflow-hidden border-2 border-surface-200 dark:border-surface-700 shadow-inner z-0 relative group">
                <MapContainer 
                  center={coordinates} 
                  zoom={13} 
                  scrollWheelZoom={false} 
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker position={coordinates} setPosition={setCoordinates} />
                </MapContainer>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-surface-900/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg text-sm text-surface-700 dark:text-surface-300 font-medium z-[1000] border border-surface-200 dark:border-surface-700 pointer-events-none transition-opacity">
                  Drag the map or tap to precisely pin the doorstep
                </div>
              </div>
            </div>

            {/* Group 3: Parcel Specs */}
            <div className="pt-4">
              <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                3. Parcel Specs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="label-text">Weight (kg) *</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    max="10"
                    step="0.1"
                    placeholder="0.0"
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 focus:bg-white dark:focus:bg-surface-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  />
                </div>
                <div>
                  <label className="label-text">Category</label>
                  <select 
                    className="input-field"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="pharmacy">Pharmacy</option>
                    <option value="food">Food</option>
                    <option value="grocery">Grocery</option>
                    <option value="bakery">Bakery</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pb-2">
                  <span className="label-text !mb-0">Normal</span>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, priority: !formData.priority})}
                    className={`
                      relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                      transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
                      ${formData.priority ? 'bg-indigo-600' : 'bg-surface-200 dark:bg-surface-700'}
                    `}
                  >
                    <span 
                      className={`
                        inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                        ${formData.priority ? 'translate-x-5' : 'translate-x-0'}
                      `} 
                    />
                  </button>
                  <span className="label-text !mb-0 !text-red-500 font-medium">Urgent</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 bg-surface-50 dark:bg-surface-800/50 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 !px-8 flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Create Delivery Order
            </button>
          </div>
        </form>
      </div>
    </MerchantLayout>
  );
}
