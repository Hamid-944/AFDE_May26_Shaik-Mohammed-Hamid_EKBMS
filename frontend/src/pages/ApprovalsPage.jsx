import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Eye, MessageSquare, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { approvalsApi, articlesApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PageLoader } from '@/components/ui/Spinner'
import { formatRelative } from '@/lib/utils'

export default function ApprovalsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [actionModal, setActionModal] = useState(null) // { approval, action }
  const [comments, setComments] = useState('')

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => approvalsApi.pending().then((r) => r.data),
  })

  const { data: articles } = useQuery({
    queryKey: ['articles-for-approvals'],
    queryFn: async () => {
      if (!approvals?.length) return {}
      const map = {}
      await Promise.all(
        approvals.map(async (a) => {
          try {
            const { data } = await articlesApi.get(a.article_id)
            map[a.article_id] = data
          } catch {}
        })
      )
      return map
    },
    enabled: !!approvals?.length,
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, status, reviewer_comments }) => approvalsApi.action(id, { status, reviewer_comments }),
    onSuccess: (_, { status }) => {
      toast.success(status === 'Approved' ? 'Article approved!' : 'Article rejected')
      qc.invalidateQueries(['pending-approvals'])
      qc.invalidateQueries(['dashboard'])
      setActionModal(null)
      setComments('')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Action failed'),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Pending Approvals</h2>
          <p className="text-sm text-slate-500">{approvals?.length || 0} articles awaiting review</p>
        </div>
      </div>

      {approvals?.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="font-semibold text-slate-900">All caught up!</h3>
          <p className="text-sm text-slate-400 mt-1">No articles pending approval</p>
        </div>
      )}

      <div className="space-y-4">
        {approvals?.map((approval, i) => {
          const article = articles?.[approval.article_id]
          return (
            <motion.div key={approval.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Pending Review
                        </span>
                        <span className="text-xs text-slate-400">submitted {formatRelative(approval.submitted_at)}</span>
                      </div>
                      <h3 className="font-semibold text-slate-900 text-lg mb-1">{article?.title || `Article #${approval.article_id}`}</h3>
                      {article?.summary && <p className="text-sm text-slate-500 mb-2 line-clamp-2">{article.summary}</p>}
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        {article?.author && <span>by {article.author.name}</span>}
                        {article?.category && <span>{article.category.name}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/articles/${approval.article_id}`)}>
                        <Eye className="w-4 h-4" /> View
                      </Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200"
                        onClick={() => setActionModal({ approval, action: 'Approved' })}>
                        <CheckCircle className="w-4 h-4" /> Approve
                      </Button>
                      <Button size="sm" variant="danger"
                        onClick={() => setActionModal({ approval, action: 'Rejected' })}>
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      <Modal
        open={!!actionModal}
        onOpenChange={() => { setActionModal(null); setComments('') }}
        title={actionModal?.action === 'Approved' ? 'Approve Article' : 'Reject Article'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {actionModal?.action === 'Approved'
              ? 'Approving this article will mark it as approved and allow the author to publish it.'
              : 'Rejecting this article will send it back to the author for revision.'}
          </p>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              {actionModal?.action === 'Approved' ? 'Comments (optional)' : 'Reason for rejection *'}
            </label>
            <textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={actionModal?.action === 'Approved' ? 'Great work! ...' : 'Please revise...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setActionModal(null); setComments('') }}>Cancel</Button>
            <Button
              className={`flex-1 ${actionModal?.action === 'Rejected' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'} text-white shadow-md`}
              loading={actionMutation.isPending}
              onClick={() => {
                if (actionModal?.action === 'Rejected' && !comments.trim()) { toast.error('Please provide a rejection reason'); return }
                actionMutation.mutate({ id: actionModal.approval.id, status: actionModal.action, reviewer_comments: comments })
              }}
            >
              {actionModal?.action === 'Approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              Confirm {actionModal?.action}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
