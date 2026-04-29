import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signup as signupAPI } from '../api/auth';
import { Mail, Lock, User, Phone, Briefcase, Truck, ArrowRight, Loader2, Navigation, Package } from 'lucide-react';

export default function Signup({ requiredRole }) {
  const [role, setRole] = useState(requiredRole || 'business');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    businessName: '',
    businessType: 'restaurant',
    vehicleType: 'bike',
    vehicleNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signupAPI({ ...formData, role });
      loginUser(res.data.token, res.data.user);
      
      if (role === 'business') navigate('/merchant');
      else if (role === 'rider') navigate('/rider/jobs');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal flex relative overflow-hidden font-sans">
      {/* Background aesthetics */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-saffron-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-saffron-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-6xl mx-auto flex z-10">
        
        {/* Left Side — Branding & Aesthetics */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 px-16 relative">
          <div className="mb-12">
            <a href="/" className="inline-flex items-center gap-3">
              <img src="/logo.png" alt="Apna Saathi" className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-xl shadow-saffron-500/20" />
              <span className="text-3xl font-display font-black text-white tracking-tight">Apna Saathi</span>
            </a>
          </div>

          <h2 className="text-5xl font-display font-black text-white leading-[1.1] mb-6">
            Join the Smart<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron-400 to-saffron-600">Delivery Network.</span>
          </h2>
          
          <p className="text-lg text-surface-400 leading-relaxed max-w-md mb-12">
            Whether you are scaling your business deliveries or earning on the road, our Haversine engine powers your growth.
          </p>

          <div className="space-y-6">
            {(!requiredRole || requiredRole === 'business') && (
              <div className={`p-5 rounded-2xl border transition-all ${role === 'business' ? 'bg-saffron-500/10 border-saffron-500/30' : 'bg-navy/50 border-white/5'} ${!requiredRole ? 'cursor-pointer' : ''}`} onClick={() => !requiredRole && setRole('business')}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === 'business' ? 'bg-saffron-500 text-charcoal' : 'bg-surface-800 text-surface-400'}`}>
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${role === 'business' ? 'text-white' : 'text-surface-300'}`}>I am a Merchant</h3>
                    <p className="text-sm text-surface-500 mt-1">Manage orders, cut costs by 40% with batching.</p>
                  </div>
                </div>
              </div>
            )}

            {(!requiredRole || requiredRole === 'rider') && (
              <div className={`p-5 rounded-2xl border transition-all ${role === 'rider' ? 'bg-saffron-500/10 border-saffron-500/30' : 'bg-navy/50 border-white/5'} ${!requiredRole ? 'cursor-pointer' : ''}`} onClick={() => !requiredRole && setRole('rider')}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === 'rider' ? 'bg-saffron-500 text-charcoal' : 'bg-surface-800 text-surface-400'}`}>
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${role === 'rider' ? 'text-white' : 'text-surface-300'}`}>I am a Rider</h3>
                    <p className="text-sm text-surface-500 mt-1">Get optimized routes and earn more per kilometer.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side — Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md bg-navy/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
            <div className="lg:hidden mb-8 flex flex-col items-center">
               <img src="/logo.png" alt="Apna Saathi" className="w-16 h-16 rounded-2xl object-cover mb-4" />
               <h2 className="text-2xl font-display font-black text-white">Create Account</h2>
            </div>
            
            <div className="hidden lg:block mb-8">
               <h2 className="text-3xl font-display font-bold text-white mb-2">Create Account</h2>
               <p className="text-surface-400 text-sm">Join as a {role === 'business' ? 'Merchant' : 'Rider'} to get started.</p>
            </div>

            {/* Mobile Role Toggle */}
            {!requiredRole && (
              <div className="flex lg:hidden bg-surface-900 rounded-xl p-1 mb-8 border border-white/5">
                <button onClick={() => setRole('business')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'business' ? 'bg-charcoal text-saffron-400 shadow-sm border border-white/5' : 'text-surface-500'}`}>Merchant</button>
                <button onClick={() => setRole('rider')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === 'rider' ? 'bg-charcoal text-saffron-400 shadow-sm border border-white/5' : 'text-surface-500'}`}>Rider</button>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-surface-900 border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-saffron-500/50 focus:ring-1 focus:ring-saffron-500/50 transition-all text-sm placeholder:text-surface-600" placeholder="John Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="w-full bg-surface-900 border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-saffron-500/50 focus:ring-1 focus:ring-saffron-500/50 transition-all text-sm placeholder:text-surface-600" placeholder="9876543210" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-surface-900 border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-saffron-500/50 focus:ring-1 focus:ring-saffron-500/50 transition-all text-sm placeholder:text-surface-600" placeholder="john@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} className="w-full bg-surface-900 border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-saffron-500/50 focus:ring-1 focus:ring-saffron-500/50 transition-all text-sm placeholder:text-surface-600" placeholder="••••••••" />
                </div>
              </div>

              {role === 'business' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Business Name</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                      <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} required className="w-full bg-surface-900 border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-saffron-500/50 focus:ring-1 focus:ring-saffron-500/50 transition-all text-sm placeholder:text-surface-600" placeholder="Joe's Cafe" />
                    </div>
                  </div>
                </div>
              )}

              {role === 'rider' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Vehicle Type</label>
                    <div className="relative">
                      <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                      <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="w-full bg-surface-900 border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-saffron-500/50 focus:ring-1 focus:ring-saffron-500/50 transition-all text-sm appearance-none">
                        <option value="bike">Bike</option>
                        <option value="bicycle">Bicycle</option>
                        <option value="scooter">Scooter</option>
                        <option value="car">Car</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Vehicle No.</label>
                    <input type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleChange} className="w-full bg-surface-900 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-saffron-500/50 focus:ring-1 focus:ring-saffron-500/50 transition-all text-sm placeholder:text-surface-600" placeholder="MH 01 AB 1234" />
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-saffron-500 hover:bg-saffron-400 text-charcoal font-bold py-3.5 rounded-xl transition-all mt-6 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-surface-400 text-sm">
                Already have an account?{' '}
                <a href={requiredRole ? `/login/${requiredRole === 'business' ? 'merchant' : 'rider'}` : '/login'} className="text-saffron-400 hover:text-saffron-300 font-semibold transition-colors">
                  Sign in
                </a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
