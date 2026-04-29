import { useState, useEffect } from 'react';
import { Receipt, Download, FileText, CheckCircle2, CreditCard, Calendar, IndianRupee } from 'lucide-react';
import API from '../api/axios';
import MerchantLayout from '../components/Layout/MerchantLayout';

export default function MerchantBilling() {
  const [invoices, setInvoices] = useState([]);
  const [subInvoices, setSubInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscription');

  useEffect(() => {
    fetchAllInvoices();
  }, []);

  const fetchAllInvoices = async () => {
    try {
      const [deliveryRes, subRes] = await Promise.all([
        API.get('/billing/invoices'),
        API.get('/subscription/invoices'),
      ]);
      setInvoices(deliveryRes.data.data);
      setSubInvoices(subRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'subscription', label: 'Subscription Payments', icon: CreditCard, count: subInvoices.length },
    { id: 'delivery', label: 'Delivery Invoices', icon: FileText, count: invoices.length },
  ];

  const handleDownload = (inv) => {
    const isSub = inv.type === 'subscription';
    
    let content = `====================================================\n`;
    content += `                  INVOICE RECEIPT\n`;
    content += `====================================================\n\n`;
    content += `Invoice No: ${inv.invoiceNumber}\n`;
    content += `Date: ${new Date(inv.createdAt).toLocaleString()}\n`;
    content += `Status: ${inv.status.toUpperCase()}\n\n`;
    
    if (isSub) {
      content += `Type: Subscription Payment\n`;
      content += `Plan: ${inv.subscriptionPlan?.toUpperCase()}\n`;
      content += `Payment ID: ${inv.razorpayPaymentId || 'N/A'}\n\n`;
    } else {
      content += `Type: Delivery Billing\n`;
      content += `Deliveries Included: ${inv.orders?.length || 0}\n\n`;
    }
    
    content += `----------------------------------------------------\n`;
    if (inv.subtotal !== undefined) {
      content += `Subtotal:    ₹ ${inv.subtotal.toFixed(2)}\n`;
      content += `GST (18%):   ₹ ${inv.tax.toFixed(2)}\n`;
    }
    content += `TOTAL PAID:  ₹ ${inv.total.toFixed(2)}\n`;
    content += `----------------------------------------------------\n\n`;
    content += `Thank you for your business!`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${inv.invoiceNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderSubscriptionInvoices = () => {
    if (subInvoices.length === 0) {
      return (
        <div className="p-16 text-center">
          <CreditCard className="w-16 h-16 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">No Subscription Payments</h3>
          <p className="text-surface-500">Your subscription payment records will appear here.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-800/50 text-surface-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800">Invoice</th>
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800">Plan</th>
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800">Date</th>
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800">Subtotal</th>
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800">GST (18%)</th>
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800">Total</th>
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800">Payment ID</th>
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800">Status</th>
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {subInvoices.map((inv) => (
              <tr key={inv._id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors group">
                <td className="p-4 font-mono text-sm text-surface-900 dark:text-white">{inv.invoiceNumber}</td>
                <td className="p-4">
                  <span className="capitalize px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                    {inv.subscriptionPlan}
                  </span>
                </td>
                <td className="p-4 text-sm text-surface-600 dark:text-surface-300">
                  {new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(inv.paidAt || inv.createdAt))}
                </td>
                <td className="p-4 text-sm text-surface-600 dark:text-surface-300">
                  ₹{inv.subtotal?.toLocaleString()}
                </td>
                <td className="p-4 text-sm text-surface-600 dark:text-surface-300">
                  ₹{inv.tax?.toLocaleString()}
                </td>
                <td className="p-4 text-sm font-bold text-surface-900 dark:text-white">
                  ₹{inv.total?.toLocaleString()}
                </td>
                <td className="p-4 text-xs font-mono text-surface-400 dark:text-surface-500 max-w-[140px] truncate" title={inv.razorpayPaymentId}>
                  {inv.razorpayPaymentId || '—'}
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    PAID
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleDownload(inv)}
                    className="p-2 text-surface-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100 bg-white dark:bg-surface-800 shadow-sm border border-surface-200 dark:border-surface-700 rounded-lg"
                    title="Download Receipt"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDeliveryInvoices = () => {
    if (invoices.length === 0) {
      return (
        <div className="p-16 text-center">
          <FileText className="w-16 h-16 text-surface-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">No Invoices Yet</h3>
          <p className="text-surface-500">Your billing statements will appear here automatically.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-50 dark:bg-surface-800/50 text-surface-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800">Invoice ID</th>
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800">Date Issued</th>
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800">Amount</th>
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800">Status</th>
              <th className="p-4 font-medium border-b border-surface-200 dark:border-surface-800 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {invoices.map((inv) => (
              <tr key={inv._id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors group">
                <td className="p-4 font-mono text-sm text-surface-900 dark:text-white">{inv.invoiceNumber}</td>
                <td className="p-4 text-sm text-surface-600 dark:text-surface-300">
                   {new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(inv.createdAt))}
                </td>
                <td className="p-4 text-sm font-bold text-surface-900 dark:text-white">
                   ₹{inv.total.toLocaleString()}
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1
                    ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}
                  `}>
                    {inv.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                    {inv.status.toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleDownload(inv)}
                    className="p-2 text-surface-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100 bg-white dark:bg-surface-800 shadow-sm border border-surface-200 dark:border-surface-700 rounded-lg"
                    title="Download Receipt"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <MerchantLayout pageTitle="Billing & Invoices">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Receipt className="text-indigo-500" /> Financial Dashboard
          </h2>
          <p className="text-surface-500 mt-1 dark:text-surface-400">View your subscription payments, delivery invoices, and manage billing.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-card border border-surface-200 dark:border-surface-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Subscription Payments</p>
              <p className="text-2xl font-black text-surface-900 dark:text-white">{subInvoices.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-card border border-surface-200 dark:border-surface-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Total Paid</p>
              <p className="text-2xl font-black text-surface-900 dark:text-white">
                ₹{[...subInvoices, ...invoices].filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-card border border-surface-200 dark:border-surface-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Delivery Invoices</p>
              <p className="text-2xl font-black text-surface-900 dark:text-white">{invoices.length}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-card border border-surface-200 dark:border-surface-800 overflow-hidden">
          <div className="border-b border-surface-200 dark:border-surface-800 px-4">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all -mb-px
                    ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                      : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-20 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            activeTab === 'subscription' ? renderSubscriptionInvoices() : renderDeliveryInvoices()
          )}
        </div>
      </div>
    </MerchantLayout>
  );
}
