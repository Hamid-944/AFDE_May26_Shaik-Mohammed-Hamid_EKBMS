import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Edit3, Trash2, FolderOpen, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { categoriesApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { PageLoader } from '@/components/ui/Spinner'

const ICON_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6']

function CategoryCard({ cat, onEdit, onDelete, isAdmin }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
      <Card hover className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
            style={{ backgroundColor: cat.color || '#6366f1' }}>
            {cat.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900">{cat.name}</p>
            {cat.description && <p className="text-xs text-slate-400 truncate">{cat.description}</p>}
            <p className="text-xs text-indigo-600 font-medium mt-0.5">{cat.article_count} articles</p>
          </div>
          {isAdmin && (
            <div className="flex gap-1.5 shrink-0">
              <Button size="icon" variant="ghost" onClick={() => onEdit(cat)}><Edit3 className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => onDelete(cat.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          )}
        </div>
        {cat.children?.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 border-slate-100 space-y-2">
            {cat.children.map((child) => (
              <div key={child.id} className="flex items-center gap-2 text-sm text-slate-600">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span>{child.name}</span>
                <span className="text-xs text-slate-400">({child.article_count})</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  )
}

export default function CategoriesPage() {
  const qc = useQueryClient()
  const { hasRole } = useAuthStore()
  const isAdmin = hasRole('Admin')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', parent_id: '', color: '#6366f1' })

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: () => categoriesApi.tree().then((r) => r.data),
  })
  const { data: flatCats } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (data) => editingCat ? categoriesApi.update(editingCat.id, data) : categoriesApi.create(data),
    onSuccess: () => {
      toast.success(editingCat ? 'Category updated' : 'Category created')
      qc.invalidateQueries(['categories'])
      qc.invalidateQueries(['categories-tree'])
      setModalOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => categoriesApi.delete(id),
    onSuccess: () => { toast.success('Category deleted'); qc.invalidateQueries(['categories']); qc.invalidateQueries(['categories-tree']) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Cannot delete'),
  })

  const openEdit = (cat) => {
    setEditingCat(cat)
    setForm({ name: cat.name, description: cat.description || '', parent_id: cat.parent_id?.toString() || '', color: cat.color || '#6366f1' })
    setModalOpen(true)
  }

  const openCreate = () => {
    setEditingCat(null)
    setForm({ name: '', description: '', parent_id: '', color: '#6366f1' })
    setModalOpen(true)
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-slate-500 text-sm">{flatCats?.length || 0} categories total</p>
        {isAdmin && (
          <Button onClick={openCreate}><Plus className="w-4 h-4" /> New Category</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {categories?.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} onEdit={openEdit} onDelete={(id) => { if (confirm('Delete category?')) deleteMutation.mutate(id) }} isAdmin={isAdmin} />
        ))}
      </div>

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editingCat ? 'Edit Category' : 'New Category'} size="sm">
        <div className="space-y-4">
          <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          <Select label="Parent category" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
            <option value="">None (top-level)</option>
            {flatCats?.filter((c) => c.id !== editingCat?.id).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Color</label>
            <div className="flex gap-2 flex-wrap">
              {ICON_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={saveMutation.isPending}
              onClick={() => {
                if (!form.name.trim()) { toast.error('Name required'); return }
                saveMutation.mutate({ name: form.name, description: form.description, parent_id: form.parent_id ? parseInt(form.parent_id) : null, color: form.color })
              }}>
              {editingCat ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
