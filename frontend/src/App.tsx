import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import InvoiceUpload from './pages/InvoiceUpload';
import InvoiceList from './pages/InvoiceList';
import Vendors from './pages/Vendors';
import VendorDashboard from './pages/VendorDashboard';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Create the TanStack Query client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,      // 1 minute before data is considered stale
      retry: 1,              // Retry failed requests once
      refetchOnWindowFocus: false,       // Disable refetch on tab switch
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public login portal */}
          <Route path="/login" element={<Login />} />

          {/* Authenticated Application Shell */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="invoice-upload" element={<InvoiceUpload />} />
              <Route path="invoices" element={<InvoiceList />} />
              <Route path="vendor-dashboard" element={<VendorDashboard />} />

              {/* Admin-only restricted views */}
              <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                <Route path="vendors" element={<Vendors />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>

      {/* Global toast notification provider */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            background: 'rgba(30, 41, 59, 0.50)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            fontSize: '14px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }}
      />
    </QueryClientProvider>
  );
}
