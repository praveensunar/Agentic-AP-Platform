import { useState, useEffect, useRef } from 'react';
import { Bell, Menu, Search, Sun, Moon, X, FileText, Users as UsersIcon } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { invoiceService } from '../../services/invoiceService';
import { vendorService } from '../../services/vendorService';
import { formatCurrency, STATUS_CONFIG } from '../../utils';
import type { Invoice, Vendor } from '../../types';
import { cn } from '../../lib/utils';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/':                  { title: 'Dashboard',         subtitle: 'Overview of your AP operations' },
  '/invoice-upload':    { title: 'Upload Invoice',    subtitle: 'Drag & drop or browse to upload' },
  '/invoices':          { title: 'Invoice List',      subtitle: 'Manage and track all invoices' },
  '/vendors':           { title: 'Vendor Management', subtitle: 'Manage vendor records' },
  '/vendor-dashboard':  { title: 'Vendor Dashboard',  subtitle: 'Vendor analytics & insights' },
  '/settings':          { title: 'Settings',          subtitle: 'App preferences' },
};

export default function Navbar() {
  const { sidebarOpen, toggleSidebar, toggleNotificationDrawer } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const location = useLocation();
  const navigate = useNavigate();

  const page = PAGE_TITLES[location.pathname] ?? { title: 'Agentic AP', subtitle: '' };

  // ── Theme State ─────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  // ── Global Search State ──────────────────────────────────────────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceResults, setInvoiceResults] = useState<Invoice[]>([]);
  const [vendorResults, setVendorResults] = useState<Vendor[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Trigger search API calls
  useEffect(() => {
    if (!searchQuery.trim()) {
      setInvoiceResults([]);
      setVendorResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const [invRes, vendRes] = await Promise.all([
          invoiceService.getAll({ search: searchQuery, limit: 5 }),
          vendorService.getAll({ search: searchQuery, limit: 5 })
        ]);
        setInvoiceResults(invRes.data.data || []);
        setVendorResults(vendRes.data.data || []);
      } catch (err) {
        console.error('Error fetching global search results:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Command+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when modal opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      setSearchQuery('');
    }
  }, [searchOpen]);

  const handleResultClick = (route: string) => {
    setSearchOpen(false);
    navigate(route);
  };

  return (
    <>
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-surface border-b border-border shrink-0">
        {/* Left */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="text-muted hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors md:hidden shrink-0"
            >
              <Menu size={18} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-white font-semibold text-sm sm:text-base leading-tight truncate">{page.title}</h1>
            {page.subtitle && (
              <p className="text-muted text-[10px] sm:text-xs leading-tight hidden sm:block truncate mt-0.5">{page.subtitle}</p>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Global Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 text-muted text-sm hover:border-accent/40 transition-colors group cursor-pointer"
          >
            <Search size={14} />
            <span className="text-xs">Quick search...</span>
            <kbd className="ml-2 text-[10px] bg-border px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all duration-200"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Notification Bell */}
          <button
            id="notification-bell"
            onClick={toggleNotificationDrawer}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-pulse-slow">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:shadow-glow-sm transition-shadow">
            AP
          </div>
        </div>
      </header>

      {/* Global Search Modal Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-[10vh] animate-fade-in" onClick={() => setSearchOpen(false)}>
          <div className="glass-card w-full max-w-xl overflow-hidden shadow-card animate-slide-in" onClick={(e) => e.stopPropagation()}>
            {/* Search Input Box */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <Search size={18} className="text-muted" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoices by code, vendors by name..."
                className="bg-transparent border-0 outline-none text-white placeholder-muted w-full text-sm"
              />
              <button onClick={() => setSearchOpen(false)} className="text-muted hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* Results Panel */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
              {!searchQuery ? (
                <div className="text-xs text-muted space-y-2">
                  <p className="font-semibold uppercase tracking-wider">Quick Page Shortcuts</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['Dashboard', '/'],
                      ['Upload Invoice', '/invoice-upload'],
                      ['Invoices List', '/invoices'],
                      ['Vendors CRUD', '/vendors'],
                      ['Vendor Analytics', '/vendor-dashboard'],
                      ['Settings & Alerts', '/settings'],
                    ].map(([label, path]) => (
                      <button
                        key={path}
                        onClick={() => handleResultClick(path)}
                        className="text-left px-3 py-2 bg-white/5 hover:bg-accent/20 hover:text-white rounded-lg transition-colors border border-border/30 text-sm"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : searching ? (
                <p className="text-muted text-sm text-center py-4">Searching...</p>
              ) : invoiceResults.length === 0 && vendorResults.length === 0 ? (
                <p className="text-muted text-sm text-center py-4">No matching records found.</p>
              ) : (
                <>
                  {/* Invoices List */}
                  {invoiceResults.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Invoices</p>
                      {invoiceResults.map((invoice) => {
                        const statusStyle = STATUS_CONFIG[invoice.status];
                        return (
                          <div
                            key={invoice._id}
                            onClick={() => handleResultClick('/invoices')}
                            className="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-xl cursor-pointer border border-transparent hover:border-border/50 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <FileText size={16} className="text-accent" />
                              <div>
                                <p className="text-sm font-semibold text-white font-mono">{invoice.invoiceNumber}</p>
                                <p className="text-xs text-muted">Amount: {formatCurrency(invoice.amount, invoice.currency)}</p>
                              </div>
                            </div>
                            <span className={cn('badge text-[10px]', statusStyle.bg, statusStyle.color)}>
                              {invoice.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Vendors List */}
                  {vendorResults.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">Vendors</p>
                      {vendorResults.map((vendor) => (
                        <div
                          key={vendor._id}
                          onClick={() => handleResultClick('/vendors')}
                          className="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-xl cursor-pointer border border-transparent hover:border-border/50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <UsersIcon size={16} className="text-emerald-400" />
                            <div>
                              <p className="text-sm font-semibold text-white">{vendor.vendorName}</p>
                              <p className="text-xs text-muted">Code: {vendor.vendorCode} · {vendor.country}</p>
                            </div>
                          </div>
                          <span className={cn('badge text-[10px]', vendor.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                            {vendor.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Footer hint */}
            <div className="px-4 py-2 bg-white/[0.02] border-t border-border flex justify-between text-[10px] text-muted">
              <span>Press <kbd className="bg-border px-1 py-0.2 rounded font-mono">ESC</kbd> to close</span>
              <span>Global Search Tool</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
