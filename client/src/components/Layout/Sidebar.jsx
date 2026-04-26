import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Bike,
  Route,
  Receipt,
  ChevronLeft,
  Zap,
} from 'lucide-react';

const navItems = [
  { path: '/internal/control-tower', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: Package },
  { path: '/riders', label: 'Riders', icon: Bike },
  { path: '/batching', label: 'Batching', icon: Route },
  { path: '/billing', label: 'Billing', icon: Receipt },
];

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50
          bg-surface-900 text-white
          transition-all duration-300 ease-in-out
          shadow-sidebar
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}
        `}
      >
        {/* Logo section */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
              <img src="/logo.png" alt="Apna Saathi" className="w-full h-full object-cover" />
            </div>
            <span
              className={`font-bold text-lg whitespace-nowrap transition-opacity duration-200 ${
                isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'
              }`}
            >
              Apna Saathi
            </span>
          </div>
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors lg:block ${
              isOpen ? '' : 'hidden'
            }`}
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-300 ${
                !isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`
                  sidebar-link group relative
                  ${isActive ? 'active' : ''}
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
                )}
                <item.icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-primary-400' : 'group-hover:text-primary-400'
                  }`}
                />
                <span
                  className={`whitespace-nowrap transition-opacity duration-200 ${
                    isOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'
                  }`}
                >
                  {item.label}
                </span>

                {/* Tooltip for collapsed sidebar */}
                {!isOpen && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-surface-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg hidden lg:block">
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
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary-600/20 to-primary-800/20 border border-primary-500/20">
            <p className="text-xs text-primary-300 font-medium">Apna Saathi</p>
            <p className="text-[10px] text-surface-400 mt-1">v1.0.0 • MVP</p>
          </div>
        </div>
      </aside>
    </>
  );
}
