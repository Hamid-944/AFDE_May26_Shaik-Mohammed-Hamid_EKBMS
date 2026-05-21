import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, Search, FolderOpen, Tag, Users,
  CheckSquare, BarChart2, BookOpen, LogOut, ChevronRight, Shield
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['Admin', 'Author', 'Reviewer', 'Employee'] },
  { to: '/articles', icon: FileText, label: 'Articles', roles: ['Admin', 'Author', 'Reviewer', 'Employee'] },
  { to: '/search', icon: Search, label: 'Search', roles: ['Admin', 'Author', 'Reviewer', 'Employee'] },
  { to: '/categories', icon: FolderOpen, label: 'Categories', roles: ['Admin', 'Author', 'Reviewer', 'Employee'] },
  { to: '/tags', icon: Tag, label: 'Tags', roles: ['Admin', 'Author'] },
  { to: '/approvals', icon: CheckSquare, label: 'Approvals', roles: ['Admin', 'Reviewer'] },
  { to: '/users', icon: Users, label: 'Users', roles: ['Admin'] },
  { to: '/reports', icon: BarChart2, label: 'Reports', roles: ['Admin'] },
]

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
          isActive
            ? 'gradient-brand text-white shadow-md shadow-indigo-200'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500')} />
          <span>{item.label}</span>
          {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/70" />}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const visible = navItems.filter((i) => i.roles.includes(user?.role?.name))

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-screen w-[var(--sidebar-width)] bg-white border-r border-slate-100 flex flex-col z-30 shadow-sm"
      style={{ '--sidebar-width': '260px' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">EKBMS</p>
            <p className="text-xs text-slate-400">Knowledge Base</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visible.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.role?.name}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
