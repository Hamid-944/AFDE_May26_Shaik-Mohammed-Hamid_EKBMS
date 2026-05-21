import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Building, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { authApi, usersApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '', department: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => usersApi.roles().then((r) => r.data),
  })

  const validate = () => {
    const e = {}
    if (!form.name) e.name = 'Name is required'
    if (!form.email) e.email = 'Email is required'
    if (form.password.length < 6) e.password = 'Minimum 6 characters'
    if (!form.role_id) e.role_id = 'Select a role'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await authApi.register({ ...form, role_id: parseInt(form.role_id) })
      toast.success('Account created! Please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 gradient-brand rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Create account</h2>
              <p className="text-slate-500 text-sm">Join your organization's knowledge base</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" placeholder="John Smith" icon={User} value={form.name} onChange={set('name')} error={errors.name} />
            <Input label="Work email" type="email" placeholder="you@company.com" icon={Mail} value={form.email} onChange={set('email')} error={errors.email} />
            <Input label="Password" type="password" placeholder="Min. 6 characters" icon={Lock} value={form.password} onChange={set('password')} error={errors.password} />
            <Input label="Department" placeholder="e.g. Engineering, HR" icon={Building} value={form.department} onChange={set('department')} />
            <Select label="Role" value={form.role_id} onChange={set('role_id')} error={errors.role_id}>
              <option value="">Select your role</option>
              {rolesData?.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>

            <Button type="submit" loading={loading} className="w-full py-3 text-base mt-2" size="lg">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-800">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
