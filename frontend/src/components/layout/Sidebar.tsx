import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Upload, Users, BarChart3,
  Settings, ChevronLeft, ChevronRight, Zap, LogOut,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { to: '/',               icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoice-upload', icon: Upload,           label: 'Upload Invoice' },
  { to: '/invoices',       icon: FileText,         label: 'Invoice List' },
  { to: '/vendors',        icon: Users,            label: 'Vendor Management' },
  { to: '/vendor-dashboard', icon: BarChart3,      label: 'Vendor Dashboard' },
  { to: '/settings',       icon: Settings,         label: 'Settings' },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (['/vendors', '/settings'].includes(item.to)) {
      return user?.role === 'Admin';
    }
    return true;
  });

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-surface border-r border-border transition-all duration-300 ease-in-out shrink-0',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-border h-16', !sidebarOpen && 'justify-center')}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shrink-0 shadow-glow-sm">
          <Zap size={16} className="text-white" />
        </div>
        {sidebarOpen && (
          <div className="animate-fade-in overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight">Agentic AP</p>
            <p className="text-muted text-xs leading-tight">Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-hidden">
        {sidebarOpen && (
          <p className="text-muted text-[10px] uppercase tracking-widest font-semibold px-3 pt-2 pb-1 animate-fade-in">
            Main Menu
          </p>
        )}
        {visibleNavItems.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              title={!sidebarOpen ? label : undefined}
              className={cn(
                'nav-link group',
                isActive && 'active',
                !sidebarOpen && 'justify-center px-2'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && (
                <span className="animate-fade-in text-sm">{label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-card border border-border text-muted hover:text-white hover:border-accent transition-all duration-200 flex items-center justify-center shadow-card"
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Footer */}
      <div className={cn('p-4 border-t border-border flex flex-col gap-3', !sidebarOpen && 'items-center justify-center')}>
        <div className={cn('flex items-center gap-3 w-full', !sidebarOpen && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in overflow-hidden flex-1">
              <p className="text-white text-xs font-semibold leading-tight truncate">{user?.name || 'AP User'}</p>
              <p className="text-muted text-[10px] leading-tight truncate">{user?.email || 'user@company.com'}</p>
            </div>
          )}
        </div>
        
        {sidebarOpen ? (
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl transition-all"
          >
            <LogOut size={13} />
            Logout
          </button>
        ) : (
          <button
            onClick={() => logout()}
            className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  );
}
