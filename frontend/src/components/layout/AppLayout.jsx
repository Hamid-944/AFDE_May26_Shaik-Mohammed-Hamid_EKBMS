import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { motion } from 'framer-motion'
import { useLocation, Outlet } from 'react-router-dom'

const TITLES = {
  '/dashboard': 'Dashboard',
  '/articles': 'Articles',
  '/articles/new': 'New Article',
  '/search': 'Search',
  '/categories': 'Categories',
  '/tags': 'Tags',
  '/approvals': 'Approval Queue',
  '/users': 'User Management',
  '/reports': 'Reports & Analytics',
  '/profile': 'My Profile',
}

export function AppLayout() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] || (pathname.includes('/articles/') ? 'Article' : 'EKBMS')

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-[260px] flex flex-col min-h-screen">
        <Header title={title} />
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 p-6"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  )
}
