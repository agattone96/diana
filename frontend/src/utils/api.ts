const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
const API = BASE ? `${BASE}/api` : null;

let authToken: string | null = null;

export function setApiToken(token: string | null) {
  authToken = token;
}

async function request(path: string, options?: RequestInit) {
  if (!API) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL is not configured for this build.');
  }

  const headers = new Headers(options?.headers || {});
  if (!headers.has('Content-Type') && options?.body) headers.set('Content-Type', 'application/json');
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  signup: (data: { name: string; email: string; password: string }) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  getProfile: () => request('/profile'),
  updateProfile: (data: any) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  resetProfile: () => request('/profile/reset', { method: 'POST' }),

  getInventory: (location?: string) => request(`/inventory${location ? `?location=${location}` : ''}`),
  addInventoryItem: (item: any) => request('/inventory', { method: 'POST', body: JSON.stringify(item) }),
  addInventoryBatch: (items: any[]) => request('/inventory/batch', { method: 'POST', body: JSON.stringify(items) }),
  updateInventoryItem: (id: string, data: any) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInventoryItem: (id: string) => request(`/inventory/${id}`, { method: 'DELETE' }),
  extractPhoto: (image_base64: string, location: string) =>
    request('/inventory/extract-photo', { method: 'POST', body: JSON.stringify({ image_base64, location }) }),

  getRequiredItems: () => request('/required-items'),
  addRequiredItem: (item: any) => request('/required-items', { method: 'POST', body: JSON.stringify(item) }),
  updateRequiredItem: (id: string, data: any) => request(`/required-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRequiredItem: (id: string) => request(`/required-items/${id}`, { method: 'DELETE' }),

  generatePlan: (data: any) => request('/generate-plan', { method: 'POST', body: JSON.stringify(data) }),
  getCurrentPlan: () => request('/current-plan'),
  updateCurrentPlan: (plan: any) => request('/current-plan', { method: 'PUT', body: JSON.stringify({ plan }) }),
  removeRecipe: (recipeId: string) => request(`/current-plan/recipe/${recipeId}`, { method: 'DELETE' }),
  regenerateRecipe: (recipeId: string, preference: string) =>
    request('/regenerate-recipe', { method: 'POST', body: JSON.stringify({ recipe_id: recipeId, preference }) }),

  getHistory: () => request('/history'),
  saveToHistory: () => request('/history/save', { method: 'POST' }),
  duplicateFromHistory: (id: string) => request(`/history/${id}/duplicate`, { method: 'POST' }),
};
