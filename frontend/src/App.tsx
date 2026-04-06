import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Bell, Users, Shield, Search, Settings,
  ChevronDown, Menu, X, Building2, LogOut
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Alerts from './pages/Alerts'
import Identity from './pages/Identity'
import Security from './pages/Security'
import AccountAudit from './pages/AccountAudit'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'
import Login from './pages/Login'
import clsx from 'clsx'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { setSessionId } from './services/api'

const TENANTS = [
  { id: 'contoso', name: 'Contoso Ltd', domain: 'contoso.onmicrosoft.com' },
  { id: 'fabrikam', name: 'Fabrikam Inc', domain: 'fabrikam.onmicrosoft.com' },
  { id: 'adventure', name: 'Adventure Works', domain: 'adventureworks.onmicrosoft.com' },
]

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation()
  const { t } = useLanguage()
  const { user } = useAuth()
  const nav = t.nav

  const NAV_ITEMS = [
    { to: '/', label: nav.dashboard, icon: LayoutDashboard, exact: true },
    { to: '/reports', label: nav.reports, icon: FileText },
    { to: '/alerts', label: nav.alerts, icon: Bell },
    { to: '/identity', label: nav.identity, icon: Users },
    { to: '/security', label: nav.security, icon: Shield },
    { to: '/account-audit', label: nav.accountAudit, icon: Search },
    { to: '/settings', label: nav.settings, icon: Settings },
  ]

  const initials = user
    ? user.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : 'GA'

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen bg-sidebar text-white transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 bg-ms-blue rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold leading-tight text-white truncate">M365 Sentinel</div>
              <div className="text-xs text-blue-300 truncate">Platform</div>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded hover:bg-white/10 text-white/60 hover:text-white flex-shrink-0"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
          const isActive = exact
            ? location.pathname === to
            : location.pathname.startsWith(to) && to !== '/'
          return (
            <NavLink
              key={to}
              to={to}
              className={clsx(
                'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-ms-blue text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom user */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-ms-blue flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-white truncate">{user?.name ?? 'Global Admin'}</div>
              <div className="text-xs text-white/50 truncate">{user?.email ? user.email.split('@')[0] : 'admin@contoso'}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

function TopBar({ tenant, setTenant }: { tenant: typeof TENANTS[0]; setTenant: (t: typeof TENANTS[0]) => void }) {
  const [tenantOpen, setTenantOpen] = useState(false)
  const location = useLocation()
  const { t } = useLanguage()
  const { mode, user, logout } = useAuth()
  const nav = t.nav

  const NAV_ITEMS = [
    { to: '/', label: nav.dashboard, exact: true },
    { to: '/reports', label: nav.reports },
    { to: '/alerts', label: nav.alerts },
    { to: '/identity', label: nav.identity },
    { to: '/security', label: nav.security },
    { to: '/account-audit', label: nav.accountAudit },
    { to: '/settings', label: nav.settings },
  ]

  const pageTitle = NAV_ITEMS.find(n =>
    n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to) && n.to !== '/'
  )?.label ?? nav.dashboard

  const initials = user
    ? user.name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : 'GA'

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
      <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>

      <div className="ml-auto flex items-center gap-3">
        {/* Demo Mode Badge */}
        {mode === 'demo' && (
          <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full text-xs font-bold uppercase tracking-wide">
            Demo
          </span>
        )}

        {/* Tenant Selector */}
        <div className="relative">
          <button
            onClick={() => setTenantOpen(!tenantOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 transition-colors"
          >
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{tenant.name}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
          {tenantOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {TENANTS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTenant(t); setTenantOpen(false) }}
                  className={clsx(
                    'w-full flex flex-col items-start px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors',
                    t.id === tenant.id ? 'bg-blue-50 text-ms-blue' : 'text-gray-700'
                  )}
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-gray-400">{t.domain}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          title={t.topBar.notifications}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Avatar with user name */}
        <div className="flex items-center gap-2">
          {mode === 'authenticated' && user && (
            <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
          )}
          <div className="w-8 h-8 rounded-full bg-ms-blue flex items-center justify-center text-xs font-bold text-white cursor-pointer">
            {initials}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="登出 / Logout"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [tenant, setTenant] = useState(TENANTS[0])
  const [authError, setAuthError] = useState<string | null>(null)
  const { mode, setAuthenticated } = useAuth()

  // Handle OAuth callback: detect ?auth_success=true or ?auth_error in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth_success') === 'true') {
      // Store session ID from OAuth callback
      const sid = params.get('sid')
      if (sid) setSessionId(sid)

      fetch('http://localhost:8000/api/auth/me', {
        headers: sid ? { 'X-Session-Id': sid } : {},
      })
        .then(r => r.json())
        .then(data => {
          setAuthenticated({ name: data.name, email: data.email, tenantId: data.tenantId })
        })
        .catch(() => {
          setAuthenticated({ name: 'Microsoft Admin', email: 'admin@contoso.onmicrosoft.com', tenantId: 'contoso' })
        })
      const url = new URL(window.location.href)
      url.search = ''
      window.history.replaceState({}, '', url.toString())
    }
    const errParam = params.get('auth_error')
    if (errParam) {
      if (errParam === 'not_configured') {
        setAuthError('請先至「設定 → Microsoft 365 API」填入 Tenant ID 與 Client ID，再嘗試登入。')
      } else {
        setAuthError(`Microsoft 登入失敗：${errParam}`)
      }
      const url = new URL(window.location.href)
      url.search = ''
      window.history.replaceState({}, '', url.toString())
    }
  }, [setAuthenticated])

  if (mode === 'unauthenticated') {
    return <Login authError={authError} onClearError={() => setAuthError(null)} />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar tenant={tenant} setTenant={setTenant} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/identity" element={<Identity />} />
            <Route path="/security" element={<Security />} />
            <Route path="/account-audit" element={<AccountAudit />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}
