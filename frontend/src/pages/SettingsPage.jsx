import React, { useState } from 'react';
import { Sliders, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest, setOrg } from '../api';

export default function SettingsPage({ org, onOrgUpdated }) {
  const [threshold, setThreshold] = useState(org?.default_low_stock_threshold ?? 5);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const parsed = parseInt(threshold, 10);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error('Threshold must be a non-negative number');
      }

      const updated = await apiRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ default_low_stock_threshold: parsed })
      });

      setOrg(updated);
      onOrgUpdated(updated);
      setMessage('Default low-stock threshold updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage inventory preferences and alert defaults</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6">
        <div className="flex items-center space-x-3 pb-5 border-b border-slate-100">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Inventory Alert Rules</h2>
            <p className="text-xs text-slate-500">Configure default fallback thresholds</p>
          </div>
        </div>

        {message && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Default Low-Stock Threshold
            </label>
            <div className="max-w-xs">
              <input
                type="number"
                min="0"
                required
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              When a product does not specify its own custom low-stock threshold, StockFlow flags it as low stock when the available quantity drops to or below this value. (Default: 5 units).
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-60"
            >
              <Save size={16} className="mr-1.5" />
              <span>{loading ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
