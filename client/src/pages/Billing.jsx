import { useState, useEffect } from 'react';
import PageWrapper from '../components/Layout/PageWrapper';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { getInvoices, getInvoice, generateInvoice, markInvoicePaid, getBillingSummary } from '../api/billing';
import {
  Receipt,
  Plus,
  IndianRupee,
  Calendar,
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  Search,
  Filter,
  TrendingUp,
} from 'lucide-react';

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const [invoiceRes, summaryRes] = await Promise.all([
        getInvoices(params),
        getBillingSummary(),
      ]);
      setInvoices(invoiceRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (err) {
      console.error('Billing fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    setDetailLoading(true);
    try {
      const res = await getInvoice(invoiceId);
      setSelectedInvoice(res.data.data);
    } catch (err) {
      alert('Failed to load invoice');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    try {
      await markInvoicePaid(invoiceId);
      fetchData();
      setSelectedInvoice(null);
    } catch (err) {
      alert('Failed to mark as paid');
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.business?.name?.toLowerCase().includes(q)
    );
  });

  if (loading) return <PageWrapper pageTitle="Billing"><PageLoader /></PageWrapper>;

  return (
    <PageWrapper pageTitle="Billing">
      <div className="space-y-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">₹{summary.monthlyRevenue || 0}</p>
                  <p className="text-xs text-surface-500">Monthly Revenue</p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">₹{summary.unpaidTotal || 0}</p>
                  <p className="text-xs text-surface-500">Unpaid ({summary.unpaidCount || 0})</p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">{summary.monthlyPaidInvoices || 0}</p>
                  <p className="text-xs text-surface-500">Paid Invoices</p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900">{summary.monthlyDeliveries || 0}</p>
                  <p className="text-xs text-surface-500">Monthly Deliveries</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Businesses */}
        {summary?.topBusinesses?.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-card border border-surface-100">
            <h3 className="text-sm font-semibold text-surface-900 mb-3">Top Businesses</h3>
            <div className="flex flex-wrap gap-3">
              {summary.topBusinesses.map((biz, idx) => (
                <div
                  key={biz._id}
                  className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-800">{biz.name}</p>
                    <p className="text-xs text-surface-500">{biz.totalDeliveries} deliveries • {biz.plan}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
                id="billing-search"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="select-field pl-9 pr-8"
                id="billing-status-filter"
              >
                <option value="">All Status</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary"
            id="generate-invoice-btn"
          >
            <Plus className="w-4 h-4" />
            Generate Invoice
          </button>
        </div>

        {/* Invoices Table */}
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50">
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Invoice #</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Business</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Period</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Deliveries</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Subtotal</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">GST (18%)</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Total</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredInvoices.map((inv, idx) => (
                  <tr
                    key={inv._id}
                    className={`hover:bg-surface-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-surface-50/50'}`}
                  >
                    <td className="px-6 py-3.5 text-sm font-semibold text-primary-600">{inv.invoiceNumber}</td>
                    <td className="px-6 py-3.5 text-sm text-surface-700">{inv.business?.name || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-surface-600">
                      {new Date(inv.period?.from).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} –{' '}
                      {new Date(inv.period?.to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-surface-700">{inv.totalDeliveries}</td>
                    <td className="px-6 py-3.5 text-sm text-surface-700">₹{inv.subtotal}</td>
                    <td className="px-6 py-3.5 text-sm text-surface-500">₹{inv.tax}</td>
                    <td className="px-6 py-3.5 text-sm font-bold text-surface-900">₹{inv.total}</td>
                    <td className="px-6 py-3.5"><StatusBadge status={inv.status} /></td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewInvoice(inv._id)}
                          className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-surface-500" />
                        </button>
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(inv._id)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                            title="Mark as Paid"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-sm text-surface-400">
                      No invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate Invoice Modal */}
      <GenerateInvoiceModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerated={() => {
          setShowGenerateModal(false);
          fetchData();
        }}
      />

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-surface-400">Business</p>
                <p className="text-sm font-semibold text-surface-800">{selectedInvoice.business?.name}</p>
                <p className="text-xs text-surface-500 capitalize">{selectedInvoice.business?.type} • {selectedInvoice.business?.plan}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">Status</p>
                <StatusBadge status={selectedInvoice.status} size="md" />
              </div>
              <div>
                <p className="text-xs text-surface-400">Period</p>
                <p className="text-sm text-surface-700">
                  {new Date(selectedInvoice.period?.from).toLocaleDateString('en-IN')} –{' '}
                  {new Date(selectedInvoice.period?.to).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-400">Due Date</p>
                <p className="text-sm text-surface-700">
                  {new Date(selectedInvoice.dueDate).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            {/* Orders */}
            {selectedInvoice.orders?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
                  Orders ({selectedInvoice.orders.length})
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedInvoice.orders.map((order) => (
                    <div
                      key={order._id}
                      className="flex items-center justify-between p-2.5 bg-surface-50 rounded-lg"
                    >
                      <span className="text-sm font-medium text-primary-600">{order.orderNumber}</span>
                      <span className="text-sm font-medium text-surface-700">₹{order.deliveryFee}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-surface-200 pt-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-surface-500">Subtotal</span>
                <span className="text-surface-700">₹{selectedInvoice.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-surface-500">GST (18%)</span>
                <span className="text-surface-700">₹{selectedInvoice.tax}</span>
              </div>
              <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-surface-200">
                <span className="text-surface-900">Total</span>
                <span className="text-surface-900">₹{selectedInvoice.total}</span>
              </div>
            </div>

            {selectedInvoice.status !== 'paid' && (
              <button
                onClick={() => handleMarkPaid(selectedInvoice._id)}
                className="btn-success w-full"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark as Paid
              </button>
            )}
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}

// ============================================================
// GENERATE INVOICE MODAL
// ============================================================
function GenerateInvoiceModal({ isOpen, onClose, onGenerated }) {
  const [businessId, setBusinessId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch businesses
      import('../api/axios').then(({ default: API }) => {
        API.get('/billing/summary').then((res) => {
          if (res.data.data?.topBusinesses) {
            setBusinesses(res.data.data.topBusinesses);
          }
        });
      });

      // Set default date range (last month)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      setFrom(firstDay.toISOString().split('T')[0]);
      setTo(lastDay.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await generateInvoice(businessId, from, to);
      onGenerated();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Invoice">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-text">Business</label>
          <select
            className="select-field"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            required
          >
            <option value="">Select business...</option>
            {businesses.map((biz) => (
              <option key={biz._id} value={biz._id}>
                {biz.name} ({biz.type})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text">From</label>
            <input
              type="date"
              className="input-field"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-text">To</label>
            <input
              type="date"
              className="input-field"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
            Generate Invoice
          </button>
        </div>
      </form>
    </Modal>
  );
}
