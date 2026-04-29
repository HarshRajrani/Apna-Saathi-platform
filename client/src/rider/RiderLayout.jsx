import { Outlet, NavLink } from 'react-router-dom';
import { MapPin, Briefcase, User, Wallet } from 'lucide-react';
import { useRiderLocation } from '../hooks/useRiderLocation';

export default function RiderLayout() {
  // Start geolocation emit across all rider routes
  useRiderLocation();

  const navItems = [
    { to: '/rider/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/rider/active', icon: MapPin, label: 'My Batch' },
    { to: '/rider/earnings', icon: Wallet, label: 'Earnings' },
    { to: '/rider/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-16 lg:pb-0">
      {/* Mobile Top Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
        <h1 className="text-xl font-bold">Rider Portal</h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-xl flex justify-around p-2 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
