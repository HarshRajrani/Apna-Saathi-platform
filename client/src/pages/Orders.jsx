import { useState, useEffect } from 'react';
import PageWrapper from '../components/Layout/PageWrapper';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import AddressSearch from '../components/ui/AddressSearch';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { getOrders, createOrder, assignRider, updateOrderStatus } from '../api/orders';
import { getAvailableRiders } from '../api/riders';
import { useSocket } from '../context/SocketContext';
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Phone,
  User,
  Package,
  Loader2,
  X,
  ChevronRight,
} from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [availableRiders, setAvailableRiders] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:new', () => fetchOrders());
    socket.on('order:assigned', () => fetchOrders());
    socket.on('order:statusChanged', () => fetchOrders());
    return () => {
      socket.off('order:new');
      socket.off('order:assigned');
      socket.off('order:statusChanged');
    };
  }, [socket]);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await getOrders(params);
      setOrders(res.data.data);
    } catch (err) {
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRider = async (orderId, riderId) => {
    try {
      await assignRider(orderId, riderId);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign rider');
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const openOrderDetail = async (order) => {
    setSelectedOrder(order);
    try {
      const res = await getAvailableRiders();
      setAvailableRiders(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(q) ||
      order.business?.name?.toLowerCase().includes(q) ||
      order.drop?.address?.toLowerCase().includes(q) ||
      order.drop?.contactName?.toLowerCase().includes(q)
    );
  });

  const statuses = ['', 'pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'];

  if (loading) return <PageWrapper pageTitle="Orders"><PageLoader /></PageWrapper>;

  return (
    <PageWrapper pageTitle="Orders">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
                id="orders-search"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="select-field pl-9 pr-8 min-w-[140px]"
                id="orders-status-filter"
              >
                <option value="">All Status</option>
                {statuses.filter(Boolean).map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            id="create-order-btn"
          >
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </div>

        {/* Orders Table */}
        <div className="table-container">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50">
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Order</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Business</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Customer</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Drop</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Rider</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Priority</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3">Fee</th>
                  <th className="text-left text-xs font-semibold text-surface-500 uppercase tracking-wider px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {filteredOrders.map((order, idx) => (
                  <tr
                    key={order._id}
                    className={`hover:bg-primary-50/50 transition-colors cursor-pointer ${
                      idx % 2 === 0 ? '' : 'bg-surface-50/50'
                    }`}
                    onClick={() => openOrderDetail(order)}
                  >
                    <td className="px-6 py-3.5 text-sm font-semibold text-primary-600">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-surface-700">{order.business?.name || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-surface-700">{order.drop?.contactName || '—'}</td>
                    <td className="px-6 py-3.5 text-sm text-surface-600 max-w-[180px] truncate">
                      {order.drop?.address || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-surface-600">
                      {order.rider?.name || <span className="text-surface-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-3.5"><StatusBadge status={order.status} /></td>
                    <td className="px-6 py-3.5"><StatusBadge status={order.priority} /></td>
                    <td className="px-6 py-3.5 text-sm font-medium text-surface-800">₹{order.deliveryFee}</td>
                    <td className="px-6 py-3.5">
                      <ChevronRight className="w-4 h-4 text-surface-400" />
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center text-sm text-surface-400">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          fetchOrders();
        }}
      />

      {/* Order Detail Panel */}
      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          availableRiders={availableRiders}
          onClose={() => setSelectedOrder(null)}
          onAssign={handleAssignRider}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </PageWrapper>
  );
}

// ============================================================
// CREATE ORDER MODAL
// ============================================================
function CreateOrderModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    business: '',
    pickupAddress: '',
    pickupLat: '12.9784',
    pickupLng: '77.6408',
    pickupContact: '',
    pickupPhone: '',
    dropAddress: '',
    dropLat: '12.9352',
    dropLng: '77.6167',
    dropContact: '',
    dropPhone: '',
    priority: 'normal',
    deliveryFee: '35',
    platform: 'own',
    notes: '',
  });
  const [businesses, setBusinesses] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch businesses for dropdown
      import('../api/axios').then(({ default: API }) => {
        API.get('/businesses').then((res) => {
          setBusinesses(res.data.data || []);
        }).catch((err) => console.error('Error fetching businesses:', err));
      });
    }
  }, [isOpen]);

  const handleBusinessChange = (businessId) => {
    const biz = businesses.find((b) => b._id === businessId);
    if (biz) {
      setFormData((prev) => ({
        ...prev,
        business: businessId,
        pickupAddress: `${biz.address.street}, ${biz.address.area}, ${biz.address.city}`,
        pickupLat: String(biz.address.location.coordinates[1]),
        pickupLng: String(biz.address.location.coordinates[0]),
        pickupContact: biz.name,
        pickupPhone: biz.phone,
      }));
    } else {
      setFormData((prev) => ({ ...prev, business: businessId }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.business) {
      alert('Please select a business');
      return;
    }
    setSubmitting(true);
    try {
      await createOrder({
        business: formData.business,
        pickup: {
          address: formData.pickupAddress,
          location: {
            type: 'Point',
            coordinates: [parseFloat(formData.pickupLng), parseFloat(formData.pickupLat)],
          },
          contactName: formData.pickupContact,
          contactPhone: formData.pickupPhone,
        },
        drop: {
          address: formData.dropAddress,
          location: {
            type: 'Point',
            coordinates: [parseFloat(formData.dropLng), parseFloat(formData.dropLat)],
          },
          contactName: formData.dropContact,
          contactPhone: formData.dropPhone,
        },
        priority: formData.priority,
        deliveryFee: parseFloat(formData.deliveryFee),
        platform: formData.platform,
        notes: formData.notes,
      });
      onCreated();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Order" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Business Selector */}
        <div>
          <label className="label-text">Select Business *</label>
          <select
            className="select-field"
            value={formData.business}
            onChange={(e) => handleBusinessChange(e.target.value)}
            required
          >
            <option value="">Choose a business...</option>
            {businesses.map((biz) => (
              <option key={biz._id} value={biz._id}>
                {biz.name} ({biz.type})
              </option>
            ))}
          </select>
          <p className="text-xs text-surface-400 mt-1">Selecting a business auto-fills pickup details</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pickup Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-surface-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" /> Pickup Details
            </h4>
            <div>
              <label className="label-text">Address</label>
              <input className="input-field" required value={formData.pickupAddress}
                onChange={(e) => updateField('pickupAddress', e.target.value)}
                placeholder="23 MG Road, Indiranagar" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-text">Latitude</label>
                <input className="input-field" required value={formData.pickupLat}
                  onChange={(e) => updateField('pickupLat', e.target.value)} />
              </div>
              <div>
                <label className="label-text">Longitude</label>
                <input className="input-field" required value={formData.pickupLng}
                  onChange={(e) => updateField('pickupLng', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label-text">Contact Name</label>
              <input className="input-field" required value={formData.pickupContact}
                onChange={(e) => updateField('pickupContact', e.target.value)}
                placeholder="Tasty Kitchen" />
            </div>
            <div>
              <label className="label-text">Contact Phone</label>
              <input className="input-field" required value={formData.pickupPhone}
                onChange={(e) => updateField('pickupPhone', e.target.value)}
                placeholder="9876543211" />
            </div>
          </div>

          {/* Drop Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-surface-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" /> Drop Details
            </h4>
            <AddressSearch
              label="Drop Address"
              value={formData.dropAddress}
              onChange={(val) => updateField('dropAddress', val)}
              onSelect={(result) => {
                updateField('dropAddress', result.display);
                updateField('dropLat', String(result.lat));
                updateField('dropLng', String(result.lng));
              }}
              placeholder="Type drop address to search..."
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label-text">Latitude</label>
                <input className="input-field" required value={formData.dropLat}
                  onChange={(e) => updateField('dropLat', e.target.value)} />
              </div>
              <div>
                <label className="label-text">Longitude</label>
                <input className="input-field" required value={formData.dropLng}
                  onChange={(e) => updateField('dropLng', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label-text">Contact Name</label>
              <input className="input-field" required value={formData.dropContact}
                onChange={(e) => updateField('dropContact', e.target.value)}
                placeholder="Customer Name" />
            </div>
            <div>
              <label className="label-text">Contact Phone</label>
              <input className="input-field" required value={formData.dropPhone}
                onChange={(e) => updateField('dropPhone', e.target.value)}
                placeholder="9876543300" />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="label-text">Priority</label>
            <select className="select-field" value={formData.priority}
              onChange={(e) => updateField('priority', e.target.value)}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="label-text">Fee (₹)</label>
            <input className="input-field" type="number" value={formData.deliveryFee}
              onChange={(e) => updateField('deliveryFee', e.target.value)} />
          </div>
          <div>
            <label className="label-text">Platform</label>
            <select className="select-field" value={formData.platform}
              onChange={(e) => updateField('platform', e.target.value)}>
              <option value="own">Own</option>
              <option value="swiggy">Swiggy</option>
              <option value="zomato">Zomato</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="website">Website</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label-text">Notes</label>
            <input className="input-field" value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Optional" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Order
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// ORDER DETAIL PANEL (Slide-in)
// ============================================================
function OrderDetailPanel({ order, availableRiders, onClose, onAssign, onStatusUpdate }) {
  const nextStatus = {
    pending: 'assigned',
    assigned: 'picked_up',
    picked_up: 'in_transit',
    in_transit: 'delivered',
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 overflow-y-auto animate-slide-right">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 py-4 border-b border-surface-200 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-surface-900">{order.orderNumber}</h3>
            <StatusBadge status={order.status} />
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-100 transition-colors">
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Business */}
          <div>
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Business</p>
            <p className="text-sm font-medium text-surface-800">{order.business?.name || '—'}</p>
            <p className="text-xs text-surface-500 capitalize">{order.business?.type}</p>
          </div>

          {/* Pickup */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Pickup
            </p>
            <p className="text-sm text-surface-800">{order.pickup?.address}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-surface-600 flex items-center gap-1">
                <User className="w-3 h-3" /> {order.pickup?.contactName}
              </span>
              <span className="text-xs text-surface-600 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {order.pickup?.contactPhone}
              </span>
            </div>
          </div>

          {/* Drop */}
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Drop
            </p>
            <p className="text-sm text-surface-800">{order.drop?.address}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-surface-600 flex items-center gap-1">
                <User className="w-3 h-3" /> {order.drop?.contactName}
              </span>
              <span className="text-xs text-surface-600 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {order.drop?.contactPhone}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-surface-400">Delivery Fee</p>
              <p className="text-sm font-bold text-surface-800">₹{order.deliveryFee}</p>
            </div>
            <div>
              <p className="text-xs text-surface-400">Platform</p>
              <p className="text-sm font-medium text-surface-800 capitalize">{order.platform}</p>
            </div>
            <div>
              <p className="text-xs text-surface-400">Priority</p>
              <StatusBadge status={order.priority} />
            </div>
            <div>
              <p className="text-xs text-surface-400">Rider</p>
              <p className="text-sm font-medium text-surface-800">{order.rider?.name || 'Unassigned'}</p>
            </div>
          </div>

          {order.notes && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
              <p className="text-sm text-surface-700">{order.notes}</p>
            </div>
          )}

          {/* Assign Rider (if pending) */}
          {order.status === 'pending' && availableRiders.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Assign Rider</p>
              <div className="space-y-2">
                {availableRiders.map((rider) => (
                  <button
                    key={rider._id}
                    onClick={() => onAssign(order._id, rider._id)}
                    className="w-full flex items-center justify-between p-3 bg-surface-50 rounded-xl hover:bg-primary-50 border border-surface-200 hover:border-primary-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-surface-800">{rider.name}</p>
                        <p className="text-xs text-surface-500">{rider.vehicleType} • ⭐ {rider.rating}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-surface-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Update */}
          {nextStatus[order.status] && (
            <button
              onClick={() => onStatusUpdate(order._id, nextStatus[order.status])}
              className="btn-success w-full"
            >
              Mark as {nextStatus[order.status].replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
