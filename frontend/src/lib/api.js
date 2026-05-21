import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refresh_token: refresh })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (d) => api.post('/auth/login', d),
  register: (d) => api.post('/auth/register', d),
  me: () => api.get('/auth/me'),
  forgotPassword: (d) => api.post('/auth/forgot-password', d),
  resetPassword: (d) => api.post('/auth/reset-password', d),
  changePassword: (d) => api.post('/auth/change-password', d),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (p) => api.get('/users', { params: p }),
  get: (id) => api.get(`/users/${id}`),
  updateMe: (d) => api.put('/users/me', d),
  update: (id, d) => api.put(`/users/${id}`, d),
  deactivate: (id) => api.delete(`/users/${id}`),
  roles: () => api.get('/users/roles'),
}

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => api.get('/categories'),
  tree: () => api.get('/categories/tree'),
  get: (id) => api.get(`/categories/${id}`),
  create: (d) => api.post('/categories', d),
  update: (id, d) => api.put(`/categories/${id}`, d),
  delete: (id) => api.delete(`/categories/${id}`),
}

// ── Tags ──────────────────────────────────────────────────────────────────────
export const tagsApi = {
  list: () => api.get('/tags'),
  create: (d) => api.post('/tags', d),
  delete: (id) => api.delete(`/tags/${id}`),
}

// ── Articles ──────────────────────────────────────────────────────────────────
export const articlesApi = {
  list: (p) => api.get('/articles', { params: p }),
  my: (p) => api.get('/articles/my', { params: p }),
  get: (id) => api.get(`/articles/${id}`),
  create: (d) => api.post('/articles', d),
  update: (id, d) => api.put(`/articles/${id}`, d),
  delete: (id) => api.delete(`/articles/${id}`),
}

// ── Approvals ─────────────────────────────────────────────────────────────────
export const approvalsApi = {
  pending: () => api.get('/approvals/pending'),
  forArticle: (id) => api.get(`/approvals/article/${id}`),
  action: (id, d) => api.post(`/approvals/${id}/action`, d),
}

// ── Files ──────────────────────────────────────────────────────────────────────
export const filesApi = {
  upload: (articleId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/files/upload/${articleId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  download: (id) => api.get(`/files/download/${id}`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/files/${id}`),
}

// ── Search ────────────────────────────────────────────────────────────────────
export const searchApi = {
  search: (p) => api.get('/search', { params: p }),
  suggestions: (q) => api.get('/search/suggestions', { params: { q } }),
}

// ── Collaboration ─────────────────────────────────────────────────────────────
export const collaborationApi = {
  getComments: (id) => api.get(`/articles/${id}/comments`),
  addComment: (id, d) => api.post(`/articles/${id}/comments`, d),
  updateComment: (id, d) => api.put(`/comments/${id}`, d),
  deleteComment: (id) => api.delete(`/comments/${id}`),
  rateArticle: (id, d) => api.post(`/articles/${id}/rate`, d),
  getBookmarks: () => api.get('/bookmarks'),
  toggleBookmark: (id) => api.post(`/articles/${id}/bookmark`),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get('/dashboard'),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  summary: () => api.get('/analytics/summary'),
  mostViewed: (limit = 10) => api.get('/analytics/most-viewed', { params: { limit } }),
  categoryTrends: () => api.get('/analytics/category-trends'),
  authorActivity: (limit = 15) => api.get('/analytics/author-activity', { params: { limit } }),
  searchKeywords: (limit = 15) => api.get('/analytics/search-keywords', { params: { limit } }),
}

// ── ETL ───────────────────────────────────────────────────────────────────────
export const etlApi = {
  run: () => api.post('/etl/run'),
  history: (limit = 10) => api.get('/etl/history', { params: { limit } }),
  status: (id) => api.get(`/etl/status/${id}`),
}
