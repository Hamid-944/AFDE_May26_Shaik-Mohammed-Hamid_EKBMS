import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Filter, SortAsc, Eye, MessageCircle } from 'lucide-react'
import { searchApi, categoriesApi, tagsApi } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { Select } from '@/components/ui/Select'
import { formatRelative } from '@/lib/utils'

export default function SearchPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [filters, setFilters] = useState({ category_id: '', tag_id: '', sort_by: 'latest' })
  const [page, setPage] = useState(1)

  const searchQuery = params.get('q') || ''

  const { data, isLoading } = useQuery({
    queryKey: ['search', searchQuery, filters, page],
    queryFn: () => searchApi.search({ q: searchQuery, ...filters, page, per_page: 10 }).then((r) => r.data),
    enabled: true,
  })

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list().then((r) => r.data) })
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list().then((r) => r.data) })

  const handleSearch = (e) => {
    e.preventDefault()
    setParams(query ? { q: query } : {})
    setPage(1)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Search bar */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search knowledge base..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:shadow-lg transition-all"
          />
          <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">Search</Button>
        </div>
      </form>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar */}
        <div className="w-full lg:w-56 space-y-4 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</h3>
            <Select
              label="Sort by"
              value={filters.sort_by}
              onChange={(e) => { setFilters({ ...filters, sort_by: e.target.value }); setPage(1) }}
            >
              <option value="latest">Latest</option>
              <option value="popular">Most Viewed</option>
              <option value="rating">Top Rated</option>
            </Select>
            <Select
              label="Category"
              value={filters.category_id}
              onChange={(e) => { setFilters({ ...filters, category_id: e.target.value }); setPage(1) }}
            >
              <option value="">All categories</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select
              label="Tag"
              value={filters.tag_id}
              onChange={(e) => { setFilters({ ...filters, tag_id: e.target.value }); setPage(1) }}
            >
              <option value="">All tags</option>
              {tags?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
            {(filters.category_id || filters.tag_id || filters.sort_by !== 'latest') && (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { setFilters({ category_id: '', tag_id: '', sort_by: 'latest' }); setPage(1) }}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 space-y-4">
          {searchQuery && (
            <p className="text-sm text-slate-500">
              {isLoading ? 'Searching...' : `${data?.total || 0} results for "${searchQuery}"`}
            </p>
          )}

          {isLoading && <PageLoader />}

          {!isLoading && data?.items?.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="font-semibold text-slate-900">No results found</h3>
              <p className="text-sm text-slate-400 mt-1">Try different keywords or remove filters</p>
            </div>
          )}

          {data?.items?.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card hover onClick={() => navigate(`/articles/${a.id}`)}>
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <StatusBadge status={a.status} />
                    {a.category && <Badge variant="secondary" className="text-xs">{a.category.name}</Badge>}
                    {a.tags?.slice(0, 3).map((t) => <Badge key={t.id} variant="outline" className="text-xs">{t.name}</Badge>)}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-lg mb-1 hover:text-indigo-600 transition-colors">{a.title}</h3>
                  {a.summary && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{a.summary}</p>}
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{a.author?.name}</span>
                    <span>{formatRelative(a.updated_at)}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{a.view_count}</span>
                    {a.avg_rating > 0 && <span className="text-amber-500">★ {a.avg_rating}</span>}
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{a.comment_count}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}

          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <span className="text-sm text-slate-600">Page {page} of {data.pages}</span>
              <Button size="sm" variant="secondary" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
