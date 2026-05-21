import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { UserPlus, Edit3, UserX, Shield, Search, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { usersApi, authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Spinner'
import { formatDate, ROLE_COLORS } from '@/lib/utils'

export default function UsersPage() {
  const { user: me } = useAuthStore()
  const qc = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '', department: '' })

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then((r) => r.data),
  })
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: () => usersApi.roles().then((r) => r.data) })

  const saveMutation = useMutation({
    mutationFn: (data) => editingUser
      ? usersApi.update(editingUser.id, data)
      : authApi.register(data),
    onSuccess: () => {
      toast.success(editingUser ? 'User updated' : 'User created')
      qc.invalidateQueries(['users'])
      setModalOpen(false)
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id) => usersApi.deactivate(id),
    onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries(['users']) },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const openCreate = () => {
    setEditingUser(null)
    setForm({ name: '', email: '', password: '', role_id: '', department: '' })
    setModalOpen(true)
  }

  const openEdit = (u) => {
    setEditingUser(u)
    setForm({ name: u.name, email: u.email, role_id: u.role?.id?.toString(), department: u.department || '', password: '' })
    setModalOpen(true)
  }

  const filtered = users?.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Input
          placeholder="Search users..."
          icon={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:w-72"
        />
        <Button onClick={openCreate}><UserPlus className="w-4 h-4" /> Add User</Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left text-xs font-semibold text-slate-500 px-6 py-3.5">User</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Role</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 hidden md:table-cell">Department</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5 hidden lg:table-cell">Joined</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {filtered?.map((u, i) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[u.role?.name] || 'bg-gray-100 text-gray-600'}`}>
                    {u.role?.name}
                  </span>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="text-sm text-slate-600">{u.department || '—'}</span>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <span className="text-xs text-slate-400">{formatDate(u.created_at)}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(u)}><Edit3 className="w-4 h-4" /></Button>
                    {u.id !== me?.id && u.is_active && (
                      <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-600"
                        onClick={() => { if (confirm(`Deactivate ${u.name}?`)) deactivateMutation.mutate(u.id) }}>
                        <UserX className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editingUser ? 'Edit User' : 'Add New User'} size="sm">
        <div className="space-y-4">
          <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" />
          {!editingUser && <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@company.com" />}
          {!editingUser && <Input label="Password *" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" />}
          <Select label="Role *" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
            <option value="">Select role</option>
            {roles?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Engineering" />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={saveMutation.isPending}
              onClick={() => {
                if (!form.name || !form.role_id) { toast.error('Fill required fields'); return }
                const payload = editingUser
                  ? { name: form.name, role_id: parseInt(form.role_id), department: form.department }
                  : { name: form.name, email: form.email, password: form.password, role_id: parseInt(form.role_id), department: form.department }
                saveMutation.mutate(payload)
              }}>
              {editingUser ? 'Update' : 'Create User'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
