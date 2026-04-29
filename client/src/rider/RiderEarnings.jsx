import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, PackageCheck, Banknote, ArrowDownToLine, X, Loader2, Clock, CheckCircle2, XCircle, IndianRupee } from 'lucide-react';
import API from '../api/axios';

// ── Withdraw Modal ──
function WithdrawModal({ availableBalance, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) < 1) {
      setError('Minimum withdrawal is ₹1');
      return;
    }
    if (Number(amount) > availableBalance) {
      setError(`Insufficient balance. Available: ₹${availableBalance}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await API.post('/riders/payout-request', {
        amount: Number(amount),
        upiId: upiId || null,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ArrowDownToLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Request Withdrawal</h3>
            <p className="text-sm text-gray-500">Available: <span className="font-bold text-emerald-600">₹{availableBalance.toLocaleString()}</span></p>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
              <input
                type="number"
                min="1"
                max={availableBalance}
                step="1"
                required
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-lg font-semibold"
              />
            </div>
            {/* Quick amount buttons */}
            <div className="flex gap-2 mt-2">
              {[100, 500, 1000].filter(v => v <= availableBalance).map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors"
                >
                  ₹{val}
                </button>
              ))}
              {availableBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(availableBalance.toString())}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  Max
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">UPI ID (optional)</label>
            <input
              type="text"
              placeholder="yourname@paytm"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDownToLine className="w-5 h-5" />}
            {loading ? 'Submitting...' : 'Request Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Payout Status Badge ──
function PayoutStatusBadge({ status }) {
  const config = {
    pending: { icon: Clock, text: 'Pending', bg: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
    approved: { icon: CheckCircle2, text: 'Approved', bg: 'bg-blue-50 text-blue-700', dot: 'bg-blue-400' },
    processed: { icon: CheckCircle2, text: 'Processed', bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-400' },
    rejected: { icon: XCircle, text: 'Rejected', bg: 'bg-red-50 text-red-700', dot: 'bg-red-400' },
  };
  const c = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.text}
    </span>
  );
}

export default function RiderEarnings() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    todayEarnings: 0,
    deliveriesToday: 0,
    totalEarnings: 0,
    totalDeliveries: 0,
    availableBalance: 0,
    totalPayouts: 0,
    weeklyData: [],
  });
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchEarnings = async () => {
    try {
      const [earningsRes, payoutsRes] = await Promise.all([
        API.get('/riders/earnings'),
        API.get('/riders/payout-requests'),
      ]);
      if (earningsRes.data.success) setData(earningsRes.data.data);
      if (payoutsRes.data.success) setPayoutRequests(payoutsRes.data.data);
    } catch (err) {
      console.error('Failed to load earnings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handleWithdrawSuccess = () => {
    setShowWithdrawModal(false);
    setMessage({ type: 'success', text: 'Withdrawal request submitted! Admin will review it shortly.' });
    setTimeout(() => setMessage(null), 4000);
    fetchEarnings();
  };

  if (loading) return (
    <div className="flex justify-center items-center h-full text-gray-500 py-20">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
        <p className="text-sm font-medium">Loading earnings dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Toast */}
      {message && (
        <div className={`mx-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          {message.text}
        </div>
      )}

      <h2 className="text-2xl font-bold text-slate-800 mb-2">Earnings Dashboard</h2>
      
      {/* Primary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl shadow-blue-900/20">
          <div className="flex justify-between items-start mb-4">
            <Wallet className="w-8 h-8 text-blue-200" />
            <TrendingUp className="w-5 h-5 text-green-300" />
          </div>
          <p className="text-blue-100 text-sm font-medium mb-1">Today's Earnings</p>
          <h3 className="text-3xl font-black">₹{data.todayEarnings || 0}</h3>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <PackageCheck className="w-8 h-8 text-orange-500 mb-4" />
          <p className="text-gray-500 text-sm font-medium mb-1">Today's Deliveries</p>
          <h3 className="text-3xl font-black text-slate-800">{data.deliveriesToday || 0}</h3>
        </div>
      </div>

      {/* Balance & Withdraw */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-xl shadow-emerald-900/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Banknote className="w-8 h-8 text-emerald-100" />
            <div>
              <p className="text-emerald-100 text-sm font-medium">Available Balance</p>
              <h3 className="text-3xl font-black">₹{(data.availableBalance || 0).toLocaleString()}</h3>
            </div>
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={data.availableBalance <= 0}
            className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Withdraw
          </button>
        </div>
        <div className="flex items-center gap-4 text-emerald-100 text-xs mt-2">
          <span>Total Earned: <strong className="text-white">₹{(data.totalEarnings || 0).toLocaleString()}</strong></span>
          <span className="w-1 h-1 rounded-full bg-emerald-200" />
          <span>Withdrawn: <strong className="text-white">₹{(data.totalPayouts || 0).toLocaleString()}</strong></span>
          <span className="w-1 h-1 rounded-full bg-emerald-200" />
          <span>Total Deliveries: <strong className="text-white">{data.totalDeliveries || 0}</strong></span>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Weekly Trend</h3>
        <div className="h-56 w-full -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.weeklyData}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 13, fontWeight: 500}} dy={10} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#4F46E5', fontWeight: 'bold' }}
                formatter={(value) => [`₹${value}`, 'Earnings']}
              />
              <Area type="monotone" dataKey="earnings" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorEarnings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payout History */}
      {payoutRequests.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-indigo-500" />
            Withdrawal History
          </h3>
          <div className="space-y-3">
            {payoutRequests.map((req) => (
              <div key={req._id} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 hover:bg-indigo-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <ArrowDownToLine className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">₹{req.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">
                      {new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(req.requestedAt || req.createdAt))}
                    </p>
                  </div>
                </div>
                <PayoutStatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <WithdrawModal
          availableBalance={data.availableBalance}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={handleWithdrawSuccess}
        />
      )}
    </div>
  );
}
