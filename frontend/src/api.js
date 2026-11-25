const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getAuthToken = () => localStorage.getItem('stockflow_token');
export const setAuthToken = (token) => localStorage.setItem('stockflow_token', token);
export const removeAuthToken = () => localStorage.removeItem('stockflow_token');

export const getUser = () => {
  const user = localStorage.getItem('stockflow_user');
  return user ? JSON.parse(user) : null;
};
export const setUser = (user) => localStorage.setItem('stockflow_user', JSON.stringify(user));

export const getOrg = () => {
  const org = localStorage.getItem('stockflow_org');
  return org ? JSON.parse(org) : null;
};
export const setOrg = (org) => localStorage.setItem('stockflow_org', JSON.stringify(org));

export const clearAuth = () => {
  localStorage.removeItem('stockflow_token');
  localStorage.removeItem('stockflow_user');
  localStorage.removeItem('stockflow_org');
};

export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuth();
    window.dispatchEvent(new Event('auth-changed'));
    throw new Error('Session expired or unauthorized');
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail || 'An unexpected error occurred';
    throw new Error(errorMsg);
  }

  return data;
}
