import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit3, Star, Bookmark, MessageCircle, Paperclip, Download, Send, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { articlesApi, collaborationApi, filesApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { formatDate, formatRelative, formatFileSize } from '@/lib/utils'

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className={`text-2xl transition-colors ${s <= (hover || value) ? 'text-amber-400' : 'text-slate-200'}`}
        >★</button>
      ))}
    </div>
  )
}

function CommentItem({ comment, onDelete, currentUser }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 gradient-brand rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold">
        {comment.user?.name?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-semibold text-slate-900">{comment.user?.name}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{formatRelative(comment.created_at)}</span>
            {(comment.user?.id === currentUser?.id || currentUser?.role?.name === 'Admin') && (
              <button onClick={() => onDelete(comment.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            )}
          </div>
        </div>
        <p className="text-sm text-slate-600">{comment.content}</p>
        {comment.replies?.map((r) => <CommentItem key={r.id} comment={r} onDelete={onDelete} currentUser={currentUser} />)}
      </div>
    </div>
  )
}

export default function ArticleViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [commentText, setCommentText] = useState('')
  const [userRating, setUserRating] = useState(0)

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: () => articlesApi.get(id).then((r) => r.data),
  })
  const { data: comments } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => collaborationApi.getComments(id).then((r) => r.data),
  })

  const bookmarkMutation = useMutation({
    mutationFn: () => collaborationApi.toggleBookmark(id),
    onSuccess: (res) => {
      toast.success(res.data.bookmarked ? 'Bookmarked!' : 'Removed bookmark')
      qc.invalidateQueries(['article', id])
    },
  })

  const rateMutation = useMutation({
    mutationFn: (score) => collaborationApi.rateArticle(id, { score }),
    onSuccess: () => { toast.success('Rating saved!'); qc.invalidateQueries(['article', id]) },
  })

  const commentMutation = useMutation({
    mutationFn: (content) => collaborationApi.addComment(id, { content }),
    onSuccess: () => { toast.success('Comment added'); setCommentText(''); qc.invalidateQueries(['comments', id]) },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (cId) => collaborationApi.deleteComment(cId),
    onSuccess: () => { toast.success('Comment deleted'); qc.invalidateQueries(['comments', id]) },
  })

  if (isLoading) return <PageLoader />
  if (!article) return <div className="text-center py-20 text-slate-400">Article not found</div>

  const canEdit = user?.role?.name === 'Admin' || article.author?.id === user?.id

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /> Back</Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => bookmarkMutation.mutate()}>
          <Bookmark className={`w-4 h-4 ${article.is_bookmarked ? 'fill-indigo-600 text-indigo-600' : ''}`} />
          {article.is_bookmarked ? 'Bookmarked' : 'Bookmark'}
        </Button>
        {canEdit && article.status !== 'Pending Approval' && (
          <Button size="sm" onClick={() => navigate(`/articles/${id}/edit`)}>
            <Edit3 className="w-4 h-4" /> Edit
          </Button>
        )}
      </div>

      {/* Article card */}
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <StatusBadge status={article.status} />
            {article.category && <Badge variant="secondary">{article.category.name}</Badge>}
            {article.tags?.map((t) => <Badge key={t.id} variant="outline">{t.name}</Badge>)}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3 leading-tight">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 gradient-brand rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {article.author?.name?.[0]}
              </div>
              <span>{article.author?.name}</span>
            </div>
            <span>{formatDate(article.created_at)}</span>
            <span className="flex items-center gap-1">👁 {article.view_count} views</span>
            {article.avg_rating > 0 && <span className="text-amber-500">★ {article.avg_rating}</span>}
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {comments?.length || 0}</span>
          </div>
          <div className="prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
        </CardContent>
      </Card>

      {/* Attachments */}
      {article.attachments?.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Paperclip className="w-4 h-4" /> Attachments</h3>
            <div className="space-y-2">
              {article.attachments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.original_name}</p>
                    <p className="text-xs text-slate-400">{formatFileSize(a.file_size)} · {a.file_type}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => filesApi.download(a.id).then(({ data }) => {
                    const url = URL.createObjectURL(data)
                    const link = document.createElement('a')
                    link.href = url; link.download = a.original_name; link.click()
                  })}>
                    <Download className="w-4 h-4" /> Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rating */}
      <Card>
        <CardContent>
          <h3 className="font-semibold text-slate-900 mb-3">Rate this article</h3>
          <div className="flex items-center gap-4">
            <StarRating value={userRating} onChange={(s) => { setUserRating(s); rateMutation.mutate(s) }} />
            {article.avg_rating > 0 && (
              <span className="text-sm text-slate-500">Avg: <span className="text-amber-500 font-semibold">★ {article.avg_rating}</span></span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardContent>
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-indigo-500" />
            Comments ({comments?.length || 0})
          </h3>

          {/* Comment input */}
          <div className="flex gap-3 mb-6">
            <div className="w-8 h-8 gradient-brand rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) { e.preventDefault(); commentMutation.mutate(commentText.trim()) } }}
                placeholder="Write a comment... (Enter to send)"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button size="sm" onClick={() => commentText.trim() && commentMutation.mutate(commentText.trim())}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {comments?.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No comments yet. Be the first!</p>}
            {comments?.map((c) => (
              <CommentItem key={c.id} comment={c} onDelete={deleteCommentMutation.mutate} currentUser={user} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
