import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { FileText, Users, Clock, Eye, Folder, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import { dashboardApi } from '@/lib/api'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { PageLoader } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

function StatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">{label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{value?.toLocaleString()}</p>
              {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then((r) => r.data),
  })

  if (isLoading) return <PageLoader />

  const { stats, top_articles, category_distribution, recent_search_trends, monthly_articles } = data || {}

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={FileText} label="Total Articles" value={stats?.total_articles} color="bg-indigo-50 text-indigo-600" delay={0} />
        <StatCard icon={CheckCircle} label="Published" value={stats?.published_articles} color="bg-emerald-50 text-emerald-600" delay={0.05} />
        <StatCard icon={Clock} label="Pending" value={stats?.pending_approvals} sub="awaiting review" color="bg-amber-50 text-amber-600" delay={0.1} />
        <StatCard icon={Users} label="Users" value={stats?.total_users} color="bg-sky-50 text-sky-600" delay={0.15} />
        <StatCard icon={Folder} label="Categories" value={stats?.total_categories} color="bg-purple-50 text-purple-600" delay={0.2} />
        <StatCard icon={Eye} label="Total Views" value={stats?.total_views} color="bg-rose-50 text-rose-600" delay={0.25} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-slate-900">Article Creation Trend</h3>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthly_articles}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  />
                  <Line type="monotone" dataKey="articles" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-slate-900">By Category</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={category_distribution} dataKey="article_count" nameKey="category_name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                    {category_distribution?.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top articles */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-500" />
                <h3 className="font-semibold text-slate-900">Most Viewed Articles</h3>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {top_articles?.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No articles yet</p>
              )}
              {top_articles?.map((a, i) => (
                <div key={a.id} className="flex items-center gap-4 px-6 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <span className="text-2xl font-bold text-slate-200 w-6 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{a.title}</p>
                    <p className="text-xs text-slate-400">{a.author_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-700">{a.view_count.toLocaleString()}</p>
                    <p className="text-xs text-amber-500">★ {a.avg_rating > 0 ? a.avg_rating : '—'}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Search trends */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold text-slate-900">Top Search Trends</h3>
              </div>
            </CardHeader>
            <CardContent>
              {recent_search_trends?.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No searches yet</p>
              )}
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={recent_search_trends?.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="query" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
