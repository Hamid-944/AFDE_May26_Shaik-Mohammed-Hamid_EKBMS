import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Trash2, Tag as TagIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { tagsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageLoader } from '@/components/ui/Spinner'

export default function TagsPage() {
  const { hasRole } = useAuthStore()
  const isAdmin = hasRole('Admin')
  const qc = useQueryClient()
  const [newTag, setNewTag] = useState('')

  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (name) => tagsApi.create({ name }),
    onSuccess: () => { toast.success('Tag created'); qc.invalidateQueries(['tags']); setNewTag('') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => tagsApi.delete(id),
    onSuccess: () => { toast.success('Tag deleted'); qc.invalidateQueries(['tags']) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex gap-3">
        <Input
          placeholder="New tag name..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newTag.trim()) createMutation.mutate(newTag.trim()) }}
          className="flex-1"
        />
        <Button onClick={() => newTag.trim() && createMutation.mutate(newTag.trim())} loading={createMutation.isPending}>
          <Plus className="w-4 h-4" /> Add Tag
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        {tags?.map((tag, i) => (
          <motion.div
            key={tag.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <TagIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-sm font-medium text-slate-700">{tag.name}</span>
            {isAdmin && (
              <button
                onClick={() => { if (confirm(`Delete tag "${tag.name}"?`)) deleteMutation.mutate(tag.id) }}
                className="text-slate-300 hover:text-red-500 transition-colors ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {tags?.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <TagIcon className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p>No tags yet. Create one above!</p>
        </div>
      )}
    </div>
  )
}
