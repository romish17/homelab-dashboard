import { RssFeed, RssEntry, Subreddit, RedditPost, UserProfile } from './types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('homelab_token');
}

function setToken(token: string) {
  localStorage.setItem('homelab_token', token);
}

function clearToken() {
  localStorage.removeItem('homelab_token');
}

async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Non authentifié');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erreur serveur' }));
    throw new Error(body.error || 'Erreur serveur');
  }

  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    apiFetch<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username: string, password: string) =>
    apiFetch<{ token: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // Categories
  getCategories: () => apiFetch('/categories'),
  createCategory: (id: string, title: string) =>
    apiFetch('/categories', { method: 'POST', body: JSON.stringify({ id, title }) }),
  updateCategory: (id: string, title: string) =>
    apiFetch(`/categories/${id}`, { method: 'PUT', body: JSON.stringify({ title }) }),
  deleteCategory: (id: string) =>
    apiFetch(`/categories/${id}`, { method: 'DELETE' }),
  reorderCategories: (orderedIds: string[]) =>
    apiFetch('/categories/reorder', { method: 'PUT', body: JSON.stringify({ orderedIds }) }),

  // Links
  addLink: (catId: string, link: { id: string; title: string; url: string; iconUrl?: string }) =>
    apiFetch(`/categories/${catId}/links`, { method: 'POST', body: JSON.stringify(link) }),
  updateLink: (id: string, data: { title: string; url: string; iconUrl?: string }) =>
    apiFetch(`/links/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLink: (id: string) =>
    apiFetch(`/links/${id}`, { method: 'DELETE' }),

  // Profile
  getProfile: () => apiFetch<UserProfile>('/profile'),
  updateProfile: (displayName: string) =>
    apiFetch('/profile', { method: 'PUT', body: JSON.stringify({ displayName }) }),
  uploadAvatar: async (file: File) => {
    const token = getToken();
    const form = new FormData();
    form.append('avatar', file);
    const res = await fetch(`${API_BASE}/profile/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) throw new Error('Upload échoué');
    return res.json() as Promise<{ avatarUrl: string }>;
  },

  // RSS Feeds
  getFeeds: () => apiFetch<RssFeed[]>('/feeds'),
  createFeed: (id: string, title: string, url: string) =>
    apiFetch('/feeds', { method: 'POST', body: JSON.stringify({ id, title, url }) }),
  deleteFeed: (id: string) =>
    apiFetch(`/feeds/${id}`, { method: 'DELETE' }),
  getFeedEntries: (id: string) =>
    apiFetch<RssEntry[]>(`/feeds/${id}/entries`),

  // Subreddits
  getSubreddits: () => apiFetch<Subreddit[]>('/subreddits'),
  followSubreddit: (id: string, name: string) =>
    apiFetch('/subreddits', { method: 'POST', body: JSON.stringify({ id, name }) }),
  unfollowSubreddit: (id: string) =>
    apiFetch(`/subreddits/${id}`, { method: 'DELETE' }),
  getSubredditPosts: (id: string) =>
    apiFetch<RedditPost[]>(`/subreddits/${id}/posts`),

  getToken,
  setToken,
  clearToken,
};
