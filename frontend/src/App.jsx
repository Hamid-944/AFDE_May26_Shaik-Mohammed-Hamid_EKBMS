import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { PageLoader } from '@/components/ui/Spinner'

import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import ArticlesPage from '@/pages/ArticlesPage'
import ArticleFormPage from '@/pages/ArticleFormPage'
import ArticleViewPage from '@/pages/ArticleViewPage'
import SearchPage from '@/pages/SearchPage'
import CategoriesPage from '@/pages/CategoriesPage'
import TagsPage from '@/pages/TagsPage'
import ApprovalsPage from '@/pages/ApprovalsPage'
import UsersPage from '@/pages/UsersPage'
import ReportsPage from '@/pages/ReportsPage'
import ETLAnalyticsPage from '@/pages/ETLAnalyticsPage'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function RequireRole({ children, roles }) {
  const { user } = useAuthStore()
  if (!user || !roles.includes(user.role?.name)) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { isAuthenticated, fetchMe } = useAuthStore()
  const token = localStorage.getItem('access_token')

  useEffect(() => {
    if (token && !isAuthenticated) {
      fetchMe()
    }
  }, [])

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected */}
      <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>} >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="articles/new" element={<ArticleFormPage />} />
        <Route path="articles/:id" element={<ArticleViewPage />} />
        <Route path="articles/:id/edit" element={<ArticleFormPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="approvals" element={
          <RequireRole roles={['Admin', 'Reviewer']}><ApprovalsPage /></RequireRole>
        } />
        <Route path="users" element={
          <RequireRole roles={['Admin']}><UsersPage /></RequireRole>
        } />
        <Route path="reports" element={
          <RequireRole roles={['Admin']}><ReportsPage /></RequireRole>
        } />
        <Route path="etl-analytics" element={
          <RequireRole roles={['Admin']}><ETLAnalyticsPage /></RequireRole>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
