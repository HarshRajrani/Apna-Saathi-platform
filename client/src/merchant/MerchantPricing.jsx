import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Zap, Loader2, Shield, Clock, Crown, Calendar, RefreshCw } from 'lucide-react';
import API from '../api/axios';
import MerchantLayout from '../components/Layout/MerchantLayout';

const plans = [
  {
    id: 'daily',
    name: 'Daily Pass',
    price: 99,
    period: '/day',
    icon: Clock,
    description: 'Perfect for occasional or trial use.',
    features: ['Unlimited deliveries for 24 hours', 'Standard support', 'Basic batching access'],
    isPopular: false,
    gradient: 'from-surface-700 to-surface-800',
    shadow: 'shadow-saffron-500/5',
  },
  {
    id: 'monthly',
    name: 'Monthly Pro',
    price: 2499,
    period: '/month',
    icon: Zap,
    description: 'Best choice for active local businesses.',
    features: ['Unlimited deliveries for 30 days', 'Priority batching allocation', 'Premium email support', 'Advanced routing'],
    isPopular: true,
    gradient: 'from-saffron-400 to-saffron-600',
    shadow: 'shadow-saffron-500/30',
  },
  {
    id: 'yearly',
    name: 'Enterprise Yearly',
    price: 19999,
    period: '/year',
    icon: Crown,
    description: 'Maximum value for high-volume merchants.',
    features: ['Unlimited deliveries for 365 days', 'Maximum priority batching', '24/7 dedicated support', 'Custom integrations'],
    isPopular: false,
    gradient: 'from-surface-700 to-surface-800',
    shadow: 'shadow-saffron-500/5',
  },
];

export default function MerchantPricing() {
  const [loading, setLoading] = useState(null);
  const [subStatus, setSubStatus] = useState(null);
  const [message, setMessage] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await API.get('/subscription/status');
      setSubStatus(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSub(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

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
    setLoading(plan.id);

    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        showMessage('error', 'Failed to load payment gateway.');
        setLoading(null);
        return;
      }

      // 2. Create Razorpay order
      const { data } = await API.post('/subscription/create-order', { plan: plan.id });
      const orderData = data.data;

      // 3. Open Razorpay Checkout modal
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'DeliveryPartner',
        description: `${plan.name} Subscription`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // 4. Verify the payment signature
            await API.post('/subscription/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan.id,
            });

            showMessage('success', 'Subscription activated successfully! 🎉');

            // 5. Reload to refresh subscription state everywhere
            setTimeout(() => window.location.reload(), 1200);
          } catch (err) {
            showMessage('error', 'Payment verification failed. Contact support if deducted.');
            setLoading(null);
          }
        },
        prefill: {
          name: 'Merchant',
          email: 'merchant@deliverypartner.com',
        },
        theme: {
          color: '#FF9F1C',
        },
        modal: {
          ondismiss: function () {
            setLoading(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to initialize payment');
      setLoading(null);
    }
  };

  return (
    <MerchantLayout pageTitle="Select Your Plan">
      {/* Toast Messages */}
      {message && (
        <div className="fixed top-20 right-4 z-50 animate-slide-up">
          <div className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300' :
            message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' :
            'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
          }`}>
            {message.type === 'info' && <Loader2 className="w-5 h-5 animate-spin" />}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* Current Subscription Status */}
        {!loadingSub && subStatus?.isPaid && (
          <div className="mb-8 bg-navy rounded-2xl shadow-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Active Subscription</h3>
                  <p className="text-surface-400 text-sm">
                    <span className="capitalize font-semibold text-emerald-400">{subStatus.plan}</span> plan •{' '}
                    {subStatus.daysRemaining > 0
                      ? `${subStatus.daysRemaining} days remaining`
                      : 'Expired — renew now'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-surface-400">
                <Calendar className="w-4 h-4" />
                Expires: {subStatus.expiryDate
                  ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(subStatus.expiryDate))
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-black text-white mb-3">Choose the right plan for your business</h2>
          <p className="text-surface-400 text-lg max-w-2xl mx-auto">
            Unlock the power of automated batch delivery. {subStatus?.isPaid ? 'Upgrade or extend your subscription below.' : 'Subscribe now to start creating orders.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = subStatus?.isPaid && subStatus?.plan === plan.id;
            
            return (
              <div 
                key={plan.id}
                className={`
                  relative bg-navy rounded-2xl shadow-2xl p-8 border border-white/5 transition-all duration-300
                  ${plan.isPopular 
                    ? 'border-saffron-500/50 shadow-saffron-500/10 scale-105 md:-translate-y-4' 
                    : 'hover:border-white/10'
                  }
                `}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-saffron-400 to-saffron-600 text-charcoal px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg shadow-saffron-500/20">
                    <Zap className="w-3.5 h-3.5 fill-current" /> MOST POPULAR
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4 shadow-lg ${plan.shadow}`}>
                  <plan.icon className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-surface-400 font-bold uppercase tracking-wider text-sm">
                  {plan.name}
                </h3>
                
                <div className="mt-4 mb-2 flex items-baseline text-white">
                  <span className="text-4xl font-display font-black tracking-tight">₹{plan.price.toLocaleString()}</span>
                  <span className="text-surface-400 ml-1 font-medium">{plan.period}</span>
                </div>
                
                <p className="text-surface-300 mb-8 min-h-[48px]">{plan.description}</p>

                <button 
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading !== null}
                  className={`
                    w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                    ${isCurrentPlan 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : plan.isPopular
                        ? 'bg-saffron-500 hover:bg-saffron-400 text-charcoal shadow-lg shadow-saffron-500/20 font-bold'
                        : 'bg-surface-800 hover:bg-surface-700 text-white'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {loading === plan.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : isCurrentPlan ? (
                    <><CheckCircle2 className="w-4 h-4" /> Current Plan — Extend</>
                  ) : (
                    <><Shield className="w-4 h-4" /> Subscribe Now</>
                  )}
                </button>

                <div className="mt-8 space-y-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex flex-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-saffron-500 flex-shrink-0" />
                      <span className="text-surface-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MerchantLayout>
  );
}
