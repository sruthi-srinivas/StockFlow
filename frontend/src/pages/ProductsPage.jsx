import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../api';

export default function ProductsPage({
  products = [],
  searchTerm = '',
  onSearchChange,
  onOpenAddModal,
  onOpenEditModal,
  onProductDeleted
}) {
  const [deleteModalProduct, setDeleteModalProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const confirmDelete = async () => {
    if (!deleteModalProduct) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await apiRequest(`/api/products/${deleteModalProduct.id}`, {
        method: 'DELETE'
      });
      onProductDeleted(deleteModalProduct.id);
      setDeleteModalProduct(null);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage stock levels, pricing, and catalog items</p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} className="mr-1.5" />
          Add Product
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-slate-500">
              {searchTerm ? `No products match "${searchTerm}".` : 'No products found. Add your first product to get started!'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => onSearchChange('')}
                className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Clear search filter
              </button>
            ) : (
              <button
                onClick={onOpenAddModal}
                className="mt-4 inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg"
              >
                <Plus size={14} className="mr-1" />
                Add First Product
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Product Name</th>
                  <th className="px-5 py-3.5">SKU</th>
                  <th className="px-5 py-3.5 text-right">Quantity</th>
                  <th className="px-5 py-3.5 text-right">Cost Price</th>
                  <th className="px-5 py-3.5 text-right">Selling Price</th>
                  <th className="px-5 py-3.5 text-center">Threshold</th>
                  <th className="px-5 py-3.5 text-center">Stock Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <div>{p.name}</div>
                      {p.description && (
                        <p className="text-xs text-slate-400 font-normal truncate max-w-xs">{p.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-xs">{p.sku}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-800">
                      {p.quantity}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600">
                      {p.cost_price !== null && p.cost_price !== undefined ? `$${p.cost_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600">
                      {p.selling_price !== null && p.selling_price !== undefined ? `$${p.selling_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-center text-slate-500 text-xs">
                      {p.low_stock_threshold !== null && p.low_stock_threshold !== undefined ? (
                        <span>{p.low_stock_threshold} <span className="text-[10px] text-slate-400">(custom)</span></span>
                      ) : (
                        <span>{p.effective_threshold} <span className="text-[10px] text-slate-400">(org)</span></span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {p.is_low_stock ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <AlertTriangle size={12} className="mr-1" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={12} className="mr-1" />
                          Optimal
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onOpenEditModal(p)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteModalProduct(p)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Delete Product</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <strong className="text-slate-800">{deleteModalProduct.name}</strong> (SKU: {deleteModalProduct.sku})? This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {deleteError}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteModalProduct(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
