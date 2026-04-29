import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Package, Navigation, CreditCard, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function JobsBoard() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [pullDist, setPullDist] = useState(0);
  const navigate = useNavigate();
  const { isOnline } = useAuth();

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await API.get('/orders/batches/available');
      if (res.data.success) {
        setBatches(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      alert('Failed to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOnline) {
      fetchBatches();
    }
  }, [isOnline]);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (touchStartY === 0) return;
    const currentY = e.touches[0].clientY;
    const dist = currentY - touchStartY;
    if (dist > 0 && window.scrollY === 0) {
      setPullDist(Math.min(dist, 80));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDist > 60) {
      setRefreshing(true);
      await fetchBatches();
    }
    setTouchStartY(0);
    setPullDist(0);
  };

  const handleAcceptBatch = async (batchId) => {
    try {
      const res = await API.patch('/riders/accept-batch', { batchId });
      if (res.data.success) {
        alert('Batch accepted successfully!');
        navigate('/rider/active');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept batch');
    }
  };

  if (!isOnline) {
    return (
      <div className="flex flex-col justify-center items-center h-full text-gray-500 py-20">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium text-lg">You are currently offline.</p>
        <p className="text-sm">Go to your Profile to toggle availability.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full text-gray-500">Loading open jobs...</div>;
  }

  return (
    <div 
      className="space-y-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="flex justify-center transition-all duration-300 overflow-hidden"
        style={{ height: pullDist > 0 || refreshing ? `${pullDist || 40}px` : '0px' }}
      >
        <span className="text-gray-400 mt-2">
          {refreshing ? 'Refreshing...' : 'Pull down to refresh...'}
        </span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Available Jobs</h2>
        <button onClick={fetchBatches} className="text-blue-500 text-sm font-semibold p-2">Refresh</button>
      </div>

      {batches.length === 0 ? (
        <div className="text-center py-10 bg-white shadow rounded-lg border border-gray-100">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No available jobs nearby.</p>
        </div>
      ) : (
        batches.map((batch) => (
          <div key={batch.batchId} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Batch #{batch.batchId?.substring(0, 8)}</p>
                <h3 className="text-lg font-bold text-gray-900">{batch.primaryArea}</h3>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-green-600">₹{batch.totalEarnings}</p>
                <p className="text-xs text-gray-500">Est. Earning</p>
              </div>
            </div>

            <div className="flex bg-gray-50 p-3 rounded-lg divide-x divide-gray-200">
              <div className="flex-1 px-2 text-center">
                <Navigation className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-sm font-semibold text-gray-800">{batch.totalDistance} km</p>
              </div>
              <div className="flex-1 px-2 text-center">
                <Package className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-sm font-semibold text-gray-800">{batch.orderCount} stops</p>
              </div>
              <div className="flex-1 px-2 text-center flex items-center justify-center">
                 <p className="text-xs text-gray-500">{batch.stopsCount}</p>
              </div>
            </div>

            <button
              onClick={() => handleAcceptBatch(batch.batchId)}
              className="w-full bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
            >
              Accept Batch <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
