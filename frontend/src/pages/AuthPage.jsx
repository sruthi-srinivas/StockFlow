import React, { useState } from 'react';
import { apiRequest, setAuthToken, setUser, setOrg } from '../api';
import { Package, ArrowRight, ShieldCheck, Mail, Lock, Building } from 'lucide-react';

export default function AuthPage({ initialMode = 'login', onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    organization_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      let payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            organization_name: formData.organization_name,
            email: formData.email,
            password: formData.password
          };

      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setAuthToken(res.access_token);
      setUser(res.user);
      setOrg(res.organization);
      onAuthSuccess(res.user, res.organization);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-3 text-white">
            <Package size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">StockFlow</h1>
          <p className="text-sm text-slate-500 mt-1">Simple & reliable SaaS inventory management</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8">
          <div className="flex border-b border-slate-100 pb-4 mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 text-center font-medium pb-2 text-sm transition-colors border-b-2 -mb-[18px] ${
                isLogin
                  ? 'border-emerald-600 text-emerald-600 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 text-center font-medium pb-2 text-sm transition-colors border-b-2 -mb-[18px] ${
                !isLogin
                  ? 'border-emerald-600 text-emerald-600 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Organization Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.organization_name}
                    onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                    placeholder="e.g. Acme Logistics"
                    className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-60 shadow-sm"
            >
              <span>{loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Organization Account'}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center text-xs text-slate-500 space-x-1">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Multi-tenant data isolation enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
