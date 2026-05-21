import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import {
  Database, Play, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp,
  Users, FolderOpen, Search, Eye, Star, FileText, AlertCircle, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { analyticsApi, etlApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Badge } from '@/components/ui/Badge'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16']

// ── Small helpers ──────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const palette = {
    indigo: 'bg-indigo-50 text-indigo-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${palette[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    success: { icon: CheckCircle, cls: 'bg-emerald-100 text-emerald-700', label: 'Success' },
    failed: { icon: XCircle, cls: 'bg-red-100 text-red-700', label: 'Failed' },
    running: { icon: Loader2, cls: 'bg-blue-100 text-blue-700', label: 'Running' },
  }
  const cfg = map[status] || map.running
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.cls}`}>
      <Icon className={`w-3 h-3 ${status === 'running' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  )
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value?.toLocaleString()}</span></p>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ETLAnalyticsPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role?.name === 'Admin'
  const queryClient = useQueryClient()
  const [activeRunId, setActiveRunId] = useState(null)

  const { data: summary, isLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsApi.summary().then((r) => r.data),
    refetchInterval: activeRunId ? 4000 : false,
  })

  const { data: history = [] } = useQuery({
    queryKey: ['etl-history'],
    queryFn: () => etlApi.history(8).then((r) => r.data),
    enabled: isAdmin,
    refetchInterval: activeRunId ? 3000 : false,
  })

  const triggerEtl = useMutation({
    mutationFn: () => etlApi.run(),
    onSuccess: (res) => {
      setActiveRunId(res.data.id)
      toast.success('ETL pipeline started — analytics will refresh automatically.')
      queryClient.invalidateQueries({ queryKey: ['etl-history'] })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to start ETL'),
  })

  // Stop polling once run completes
  if (activeRunId && history.length > 0) {
    const run = history.find((r) => r.id === activeRunId)
    if (run && run.status !== 'running') {
      setActiveRunId(null)
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
    }
  }

  const lastRun = summary?.last_etl_run

  // Derived summary stats
  const totalArticles = (summary?.most_viewed ?? []).length
  const totalViews = (summary?.category_trends ?? []).reduce((s, c) => s + c.total_views, 0)
  const totalAuthors = (summary?.author_stats ?? []).length
  const topKeyword = summary?.search_trends?.[0]?.keyword ?? '—'

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ETL & Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Import knowledge articles and explore usage analytics</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => triggerEtl.mutate()}
            disabled={triggerEtl.isPending || activeRunId}
            className="flex items-center gap-2 px-4 py-2.5 gradient-brand text-white rounded-xl text-sm font-medium shadow-md shadow-indigo-200 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {triggerEtl.isPending || activeRunId
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Running…</>
              : <><Play className="w-4 h-4" /> Run ETL Pipeline</>}
          </button>
        )}
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Indexed Articles" value={totalArticles} sub="from ETL analytics" color="indigo" />
        <StatCard icon={Eye} label="Total Views" value={totalViews.toLocaleString()} sub="across all categories" color="violet" />
        <StatCard icon={Users} label="Active Authors" value={totalAuthors} sub="with published content" color="emerald" />
        <StatCard icon={Search} label="Top Search" value={topKeyword} sub="most searched term" color="amber" />
      </div>

      {/* ETL Pipeline section (Admin only) */}
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <SectionHeader icon={Database} title="ETL Pipeline" subtitle="Extract → Transform → Load from datasets/articles.csv" />

          {lastRun && (
            <div className="flex flex-wrap gap-4 mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-xs">
                <p className="text-slate-500 mb-0.5">Last run</p>
                <p className="font-semibold text-slate-800">{new Date(lastRun.run_at).toLocaleString()}</p>
              </div>
              <div className="text-xs">
                <p className="text-slate-500 mb-0.5">Status</p>
                <StatusBadge status={lastRun.status} />
              </div>
              <div className="text-xs">
                <p className="text-slate-500 mb-0.5">Extracted</p>
                <p className="font-semibold text-slate-800">{lastRun.records_extracted}</p>
              </div>
              <div className="text-xs">
                <p className="text-slate-500 mb-0.5">Transformed</p>
                <p className="font-semibold text-slate-800">{lastRun.records_transformed}</p>
              </div>
              <div className="text-xs">
                <p className="text-slate-500 mb-0.5">Loaded</p>
                <p className="font-semibold text-slate-800 text-emerald-600">{lastRun.records_loaded}</p>
              </div>
              <div className="text-xs">
                <p className="text-slate-500 mb-0.5">Skipped</p>
                <p className="font-semibold text-slate-800">{lastRun.records_skipped}</p>
              </div>
              {lastRun.duration_seconds && (
                <div className="text-xs">
                  <p className="text-slate-500 mb-0.5">Duration</p>
                  <p className="font-semibold text-slate-800">{lastRun.duration_seconds}s</p>
                </div>
              )}
            </div>
          )}

          {/* Run history table */}
          {history.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Run ID', 'Date', 'Status', 'Extracted', 'Transformed', 'Loaded', 'Skipped', 'Duration'].map((h) => (
                      <th key={h} className="text-left py-2 px-2 font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((run) => (
                    <tr key={run.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2 text-slate-400">#{run.id}</td>
                      <td className="py-2 px-2 text-slate-700">{new Date(run.run_at).toLocaleString()}</td>
                      <td className="py-2 px-2"><StatusBadge status={run.status} /></td>
                      <td className="py-2 px-2 text-slate-700">{run.records_extracted}</td>
                      <td className="py-2 px-2 text-slate-700">{run.records_transformed}</td>
                      <td className="py-2 px-2 font-semibold text-emerald-600">{run.records_loaded}</td>
                      <td className="py-2 px-2 text-slate-700">{run.records_skipped}</td>
                      <td className="py-2 px-2 text-slate-500">{run.duration_seconds ? `${run.duration_seconds}s` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {history.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Database className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No ETL runs yet. Click <strong>Run ETL Pipeline</strong> to start.</p>
            </div>
          )}
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Row 1: Most Viewed + Category Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Viewed Articles */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <SectionHeader icon={TrendingUp} title="Most Viewed Articles" subtitle="Top 10 by view count" />
              {summary?.most_viewed?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={summary.most_viewed.slice(0, 10)} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis
                      type="category"
                      dataKey="article_title"
                      width={130}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => v.length > 22 ? v.slice(0, 22) + '…' : v}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="view_count" name="Views" radius={[0, 6, 6, 0]}>
                      {summary.most_viewed.slice(0, 10).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Run the ETL pipeline to populate analytics data." />
              )}
            </motion.div>

            {/* Category Distribution */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <SectionHeader icon={FolderOpen} title="Category Usage Trends" subtitle="Articles and views per category" />
              {summary?.category_trends?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <Pie
                      data={summary.category_trends}
                      dataKey="article_count"
                      nameKey="category_name"
                      cx="50%"
                      cy="45%"
                      outerRadius={85}
                      innerRadius={42}
                      paddingAngle={3}
                    >
                      {summary.category_trends.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n, p) => [v, p.payload.category_name]} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      iconSize={8}
                      formatter={(v, entry) => (
                        <span className="text-xs text-slate-600">{entry.payload.category_name}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Run the ETL pipeline to populate analytics data." />
              )}
            </motion.div>
          </div>

          {/* Row 2: Author Activity + Search Keywords */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Author Activity */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <SectionHeader icon={Users} title="Author Activity Report" subtitle="Articles published per author" />
              {summary?.author_stats?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={summary.author_stats.slice(0, 12)} margin={{ bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="author_name"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      tickFormatter={(v) => v.split(' ')[0]}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="article_count" name="Articles" radius={[6, 6, 0, 0]}>
                      {summary.author_stats.slice(0, 12).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Run the ETL pipeline to populate analytics data." />
              )}

              {/* Author details table */}
              {summary?.author_stats?.length > 0 && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                  {summary.author_stats.slice(0, 8).map((a, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                          {a.author_name[0]}
                        </div>
                        <span className="text-xs font-medium text-slate-700">{a.author_name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{a.article_count} articles</span>
                        <span>{a.total_views.toLocaleString()} views</span>
                        {a.avg_rating && <span className="text-amber-500">★ {a.avg_rating}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Search Keyword Analysis */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <SectionHeader icon={Search} title="Search Keyword Analysis" subtitle="Most searched terms by users" />
              {summary?.search_trends?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={summary.search_trends.slice(0, 12)} margin={{ bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="keyword"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="search_count" name="Searches" radius={[6, 6, 0, 0]}>
                        {summary.search_trends.slice(0, 12).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Keyword pills */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {summary.search_trends.map((k, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {k.keyword}
                        <span className="ml-1 px-1.5 py-0.5 rounded-full text-white text-xs"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                          {k.search_count}
                        </span>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState message="Search for articles to start tracking keyword trends." />
              )}
            </motion.div>
          </div>

          {/* Row 3: Category views bar chart */}
          {summary?.category_trends?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <SectionHeader icon={Eye} title="Category Views Breakdown" subtitle="Total views per category from ETL-imported articles" />
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={summary.category_trends} margin={{ bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category_name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_views" name="Total Views" radius={[6, 6, 0, 0]}>
                    {summary.category_trends.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <AlertCircle className="w-10 h-10 mb-2 opacity-40" />
      <p className="text-sm text-center max-w-xs">{message}</p>
    </div>
  )
}
