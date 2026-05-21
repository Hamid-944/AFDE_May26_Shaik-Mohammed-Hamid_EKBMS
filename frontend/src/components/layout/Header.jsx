import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Settings } from 'lucide-react'
import { searchApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { ROLE_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function Header({ title }) {
  const { user } = useAuthStore()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const navigate = useNavigate()
  const timer = useRef(null)

  const handleSearchInput = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timer.current)
    if (val.length >= 2) {
      timer.current = setTimeout(async () => {
        try {
          const { data } = await searchApi.suggestions(val)
          setSuggestions(data)
          setShowSuggestions(true)
        } catch { setSuggestions([]) }
      }, 300)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowSuggestions(false)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 sticky top-0 z-20 shadow-sm">
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      {/* Search */}
      <div className="relative w-72">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={query}
              onChange={handleSearchInput}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Quick search..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </form>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                onMouseDown={() => { navigate(`/search?q=${encodeURIComponent(s)}`); setShowSuggestions(false) }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User chip */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-200">
          <div className="w-7 h-7 gradient-brand rounded-lg flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name}</p>
            <p className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium w-fit', ROLE_COLORS[user?.role?.name] || 'bg-gray-100 text-gray-600')}>
              {user?.role?.name}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
