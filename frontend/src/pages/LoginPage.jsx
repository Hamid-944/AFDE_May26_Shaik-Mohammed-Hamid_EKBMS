import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, BookOpen, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await login(form)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-brand flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/30"
              style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Enterprise Knowledge Base</h1>
          <p className="text-indigo-100 text-lg max-w-md leading-relaxed">
            Centralize, manage, and share organizational knowledge with your entire team efficiently.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            {[['500+', 'Articles'], ['50+', 'Categories'], ['100+', 'Users']].map(([n, l]) => (
              <div key={l} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-2xl font-bold">{n}</p>
                <p className="text-indigo-200 text-sm">{l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
            <div className="mb-8">
              <div className="w-12 h-12 gradient-brand rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200 lg:hidden">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-slate-500 mt-1">Sign in to your account to continue</p>
            </div>

            {/* Demo credentials hint */}
            <div className="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-700 mb-2">Demo Credentials — click to autofill</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { role: 'Admin',    email: 'admin@ekbms.com',    password: 'Admin@123',    color: 'bg-violet-100 text-violet-700 hover:bg-violet-200' },
                  { role: 'Author',   email: 'author@ekbms.com',   password: 'Author@123',   color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                  { role: 'Reviewer', email: 'reviewer@ekbms.com', password: 'Review@123',   color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
                  { role: 'Employee', email: 'employee@ekbms.com', password: 'Employee@123', color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
                ].map(({ role, email, password, color }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm({ email, password })}
                    className={`${color} rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer`}
                  >
                    <p className="text-xs font-semibold">{role}</p>
                    <p className="text-xs opacity-75 truncate">{email}</p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                icon={Mail}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                error={errors.email}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" loading={loading} className="w-full py-3 text-base" size="lg">
                Sign in
              </Button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Need an account?{' '}
              <Link to="/register" className="text-indigo-600 font-medium hover:text-indigo-800">
                Contact your admin
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
