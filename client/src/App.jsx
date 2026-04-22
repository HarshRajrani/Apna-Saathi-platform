import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Riders from './pages/Riders';
import Batching from './pages/Batching';
import Billing from './pages/Billing';

// Merchant Pages
import MerchantDashboard from './merchant/MerchantDashboard';
import MerchantOrders from './merchant/MerchantOrders';
import MerchantNewOrder from './merchant/MerchantNewOrder';
import MerchantBilling from './merchant/MerchantBilling';
import MerchantPricing from './merchant/MerchantPricing';

// Rider Pages
import RiderLayout from './rider/RiderLayout';
import JobsBoard from './rider/JobsBoard';
import ActiveRoute from './rider/ActiveRoute';
import RiderProfile from './rider/RiderProfile';
import RiderEarnings from './rider/RiderEarnings';

// Public Pages (no auth required)
import PublicTracker from './pages/public/PublicTracker';

export default function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/signup/merchant" element={<Signup requiredRole="business" />} />
      <Route path="/signup/rider" element={<Signup requiredRole="rider" />} />

      {/* Role-Specific Login Routes — always show login form */}
      <Route
        path="/login/merchant"
        element={<Login requiredRole="business" />}
      />
      <Route
        path="/login/rider"
        element={<Login requiredRole="rider" />}
      />

      {/* Public route (Default/Admin) */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'business' ? '/merchant' : user?.role === 'rider' ? '/rider/jobs' : '/internal/control-tower'} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Admin Protected routes (Hidden Route) */}
      <Route
        path="/internal/control-tower"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/riders"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Riders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/batching"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Batching />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Billing />
          </ProtectedRoute>
        }
      />

      {/* Merchant Protected routes */}
      <Route
        path="/merchant"
        element={
          <ProtectedRoute allowedRoles={['business']}>
            <MerchantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/orders"
        element={
          <ProtectedRoute allowedRoles={['business']}>
            <MerchantOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/new-order"
        element={
          <ProtectedRoute allowedRoles={['business']}>
            <MerchantNewOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/billing"
        element={
          <ProtectedRoute allowedRoles={['business']}>
            <MerchantBilling />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/pricing"
        element={
          <ProtectedRoute allowedRoles={['business']}>
            <MerchantPricing />
          </ProtectedRoute>
        }
      />

      {/* Rider Protected routes */}
      <Route
        path="/rider"
        element={
          <ProtectedRoute allowedRoles={['rider']}>
            <RiderLayout />
          </ProtectedRoute>
        }
      >
        <Route path="jobs" element={<JobsBoard />} />
        <Route path="active" element={<ActiveRoute />} />
        <Route path="profile" element={<RiderProfile />} />
        <Route path="earnings" element={<RiderEarnings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />

      {/* ──────────────────────────────────────────────────────── */}
      {/* PUBLIC ROUTE — No auth wrapper, accessible by anyone    */}
      {/* ──────────────────────────────────────────────────────── */}
      <Route path="/track/:trackingId" element={<PublicTracker />} />
    </Routes>
  );
}
