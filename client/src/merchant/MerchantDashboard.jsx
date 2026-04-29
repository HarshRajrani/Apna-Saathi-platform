import { useState, useEffect } from 'react';
import { Package, Clock, Truck, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
import API from '../api/axios';
import MerchantLayout from '../components/Layout/MerchantLayout';

export default function MerchantDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get('/orders/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statCards = [
    { title: "Today's Deliveries", value: stats?.totalToday || 0, icon: Package, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-500/20" },
    { title: "Pending Orders", value: stats?.pending || 0, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20" },
    { title: "In Transit", value: (stats?.assigned || 0) + (stats?.inTransit || 0), icon: Truck, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-500/20" },
    { title: "Successfully Delivered", value: stats?.delivered || 0, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
  ];

  return (
    <MerchantLayout pageTitle="Merchant Dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="text-indigo-500" /> Overview & Performance
          </h2>
          <p className="text-surface-500 mt-1 dark:text-surface-400">Track your daily delivery flow and allocations instantly.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, idx) => (
            <div key={idx} className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-card border border-surface-200 dark:border-surface-800 flex items-center gap-4 transition-transform hover:-translate-y-1">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400">{stat.title}</p>
                <p className="text-2xl font-black text-surface-900 dark:text-white tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity Box */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-card border border-surface-200 dark:border-surface-800 overflow-hidden">
          <div className="p-6 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">Expense Snapshot</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="text-surface-500 dark:text-surface-400 mb-1">Total Delivery Costs Today</p>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              ₹{stats?.revenueToday ? stats.revenueToday.toLocaleString() : '0'}
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> In compliance with current SLA package
            </p>
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}
