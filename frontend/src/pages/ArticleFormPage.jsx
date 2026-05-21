import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Save, Send, ArrowLeft, Tag as TagIcon, Paperclip, X, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { articlesApi, categoriesApi, tagsApi, filesApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { ArticleEditor } from '@/components/ArticleEditor'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { PageLoader } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { formatFileSize } from '@/lib/utils'

export default function ArticleFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({ title: '', content: '', summary: '', category_id: '', tag_ids: [] })
  const [tagInput, setTagInput] = useState('')
  const [uploading, setUploading] = useState(false)

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: () => articlesApi.get(id).then((r) => r.data),
    enabled: isEdit,
  })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list().then((r) => r.data) })
  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list().then((r) => r.data) })

  useEffect(() => {
    if (article) {
      setForm({
        title: article.title,
        content: article.content,
        summary: article.summary || '',
        category_id: article.category?.id?.toString() || '',
        tag_ids: article.tags?.map((t) => t.id) || [],
      })
    }
  }, [article])

  const saveMutation = useMutation({
    mutationFn: (payload) => isEdit ? articlesApi.update(id, payload) : articlesApi.create(payload),
    onSuccess: (res) => {
      toast.success(isEdit ? 'Article updated!' : 'Article created!')
      qc.invalidateQueries(['articles'])
      navigate(`/articles/${res.data.id}`)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Save failed'),
  })

  const handleSave = (status = 'Draft') => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.content.trim() || form.content === '<p></p>') { toast.error('Content is required'); return }
    saveMutation.mutate({
      title: form.title,
      content: form.content,
      summary: form.summary,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      tag_ids: form.tag_ids,
      status,
    })
  }

  const toggleTag = (tagId) => {
    setForm((f) => ({
      ...f,
      tag_ids: f.tag_ids.includes(tagId) ? f.tag_ids.filter((t) => t !== tagId) : [...f.tag_ids, tagId],
    }))
  }

  const handleFileUpload = async (e) => {
    if (!isEdit) { toast.error('Save the article first before uploading files'); return }
    const files = Array.from(e.target.files)
    setUploading(true)
    for (const file of files) {
      try {
        await filesApi.upload(id, file)
        toast.success(`${file.name} uploaded`)
      } catch (err) {
        toast.error(err.response?.data?.detail || `Failed to upload ${file.name}`)
      }
    }
    setUploading(false)
    qc.invalidateQueries(['article', id])
  }

  if (isEdit && articleLoading) return <PageLoader />

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/articles')}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <h2 className="text-xl font-bold text-slate-900 flex-1">{isEdit ? 'Edit Article' : 'New Article'}</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleSave('Draft')} loading={saveMutation.isPending}>
            <Save className="w-4 h-4" /> Save Draft
          </Button>
          <Button onClick={() => handleSave('Pending Approval')} loading={saveMutation.isPending}>
            <Send className="w-4 h-4" /> Submit for Review
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardContent className="space-y-4">
              <Input
                label="Article Title *"
                placeholder="Enter a clear, descriptive title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Input
                label="Summary"
                placeholder="Brief description (shown in article cards)"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Content *</label>
                <ArticleEditor value={form.content} onChange={(c) => setForm({ ...form, content: c })} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Category */}
          <Card>
            <CardContent>
              <Select
                label="Category"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">No category</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                <TagIcon className="w-4 h-4 text-slate-400" /> Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allTags?.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      form.tag_ids.includes(t.id)
                        ? 'gradient-brand text-white border-transparent shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-slate-400" /> Attachments
              </p>
              {!isEdit && (
                <p className="text-xs text-slate-400 mb-3">Save article first to upload files</p>
              )}
              {article?.attachments?.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{a.original_name}</p>
                    <p className="text-xs text-slate-400">{formatFileSize(a.file_size)}</p>
                  </div>
                  <button onClick={() => {
                    filesApi.download(a.id).then(({ data }) => {
                      const url = URL.createObjectURL(data)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = a.original_name
                      link.click()
                    })
                  }} className="text-xs text-indigo-600 hover:underline shrink-0">Download</button>
                </div>
              ))}
              {isEdit && (
                <label className="mt-3 flex items-center gap-2 cursor-pointer text-sm text-indigo-600 hover:text-indigo-800">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload file'}
                  <input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={uploading} />
                </label>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
