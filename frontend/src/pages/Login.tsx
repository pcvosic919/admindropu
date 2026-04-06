import { Shield, Play, AlertCircle, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

interface LoginProps {
  authError?: string | null
  onClearError?: () => void
}

export default function Login({ authError, onClearError }: LoginProps) {
  const auth = useAuth()

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-sidebar flex-col justify-center px-16">
        {/* Logo & Product Name */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-ms-blue rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-white leading-tight">M365 Sentinel</div>
            <div className="text-sm text-blue-300">Platform</div>
          </div>
        </div>

        {/* Tagline */}
        <h2 className="text-3xl font-bold text-white leading-snug mb-3">
          Microsoft 365<br />智慧管理與稽核平台
        </h2>
        <p className="text-blue-300 text-sm mb-10">
          Enterprise-grade security monitoring and compliance auditing for M365
        </p>

        {/* Feature Bullets */}
        <ul className="space-y-4">
          {[
            { icon: '📊', title: '統一儀表板', desc: 'Unified Dashboard — 一覽所有 M365 服務的安全狀態' },
            { icon: '🔔', title: '即時告警', desc: 'Real-time Alerts — 立即偵測異常活動與安全威脅' },
            { icon: '📋', title: '合規報表', desc: 'Compliance Reports — 自動生成稽核報表，符合法規要求' },
          ].map(f => (
            <li key={f.title} className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
              <div>
                <div className="text-white text-sm font-semibold">{f.title}</div>
                <div className="text-blue-300 text-xs mt-0.5">{f.desc}</div>
              </div>
            </li>
          ))}
        </ul>

        {/* Bottom decoration */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="text-xs text-white/30">
            Enterprise Security · Compliance Ready · Real-time Monitoring
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2 mb-6">
              <div className="w-9 h-9 bg-ms-blue rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800">M365 Sentinel</div>
                <div className="text-xs text-gray-400">Platform</div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1">M365 Sentinel Platform</h1>
            <p className="text-sm text-gray-500 mb-6">
              登入以開始管理您的 Microsoft 365 環境
            </p>

            {/* Auth error banner */}
            {authError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{authError}</span>
                <button onClick={onClearError} className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Microsoft Login Button */}
            <button
              onClick={() => auth.loginWithMicrosoft()}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-ms-blue text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm mb-4"
            >
              <MicrosoftIcon />
              使用 Microsoft 帳號登入
            </button>

            {/* Divider */}
            <div className="relative flex items-center my-5">
              <div className="flex-1 border-t border-gray-200" />
              <span className="mx-4 text-xs text-gray-400 bg-white px-1">或</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* Demo Mode Button */}
            <button
              onClick={() => auth.enterDemo()}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-lg text-sm font-semibold hover:border-ms-blue hover:text-ms-blue transition-colors"
            >
              <Play className="w-4 h-4" />
              體驗 Demo 模式
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Demo 模式使用模擬資料，無需 Microsoft 帳號
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 HowardAI_Studio · M365 Sentinel Platform v1.1.0
          </p>
        </div>
      </div>
    </div>
  )
}
