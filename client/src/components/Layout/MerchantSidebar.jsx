import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PackagePlus,
  Package,
  Receipt,
  ChevronLeft,
  BriefcaseBusiness,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/merchant', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/merchant/new-order', label: 'New Delivery', icon: PackagePlus, end: false },
  { path: '/merchant/orders', label: 'Orders', icon: Package, end: false },
  { path: '/merchant/billing', label: 'Billing', icon: Receipt, end: false },
];

export default function MerchantSidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const { user } = useAuth(); // Can use this to show business name

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar - using a darker/different theme for merchant */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          bg-surface-950 text-white border-r border-indigo-500/10
          transition-all duration-300 ease-in-out
          shadow-sidebar
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}
        `}
      >
        {/* Logo section */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20 overflow-hidden">
              <img src="/logo.png" alt="Apna Saathi" className="w-full h-full object-cover" />
            </div>
            <span
              className={`font-bold text-lg whitespace-nowrap transition-opacity duration-200 ${
                isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'
              }`}
            >
              Merchant
            </span>
          </div>
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors lg:block ${
              isOpen ? '' : 'hidden'
            }`}
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-300 text-surface-400 ${
                !isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.end 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`
                  sidebar-link group relative flex items-center px-3 py-2.5 rounded-xl
                  hover:bg-indigo-500/10 transition-colors
                  ${isActive ? 'bg-indigo-500/20 text-indigo-400' : 'text-indigo-100/70'}
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full" />
                )}
                <item.icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-indigo-400' : 'group-hover:text-indigo-300 text-indigo-100/70'
                  }`}
                />
                <span
                  className={`ml-3 whitespace-nowrap font-medium transition-all duration-200 ${
                    isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 lg:opacity-0'
                  }`}
                >
                  {item.label}
                </span>

                {/* Tooltip for collapsed sidebar */}
                {!isOpen && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-surface-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg hidden lg:block z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div
          className={`absolute bottom-6 left-0 right-0 px-4 transition-opacity duration-200 ${
            isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'
          }`}
        >
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/10">
            <p className="text-xs text-indigo-400 font-medium truncate">{user?.name || 'Business Owner'}</p>
            <p className="text-[10px] text-indigo-100/50 mt-1">Merchant Portal</p>
          </div>
        </div>
      </aside>
    </>
  );
}
