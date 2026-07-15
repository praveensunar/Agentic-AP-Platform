import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Shield, ArrowRight, Zap, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      const { token, user } = response.data.data;
      login(token, user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo assistant helper to speed up client testing
  const selectDemoAccount = (role: 'Admin' | 'User') => {
    if (role === 'Admin') {
      setEmail('admin@ap.com');
      setPassword('admin');
    } else {
      setEmail('user@ap.com');
      setPassword('user');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col justify-center items-center p-4 relative overflow-hidden bg-grid">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main glass card container */}
      <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
        
        {/* Brand header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-glow-sm">
            <Zap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Agentic AP Platform</h1>
            <p className="text-muted text-xs mt-1.5">Sign in to manage your automated accounts payable pipeline</p>
          </div>
        </div>

        {/* Login form Card */}
        <div className="glass-card p-8 border border-border shadow-card backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Field */}
            <div>
              <label className="text-xs text-muted font-medium mb-1.5 block">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs text-muted font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  className="input-field pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper Section */}
          <div className="mt-8 pt-6 border-t border-border/40">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={13} className="text-accent" />
              <span className="text-[10px] uppercase font-bold text-accent tracking-widest">Demo Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => selectDemoAccount('Admin')}
                className="p-2.5 rounded-xl border border-border/50 bg-white/[0.01] hover:bg-white/[0.04] transition-all text-left group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-white group-hover:text-accent transition-colors">Admin Portal</span>
                  <CheckCircle size={10} className="text-muted/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-muted mt-0.5">admin@ap.com / admin</p>
              </button>
              <button
                type="button"
                onClick={() => selectDemoAccount('User')}
                className="p-2.5 rounded-xl border border-border/50 bg-white/[0.01] hover:bg-white/[0.04] transition-all text-left group"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-white group-hover:text-accent transition-colors">User Portal</span>
                  <CheckCircle size={10} className="text-muted/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-muted mt-0.5">user@ap.com / user</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer notes */}
        <p className="text-center text-[10px] text-muted">
          Agentic AP Platform version 1.0.0 · Secure session token authentication active.
        </p>
      </div>
    </div>
  );
}
