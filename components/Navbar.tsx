'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BarChart2, Clock, LogOut, Menu, User, X } from 'lucide-react'
import { useState } from 'react'

interface NavbarProps {
  userEmail: string
}

export function Navbar({ userEmail }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/analyze', label: 'Analyze', icon: <BarChart2 className="w-4 h-4" /> },
    { href: '/history', label: 'History', icon: <Clock className="w-4 h-4" /> },
    { href: '/profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  ]

  return (
    <header className="border-b border-turf-600 bg-turf-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link href="/analyze" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-flag rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight hidden sm:block">SwingAI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150
                ${pathname === link.href
                  ? 'bg-flag/15 text-flag'
                  : 'text-slate-400 hover:text-white hover:bg-turf-800'
                }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User + signout */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-slate-500 text-xs truncate max-w-[160px]">{userEmail}</span>
          <button onClick={handleSignOut} className="btn-ghost flex items-center gap-1.5 text-sm py-1.5">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="sm:hidden btn-ghost p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-turf-600 px-4 py-4 space-y-1 bg-turf-950">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${pathname === link.href
                  ? 'bg-flag/15 text-flag'
                  : 'text-slate-400 hover:text-white hover:bg-turf-800'
                }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-turf-700 mt-3">
            <p className="text-slate-500 text-xs px-4 mb-2 truncate">{userEmail}</p>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-turf-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
