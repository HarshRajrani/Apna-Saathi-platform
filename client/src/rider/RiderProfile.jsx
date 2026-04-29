import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RiderProfile() {
  const { user, logout, isOnline, toggleOnlineStatus } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Profile</h2>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
           <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
           <span className="font-semibold text-gray-700">{isOnline ? 'Online' : 'Offline'}</span>
           <button 
             onClick={toggleOnlineStatus}
             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isOnline ? 'bg-blue-600' : 'bg-gray-300'}`}
           >
             <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
           </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <UserIcon className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{user?.name || 'Rider'}</h3>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        <div className="p-4 flex items-center gap-3">
          <Phone className="w-5 h-5 text-gray-400" />
          <span className="text-gray-700 font-medium">{user?.phone || 'No phone added'}</span>
        </div>
        <div className="p-4 flex items-center gap-3">
          <MapPin className="w-5 h-5 text-gray-400" />
          <span className="text-gray-700 font-medium">Bangalore Zone</span>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2 mt-8"
      >
        <LogOut className="w-5 h-5" /> Logout
      </button>
    </div>
  );
}
