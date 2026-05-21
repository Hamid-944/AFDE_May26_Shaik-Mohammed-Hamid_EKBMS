import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Eye, Edit3, Trash2, Send, Archive, FileText, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { articlesApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { formatRelative, formatDate } from '@/lib/utils'

const STATUS_FILTERS = ['All', 'Draft', 'Pending Approval', 'Approved', 'Published', 'Rejected', 'Archived']

export default function ArticlesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, hasRole } = useAuthStore()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('All')
  const isEmployee = user?.role?.name === 'Employee'

  const { data, isLoading } = useQuery({
    queryKey: ['articles', page, statusFilter, user?.role?.name],
    queryFn: () => {
      const params = { page, per_page: 12 }
      if (statusFilter !== 'All') params.status = statusFilter
      if (hasRole('Author')) return articlesApi.my(params).then((r) => r.data)
      return articlesApi.list(params).then((r) => r.data)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => articlesApi.delete(id),
    onSuccess: () => { toast.success('Article deleted'); qc.invalidateQueries(['articles']) },
    onError: () => toast.error('Delete failed'),
  })

  const submitMutation = useMutation({
    mutationFn: (id) => articlesApi.update(id, { status: 'Pending Approval' }),
    onSuccess: () => { toast.success('Submitted for review'); qc.invalidateQueries(['articles']) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === s ? 'gradient-brand text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {!isEmployee && (
          <Button onClick={() => navigate('/articles/new')}>
            <Plus className="w-4 h-4" /> New Article
          </Button>
        )}
      </div>

      {/* Empty state */}
      {data?.items?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">No articles found</h3>
          <p className="text-sm text-slate-400">
            {!isEmployee ? 'Create your first article to get started.' : 'No published articles available.'}
          </p>
          {!isEmployee && (
            <Button className="mt-4" onClick={() => navigate('/articles/new')}><Plus className="w-4 h-4" /> Create Article</Button>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {data?.items?.map((article, i) => (
          <motion.div key={article.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card hover className="flex flex-col h-full">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <StatusBadge status={article.status} />
                  <span className="text-xs text-slate-400">{formatRelative(article.updated_at)}</span>
                </div>
                <h3
                  className="font-semibold text-slate-900 leading-snug mb-2 cursor-pointer hover:text-indigo-600 transition-colors line-clamp-2"
                  onClick={() => navigate(`/articles/${article.id}`)}
                >
                  {article.title}
                </h3>
                {article.summary && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{article.summary}</p>
                )}
                <div className="flex flex-wrap gap-1 mb-3">
                  {article.category && (
                    <Badge variant="secondary" className="text-xs">{article.category.name}</Badge>
                  )}
                  {article.tags?.slice(0, 3).map((t) => (
                    <Badge key={t.id} variant="outline" className="text-xs">{t.name}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{article.view_count}</span>
                  {article.avg_rating > 0 && <span className="text-amber-500">★ {article.avg_rating}</span>}
                  <span>by {article.author?.name}</span>
                </div>
              </div>

              {!isEmployee && (
                <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/articles/${article.id}`)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  {(article.author?.id === user?.id || hasRole('Admin')) && article.status !== 'Published' && article.status !== 'Pending Approval' && (
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/articles/${article.id}/edit`)}>
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {article.status === 'Draft' && article.author?.id === user?.id && (
                    <Button size="sm" variant="ghost" className="text-indigo-600" onClick={() => submitMutation.mutate(article.id)}>
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {(article.author?.id === user?.id || hasRole('Admin')) && (
                    <Button size="sm" variant="ghost" className="text-red-500 ml-auto" onClick={() => {
                      if (confirm('Delete this article?')) deleteMutation.mutate(article.id)
                    }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="text-sm text-slate-600">Page {page} of {data.pages}</span>
          <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
