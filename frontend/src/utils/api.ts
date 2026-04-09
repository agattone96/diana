const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
const API = `${BASE}/api`;

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Profile
  getProfile: () => request('/profile'),
  updateProfile: (data: any) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  resetProfile: () => request('/profile/reset', { method: 'POST' }),

  // Inventory
  getInventory: (location?: string) => request(`/inventory${location ? `?location=${location}` : ''}`),
  addInventoryItem: (item: any) => request('/inventory', { method: 'POST', body: JSON.stringify(item) }),
  addInventoryBatch: (items: any[]) => request('/inventory/batch', { method: 'POST', body: JSON.stringify(items) }),
  updateInventoryItem: (id: string, data: any) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInventoryItem: (id: string) => request(`/inventory/${id}`, { method: 'DELETE' }),
  extractPhoto: (image_base64: string, location: string) =>
    request('/inventory/extract-photo', { method: 'POST', body: JSON.stringify({ image_base64, location }) }),

  // Required Items
  getRequiredItems: () => request('/required-items'),
  addRequiredItem: (item: any) => request('/required-items', { method: 'POST', body: JSON.stringify(item) }),
  updateRequiredItem: (id: string, data: any) => request(`/required-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRequiredItem: (id: string) => request(`/required-items/${id}`, { method: 'DELETE' }),

  // Plan
  generatePlan: (data: any) => request('/generate-plan', { method: 'POST', body: JSON.stringify(data) }),
  getCurrentPlan: () => request('/current-plan'),
  updateCurrentPlan: (plan: any) => request('/current-plan', { method: 'PUT', body: JSON.stringify({ plan }) }),
  removeRecipe: (recipeId: string) => request(`/current-plan/recipe/${recipeId}`, { method: 'DELETE' }),
  regenerateRecipe: (recipeId: string, preference: string) =>
    request('/regenerate-recipe', { method: 'POST', body: JSON.stringify({ recipe_id: recipeId, preference }) }),

  // History
  getHistory: () => request('/history'),
  saveToHistory: () => request('/history/save', { method: 'POST' }),
  duplicateFromHistory: (id: string) => request(`/history/${id}/duplicate`, { method: 'POST' }),
};
