import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { login as loginAPI } from '../api/auth';
import { Zap, Mail, Lock, Loader2, ArrowRight, Sun, Moon, Eye, EyeOff } from 'lucide-react';

export default function Login({ requiredRole }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loginUser, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // When accessing a role-specific login, clear any existing session
  useEffect(() => {
    if (requiredRole && isAuthenticated) {
      logout();
    }
  }, [requiredRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginAPI(email, password);
      
      // Role enforcement check
      if (requiredRole && res.data.user.role !== requiredRole) {
        setError(`Unauthorized. This login portal is only for ${requiredRole}s.`);
        setLoading(false);
        return;
      }

      loginUser(res.data.token, res.data.user);
      
      // Smart navigation based on role
      if (res.data.user.role === 'business') navigate('/merchant');
      else if (res.data.user.role === 'rider') navigate('/rider/jobs');
      else navigate('/internal/control-tower');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 z-50 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all border border-white/10"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-surface-400 lg:text-surface-300" />
        )}
      </button>
      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-surface-900 via-primary-950 to-surface-900 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-400/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-primary-500/30">
              <img src="/logo.png" alt="Apna Saathi" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-bold text-white">Apna Saathi</span>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Apna Saathi
            <br />
            <span className="text-primary-400">Delivery Platform</span>
          </h2>

          <p className="text-surface-400 text-lg leading-relaxed max-w-md">
            One platform to manage all your deliveries. Route batching, live tracking,
            and automated billing — all in one place.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Cost Reduction', value: '40%' },
              { label: 'Faster Delivery', value: '2x' },
              { label: 'Orders Batched', value: '4-6' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary-400">{stat.value}</p>
                <p className="text-sm text-surface-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-surface-50 dark:bg-surface-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg">
              <img src="/logo.png" alt="Apna Saathi" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold text-surface-900">Apna Saathi</span>
          </div>

          <h1 className="text-2xl font-bold text-surface-900 mb-2">
            {requiredRole ? `${requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} Login` : 'Welcome back'}
          </h1>
          <p className="text-surface-500 mb-8">
            {requiredRole ? `Access your ${requiredRole} dashboard` : 'Sign in to your dashboard'}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-slide-up">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-text" htmlFor="login-email">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@deliveryplatform.com"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-text" htmlFor="login-password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
              id="login-submit"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-surface-500 text-sm">
              Don't have an account?{' '}
              <a href={requiredRole ? `/signup/${requiredRole === 'business' ? 'merchant' : requiredRole}` : '/signup'} className="text-primary-600 hover:text-primary-500 font-semibold transition-colors">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
