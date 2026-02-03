'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { logout } from '@/app/actions/auth'

export default function Navbar({ user, notificationElement }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const links = [
    { href: '/dashboard', label: 'Ana Sayfa' },
    { href: user?.role === 'ADMIN' ? '/dashboard/reports/manager' : '/dashboard/reports/chef', label: 'Raporlar' },
    { href: '/dashboard/inventory', label: 'Depo' },
    { href: '/dashboard/orders', label: 'Siparişler' },
    { href: '/dashboard/bakim', label: 'Bakım' },
    { href: '/dashboard/lost-found', label: 'Kayıp Eşya' },
    { href: '/dashboard/finance/cash-expenses', label: 'Finans' },
  ]

  const isActive = (path) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true
    if (path !== '/dashboard' && pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50 shadow-2xl shadow-black/50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="group flex items-center gap-2 text-xl font-bold tracking-widest text-white decoration-none transition-all">
            <span className="w-8 h-8 rounded bg-gradient-to-br from-[#d4af37] to-[#8a701e] flex items-center justify-center text-black text-sm shadow-[0_0_15px_rgba(212,175,55,0.4)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.6)] transition-all">
              O
            </span>
            <span className="group-hover:text-[#d4af37] transition-colors duration-300 hidden sm:block">OTTOBITE</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors relative group py-2
                  ${isActive(link.href) ? 'text-[#d4af37]' : 'text-gray-400 hover:text-white'}`}
              >
                {link.label}
                <span className={`absolute -bottom-0 left-0 h-0.5 bg-[#d4af37] transition-all duration-300
                  ${isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications (passed as children/prop to avoid client/server issues if specific) */}
            {notificationElement}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* User Profile (Desktop) */}
            <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-white/10">
              <div className="text-right">
                <div className="text-sm font-bold text-white leading-none mb-1">{user?.fullName}</div>
                <div className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">{user?.role}</div>
              </div>
              <button onClick={() => logout()} className="text-xs font-medium text-gray-500 hover:text-red-400 border border-gray-800 hover:border-red-900/50 rounded px-3 py-1.5 transition-all bg-transparent hover:bg-red-900/10">
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium
                  ${isActive(link.href) ? 'bg-[#d4af37]/10 text-[#d4af37]' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/10 mt-4 pt-4">
              <div className="px-3 flex items-center justify-between">
                <div>
                  <div className="text-base font-medium text-white">{user?.fullName}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.role}</div>
                </div>
                <button onClick={() => logout()} className="text-sm font-medium text-red-400">Çıkış</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
