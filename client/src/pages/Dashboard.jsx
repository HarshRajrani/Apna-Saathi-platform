import { useState, useEffect } from 'react';
import PageWrapper from '../components/Layout/PageWrapper';
import StatsCard from '../components/ui/StatsCard';
import StatusBadge from '../components/ui/StatusBadge';
import DashboardMap from '../components/DashboardMap';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { getOrderStats, getOrders } from '../api/orders';
import { getBillingSummary } from '../api/billing';
import { getRiders } from '../api/riders';
import API from '../api/axios';
import { useSocket } from '../context/SocketContext';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  IndianRupee,
  Bike,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [billingSummary, setBillingSummary] = useState(null);
  const [ridersData, setRidersData] = useState([]);
  const [businessesData, setBusinessesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('order:new', () => fetchDashboardData());
    socket.on('order:statusChanged', () => fetchDashboardData());

    return () => {
      socket.off('order:new');
      socket.off('order:statusChanged');
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes, billingRes, ridersRes, bizRes] = await Promise.all([
        getOrderStats(),
        getOrders({ limit: 10 }),
        getBillingSummary(),
        getRiders(),
        API.get('/businesses').catch(() => ({ data: { data: [] } })),
      ]);

      setStats(statsRes.data.data);
      setRecentOrders(ordersRes.data.data);
      setBillingSummary(billingRes.data.data);
      setRidersData(ridersRes.data.data || []);
      setBusinessesData(bizRes.data.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageWrapper pageTitle="Dashboard"><PageLoader /></PageWrapper>;

  // Mock chart data (derived from stats)
  const chartData = [
    { name: 'Mon', orders: 18, revenue: 630 },
    { name: 'Tue', orders: 24, revenue: 840 },
    { name: 'Wed', orders: 21, revenue: 735 },
    { name: 'Thu', orders: 28, revenue: 980 },
    { name: 'Fri', orders: 32, revenue: 1120 },
    { name: 'Sat', orders: 35, revenue: 1225 },
    { name: 'Sun', orders: stats?.totalToday || 12, revenue: stats?.revenueToday || 420 },
  ];

  return (
    <PageWrapper pageTitle="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <StatsCard
            title="Orders Today"
            value={stats?.totalToday || 0}
            icon={Package}
            color="primary"
          />
          <StatsCard
            title="Pending"
            value={stats?.pending || 0}
            icon={Clock}
            color="amber"
          />
          <StatsCard
            title="In Transit"
            value={stats?.inTransit || 0}
            icon={Truck}
            color="blue"
          />
          <StatsCard
            title="Delivered"
            value={stats?.delivered || 0}
            icon={CheckCircle2}
            color="green"
          />
          <StatsCard
            title="Revenue Today"
            value={`₹${stats?.revenueToday || 0}`}
            icon={IndianRupee}
            color="indigo"
          />
        </div>

        {/* Charts + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card border border-surface-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-surface-900">Weekly Overview</h3>
                <p className="text-sm text-surface-500">Orders & revenue this week</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">+12.5%</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick stats sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <Bike className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">{stats?.activeRiders || 0}</p>
                  <p className="text-sm text-surface-500">Active Riders</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">{stats?.failed || 0}</p>
                  <p className="text-sm text-surface-500">Failed Today</p>
                </div>
              </div>
            </div>

            {billingSummary && (
              <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg">
                <p className="text-sm text-primary-200 font-medium">Monthly Revenue</p>
                <p className="text-2xl font-bold mt-1">₹{billingSummary.monthlyRevenue || 0}</p>
                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-xs text-primary-200">
                    Unpaid: ₹{billingSummary.unpaidTotal || 0} ({billingSummary.unpaidCount || 0} invoices)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Map Overview */}
        <div className="bg-surface-900 rounded-2xl p-4 shadow-card border border-surface-700/30">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-white">Live Map Overview</h3>
              <p className="text-sm text-surface-400">Riders, businesses & active orders</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-surface-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Riders</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-primary-500" /> Businesses</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Orders</span>
            </div>
          </div>
          <div style={{ height: '340px' }}>
            <DashboardMap riders={ridersData} orders={recentOrders} businesses={businessesData} />
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="table-container">
          <div className="px-6 py-4 border-b border-surface-100">
            <h3 className="text-base font-semibold text-surface-900">Recent Orders</h3>
            <p className="text-sm text-surface-500">Latest 10 orders across all businesses</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50">
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Order #</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Business</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Drop Address</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Fee</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {recentOrders.map((order, idx) => (
                  <tr
                    key={order._id}
                    className={`hover:bg-surface-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface-50/50'}`}
                  >
                    <td className="px-6 py-3.5 text-sm font-medium text-primary-600">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-surface-700">
                      {order.business?.name || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-surface-600 max-w-[200px] truncate">
                      {order.drop?.address || '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium text-surface-800">
                      ₹{order.deliveryFee || 0}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-surface-500 capitalize">
                      {order.platform || '—'}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-surface-400">
                      No orders yet. Create your first order!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
