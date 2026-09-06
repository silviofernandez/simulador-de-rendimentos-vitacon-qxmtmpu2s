import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Calculator, BookmarkCheck, Database, LogOut, Menu, X, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function Layout() {
  const { user, logout, isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  const navItems = [
    { label: 'Simulador', path: '/', icon: Calculator },
    { label: 'Minhas Simulações', path: '/simulacoes', icon: BookmarkCheck },
    { label: 'Base de Dados', path: '/database', icon: Database },
  ]

  const isAuthPage = location.pathname === '/auth'

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F1] text-[#1F2A24]">
      {/* Top Navbar */}
      {!isAuthPage && (
        <header className="sticky top-0 z-40 w-full border-b border-[#E3DFD6] bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F6B4F] text-white shadow-md shadow-[#0F6B4F]/20 transition-transform group-hover:scale-105">
                <span className="font-bold text-lg tracking-wider">V</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base leading-tight tracking-tight text-[#1F2A24]">
                  Vitacon <span className="text-[#0F6B4F]">Rentabilidade</span>
                </span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-[#5E6E64]">
                  Studios & Smart Living
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#0F6B4F]/10 text-[#0F6B4F] font-semibold'
                        : 'text-[#5E6E64] hover:bg-black/5 hover:text-[#1F2A24]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>

            {/* Desktop User Info & Logout */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated && (
                <div className="flex items-center gap-2.5 rounded-full border border-[#E3DFD6] bg-neutral-50/80 px-3 py-1.5 shadow-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0F6B4F] text-xs font-semibold text-white">
                    {user?.name ? (
                      user.name.slice(0, 2).toUpperCase()
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex flex-col pr-1 text-left">
                    <span className="text-xs font-medium text-[#1F2A24] max-w-[120px] truncate">
                      {user?.name || user?.email || 'Investidor'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-7 w-7 rounded-full text-[#5E6E64] hover:bg-red-50 hover:text-[#C62828]"
                    title="Sair"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="h-10 w-10 text-[#1F2A24]"
                aria-label="Abrir menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer content */}
          <div className="fixed right-0 top-0 bottom-0 w-4/5 max-w-sm bg-white p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[#E3DFD6]">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F6B4F] text-white font-bold">
                    V
                  </div>
                  <span className="font-bold text-sm text-[#1F2A24]">Vitacon Rentabilidade</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-9 w-9 text-[#5E6E64]"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-[#0F6B4F] text-white font-semibold'
                          : 'text-[#1F2A24] hover:bg-neutral-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            </div>

            {isAuthenticated && (
              <div className="pt-6 border-t border-[#E3DFD6] flex flex-col gap-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F6B4F] text-sm font-semibold text-white">
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#1F2A24]">
                      {user?.name || 'Investidor'}
                    </span>
                    <span className="text-xs text-[#5E6E64]">{user?.email}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="w-full justify-center gap-2 border-red-200 text-[#C62828] hover:bg-red-50 hover:text-[#C62828]"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da Conta
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-6 pb-24 md:pb-8 animate-fade-in-up`}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (Fixed) */}
      {!isAuthPage && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E3DFD6] bg-white/95 backdrop-blur-md md:hidden">
          <div className="grid grid-cols-3 h-16">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? 'text-[#0F6B4F] font-semibold' : 'text-[#5E6E64]'
                  }`}
                >
                  <div
                    className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                      isActive ? 'bg-[#0F6B4F]/10' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] leading-none">{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      )}

      {/* Footer */}
      {!isAuthPage && (
        <footer className="mt-auto hidden md:block border-t border-[#E3DFD6] bg-white/50 py-4 text-center text-xs text-[#5E6E64]">
          <div className="mx-auto max-w-[1200px] px-6 flex justify-between items-center">
            <span>© {new Date().getFullYear()} Vitacon Rentabilidade • Studios & Smart Living</span>
            <span>Simulador baseado no modelo financeiro de rentabilidade</span>
          </div>
        </footer>
      )}
    </div>
  )
}
