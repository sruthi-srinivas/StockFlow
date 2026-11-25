import React, { useState, useEffect } from 'react';
import {
  Package,
  LayoutDashboard,
  Box,
  Settings as SettingsIcon,
  LogOut,
  Building2,
  User,
  Menu,
  X
} from 'lucide-react';

import {
  getAuthToken,
  getUser,
  getOrg,
  clearAuth,
  apiRequest
} from './api';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import SettingsPage from './pages/SettingsPage';
import ProductFormModal from './components/ProductFormModal';

export default function App() {
  const [token, setToken] = useState(getAuthToken());
  const [user, setCurrentUser] = useState(getUser());
  const [org, setCurrentOrg] = useState(getOrg());

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [dashboardStats, setDashboardStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Sync token state on custom events
  useEffect(() => {
    const handleAuthChange = () => {
      setToken(getAuthToken());
      setCurrentUser(getUser());
      setCurrentOrg(getOrg());
    };
    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  const handleAuthSuccess = (u, o) => {
    setToken(getAuthToken());
    setCurrentUser(u);
    setCurrentOrg(o);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    clearAuth();
    setToken(null);
    setCurrentUser(null);
    setCurrentOrg(null);
  };

  // Fetch Dashboard Stats
  const loadDashboard = async () => {
    try {
      const data = await apiRequest('/api/dashboard');
      setDashboardStats(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  // Fetch Products
  const loadProducts = async (search = searchTerm) => {
    try {
      const endpoint = search ? `/api/products?search=${encodeURIComponent(search)}` : '/api/products';
      const data = await apiRequest(endpoint);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  // Initial and reactive data fetching
  useEffect(() => {
    if (!token) return;
    if (activeTab === 'dashboard') {
      loadDashboard();
    } else if (activeTab === 'products') {
      loadProducts(searchTerm);
    }
  }, [token, activeTab, searchTerm]);

  // If unauthenticated, show Auth Page
  if (!token) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const handleModalSaveSuccess = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    loadProducts(searchTerm);
    loadDashboard();
  };

  const handleProductDeleted = () => {
    loadProducts(searchTerm);
    loadDashboard();
  };

  const handleOrgUpdated = (updatedOrg) => {
    setCurrentOrg(updatedOrg);
    loadDashboard();
    loadProducts(searchTerm);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 space-x-3">
          <div className="h-9 w-9 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-xs">
            <Package size={20} />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">StockFlow</span>
            <span className="block text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Inventory SaaS</span>
          </div>
        </div>

        {/* Org Banner */}
        <div className="px-5 py-3.5 mx-3 mt-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2.5">
          <Building2 size={18} className="text-slate-400 shrink-0" />
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-800 truncate">{org?.name || 'Organization'}</p>
            <p className="text-[11px] text-slate-400">Standard Plan</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard size={18} className="mr-3" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Box size={18} className="mr-3" />
            Products
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <SettingsIcon size={18} className="mr-3" />
            Settings
          </button>
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 truncate mr-2">
              <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                <User size={16} />
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-slate-800 truncate">{user?.email}</p>
                <p className="text-[10px] text-slate-400">Authenticated</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="font-bold text-slate-900">StockFlow</span>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-sm text-slate-500">
            <span>{org?.name}</span>
            <span>/</span>
            <span className="capitalize font-medium text-slate-800">{activeTab}</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Default Threshold: {org?.default_low_stock_threshold ?? 5} units
            </span>
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2">
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('products'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'products' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeTab === 'settings' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600'
              }`}
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-rose-600 text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Page Content View */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={dashboardStats}
              onNavigate={(tab, params) => {
                setActiveTab(tab);
                if (params?.editProductId) {
                  const target = dashboardStats?.low_stock_products?.find(p => p.id === params.editProductId);
                  if (target) handleOpenEditModal(target);
                }
              }}
              onAddProduct={handleOpenAddModal}
            />
          )}

          {activeTab === 'products' && (
            <ProductsPage
              products={products}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onOpenAddModal={handleOpenAddModal}
              onOpenEditModal={handleOpenEditModal}
              onProductDeleted={handleProductDeleted}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              org={org}
              onOrgUpdated={handleOrgUpdated}
            />
          )}
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <ProductFormModal
          product={editingProduct}
          defaultOrgThreshold={org?.default_low_stock_threshold ?? 5}
          onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
          onSaveSuccess={handleModalSaveSuccess}
        />
      )}
    </div>
  );
}
