import { createContext, useContext, useState, ReactNode } from 'react'

export type AuthMode = 'unauthenticated' | 'demo' | 'authenticated'

interface AuthUser {
  name: string
  email: string
  tenantId: string
}

interface AuthContextType {
  mode: AuthMode
  user: AuthUser | null
  enterDemo: () => void
  logout: () => void
  loginWithMicrosoft: () => void
  setAuthenticated: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode>(() => {
    const saved = localStorage.getItem('m365-auth-mode')
    return (saved as AuthMode) || 'unauthenticated'
  })
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('m365-auth-user')
    return saved ? JSON.parse(saved) : null
  })

  const enterDemo = () => {
    setMode('demo')
    localStorage.setItem('m365-auth-mode', 'demo')
    const demoUser = { name: 'Demo Admin', email: 'admin@demo.onmicrosoft.com', tenantId: 'demo-tenant' }
    setUser(demoUser)
    localStorage.setItem('m365-auth-user', JSON.stringify(demoUser))
  }

  const setAuthenticated = (u: AuthUser) => {
    setMode('authenticated')
    setUser(u)
    localStorage.setItem('m365-auth-mode', 'authenticated')
    localStorage.setItem('m365-auth-user', JSON.stringify(u))
  }

  const logout = () => {
    // Notify backend to invalidate session
    const sid = localStorage.getItem('m365-session-id')
    if (sid) {
      fetch('http://localhost:8000/api/auth/logout', {
        method: 'POST',
        headers: { 'X-Session-Id': sid },
      }).catch(() => {})
    }
    setMode('unauthenticated')
    setUser(null)
    localStorage.removeItem('m365-auth-mode')
    localStorage.removeItem('m365-auth-user')
    localStorage.removeItem('m365-session-id')
  }

  const loginWithMicrosoft = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = 'http://localhost:8000/api/auth/login'
  }

  return (
    <AuthContext.Provider value={{ mode, user, enterDemo, logout, loginWithMicrosoft, setAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
