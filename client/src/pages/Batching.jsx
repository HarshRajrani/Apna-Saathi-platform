import { useState, useEffect } from 'react';
import PageWrapper from '../components/Layout/PageWrapper';
import StatusBadge from '../components/ui/StatusBadge';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { generateBatches, assignBatch, getActiveBatches } from '../api/routes';
import { useSocket } from '../context/SocketContext';
import {
  Route,
  Play,
  Loader2,
  MapPin,
  Package,
  User,
  Zap,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Navigation,
} from 'lucide-react';

export default function Batching() {
  const [batches, setBatches] = useState([]);
  const [activeBatches, setActiveBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [assigningBatch, setAssigningBatch] = useState(null);
  const [radiusKm, setRadiusKm] = useState(2);
  const [maxBatchSize, setMaxBatchSize] = useState(4);
  const [tab, setTab] = useState('generate'); // 'generate' | 'active'
  const socket = useSocket();

  useEffect(() => {
    fetchActiveBatches();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('batch:assigned', () => fetchActiveBatches());
    return () => socket.off('batch:assigned');
  }, [socket]);

  const fetchActiveBatches = async () => {
    try {
      const res = await getActiveBatches();
      setActiveBatches(res.data.data);
    } catch (err) {
      console.error('Fetch active batches error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBatches = async () => {
    setGenerating(true);
    try {
      const res = await generateBatches(radiusKm, maxBatchSize);
      setBatches(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate batches');
    } finally {
      setGenerating(false);
    }
  };

  const handleAssignBatch = async (batch) => {
    setAssigningBatch(batch.batchId);
    try {
      const orderIds = batch.orders.map((o) => o.orderId);
      const res = await assignBatch(batch.batchId, orderIds);
      // Remove assigned batch from list
      setBatches((prev) => prev.filter((b) => b.batchId !== batch.batchId));
      fetchActiveBatches();
      alert(`✅ Batch assigned to ${res.data.data.rider.name}!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign batch');
    } finally {
      setAssigningBatch(null);
    }
  };

  if (loading) return <PageWrapper pageTitle="Batching"><PageLoader /></PageWrapper>;

  return (
    <PageWrapper pageTitle="Route Batching">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab('generate')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === 'generate'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            Generate Batches
          </button>
          <button
            onClick={() => setTab('active')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === 'active'
                ? 'bg-white text-surface-900 shadow-sm'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            Active Batches ({activeBatches.length})
          </button>
        </div>

        {tab === 'generate' && (
          <>
            {/* Config + Generate */}
            <div className="bg-white rounded-2xl p-6 shadow-card border border-surface-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div>
                  <label className="label-text">Radius (km)</label>
                  <input
                    type="number"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="input-field w-24"
                    min={1}
                    max={10}
                  />
                </div>
                <div>
                  <label className="label-text">Max per Batch</label>
                  <input
                    type="number"
                    value={maxBatchSize}
                    onChange={(e) => setMaxBatchSize(Number(e.target.value))}
                    className="input-field w-24"
                    min={2}
                    max={8}
                  />
                </div>
                <button
                  onClick={handleGenerateBatches}
                  disabled={generating}
                  className="btn-primary"
                  id="generate-batches-btn"
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Generate Batches
                </button>
              </div>
              <p className="text-xs text-surface-400 mt-3">
                Clusters pending orders within {radiusKm}km radius, max {maxBatchSize} orders per batch. Uses Haversine distance + nearest-neighbour routing.
              </p>
            </div>

            {/* Generated Batches */}
            {batches.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-surface-900">
                    Generated Batches ({batches.length})
                  </h3>
                  <button onClick={handleGenerateBatches} className="btn-secondary text-xs">
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {batches.map((batch) => (
                    <div
                      key={batch.batchId}
                      className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-card hover:shadow-card-hover transition-all animate-slide-up"
                    >
                      {/* Batch header */}
                      <div className="px-5 py-4 bg-gradient-to-r from-primary-50 to-primary-100/50 border-b border-primary-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Route className="w-4 h-4 text-primary-600" />
                            <span className="text-sm font-bold text-primary-800">
                              {batch.batchId.split('-').slice(-1)[0]}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-surface-600">
                              <Package className="w-3 h-3 inline mr-1" />
                              {batch.totalStops} stops
                            </span>
                            <span className="text-surface-600">
                              <Navigation className="w-3 h-3 inline mr-1" />
                              {batch.estimatedDistance} km
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Orders list */}
                      <div className="p-4 space-y-2.5">
                        {batch.orders.map((order, idx) => (
                          <div key={order.orderId} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                              </div>
                              {idx < batch.orders.length - 1 && (
                                <div className="w-0.5 h-6 bg-surface-200 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-primary-600">
                                  {order.orderNumber}
                                </span>
                                {order.priority === 'urgent' && (
                                  <StatusBadge status="urgent" />
                                )}
                              </div>
                              <p className="text-xs text-surface-600 truncate mt-0.5">
                                <MapPin className="w-3 h-3 inline mr-1 text-red-400" />
                                {order.drop?.address || 'Drop location'}
                              </p>
                              <p className="text-xs text-surface-500">
                                {order.business?.name || 'Business'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Assign button */}
                      <div className="px-4 pb-4">
                        <button
                          onClick={() => handleAssignBatch(batch)}
                          disabled={assigningBatch === batch.batchId}
                          className="btn-success w-full"
                          id={`assign-batch-${batch.batchId}`}
                        >
                          {assigningBatch === batch.batchId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <User className="w-4 h-4" />
                              Assign Nearest Rider
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {batches.length === 0 && !generating && (
              <div className="text-center py-16 bg-white rounded-2xl border border-surface-100">
                <Route className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500 text-sm">Click "Generate Batches" to cluster pending orders</p>
                <p className="text-surface-400 text-xs mt-1">Orders are grouped by proximity for optimal delivery routes</p>
              </div>
            )}
          </>
        )}

        {tab === 'active' && (
          <div className="space-y-4">
            {activeBatches.length > 0 ? (
              activeBatches.map((batch) => (
                <div
                  key={batch.batchId}
                  className="bg-white rounded-2xl border border-surface-200 p-5 shadow-card"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                        <Route className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-surface-900">{batch.batchId}</p>
                        <p className="text-xs text-surface-500">
                          {batch.rider?.name || 'Rider'} • {batch.orders.length} orders
                        </p>
                      </div>
                    </div>
                    <StatusBadge status="busy" />
                  </div>

                  <div className="space-y-2">
                    {batch.orders.map((order, idx) => (
                      <div
                        key={order._id}
                        className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-surface-800">{order.orderNumber}</p>
                          <p className="text-xs text-surface-500 truncate">{order.drop?.address}</p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-surface-100">
                <CheckCircle2 className="w-12 h-12 text-surface-300 mx-auto mb-3" />
                <p className="text-surface-500 text-sm">No active batches right now</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
