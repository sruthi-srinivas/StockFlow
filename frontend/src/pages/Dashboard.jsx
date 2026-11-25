import React from 'react';
import { Package, AlertTriangle, Layers, ArrowUpRight, Plus } from 'lucide-react';

export default function Dashboard({ stats, onNavigate, onAddProduct }) {
  const {
    total_products = 0,
    total_stock_quantity = 0,
    low_stock_count = 0,
    low_stock_products = []
  } = stats || {};

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of your inventory status and alerts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onAddProduct}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} className="mr-1.5" />
            Add Product
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Products</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{total_products}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Catalog items registered</span>
            <button
              onClick={() => onNavigate('products')}
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
            >
              View catalog <ArrowUpRight size={14} className="ml-0.5" />
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Stock Quantity</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{total_stock_quantity}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Cumulative units across all products</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Low Stock Alerts</p>
              <h3 className={`text-3xl font-bold mt-2 ${low_stock_count > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {low_stock_count}
              </h3>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
              low_stock_count > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Quantity &le; Low-stock threshold</span>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Low Stock Products</h2>
            <p className="text-xs text-slate-500 mt-0.5">Items that need replenishment soon</p>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {low_stock_count} items critical
          </span>
        </div>

        {low_stock_products.length === 0 ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-3">
              <Package size={24} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">All Stock Levels Healthy</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No products are currently at or below their low-stock threshold.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3 text-right">In Stock</th>
                  <th className="px-5 py-3 text-right">Threshold</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {low_stock_products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {p.name}
                      {p.description && (
                        <p className="text-xs text-slate-400 font-normal truncate max-w-xs">{p.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{p.sku}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-amber-600">
                      {p.quantity}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-500">
                      {p.effective_threshold}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        Low Stock
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => onNavigate('products', { editProductId: p.id })}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Update Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
