import { useState, useEffect } from 'react'
import {
  Globe, Palette, Bell, ShieldCheck, Info,
  Check, ChevronRight, Cloud, Eye, EyeOff, Loader2,
  CheckCircle2, XCircle
} from 'lucide-react'
import clsx from 'clsx'
import { useLanguage, type Locale } from '../contexts/LanguageContext'

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5 text-ms-blue" />
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
    </div>
  )
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string
  desc?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={clsx('flex items-center justify-between py-3', disabled && 'opacity-50')}>
      <div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
        {desc && <div className="text-xs text-gray-400 mt-0.5">{desc}</div>}
      </div>
      <button
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
          checked ? 'bg-ms-blue' : 'bg-gray-200'
        )}
      >
        <span
          className={clsx(
            'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
      {children}
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  hint?: string
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ms-blue focus:border-transparent bg-white"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function SecretField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ms-blue focus:border-transparent bg-white"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const { locale, setLocale, t } = useLanguage()
  const s = t.settings

  const [notif, setNotif] = useState({ email: true, teams: true, digest: true })
  const [sec, setSec] = useState({ mfa: true, session: true, audit: true })
  const [saved, setSaved] = useState(false)

  // M365 API config state
  const [m365Config, setM365Config] = useState({
    tenant_id: '',
    client_id: '',
    client_secret: '',
    redirect_uri: 'http://localhost:8000/api/auth/callback',
  })
  const [apiSaved, setApiSaved] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Load existing M365 config on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/settings/m365')
      .then(r => r.json())
      .then(data => {
        setM365Config(prev => ({
          ...prev,
          tenant_id: data.tenant_id || '',
          client_id: data.client_id || '',
          client_secret: data.client_secret === '***' ? '' : (data.client_secret || ''),
          redirect_uri: data.redirect_uri || 'http://localhost:8000/api/auth/callback',
        }))
      })
      .catch(() => {/* silently fail if backend not running */})
  }, [])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleSaveApi = async () => {
    try {
      await fetch('http://localhost:8000/api/settings/m365', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m365Config),
      })
      setApiSaved(true)
      setTimeout(() => setApiSaved(false), 2500)
    } catch {
      // silently fail
    }
  }

  const handleTestConnection = async () => {
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('http://localhost:8000/api/settings/m365/test', { method: 'POST' })
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ success: false, message: 'Cannot reach backend server.' })
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{s.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{s.subtitle}</p>
      </div>

      {/* Language */}
      <Card>
        <SectionHeader icon={Globe} title={s.sections.language} />
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-gray-700">{s.language.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.language.desc}</div>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-4">
            {(['zh-TW', 'en'] as Locale[]).map(l => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                  locale === l
                    ? 'bg-ms-blue text-white border-ms-blue'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-ms-blue hover:text-ms-blue'
                )}
              >
                {l === 'zh-TW' ? (
                  <span className="flex items-center gap-1.5">
                    {locale === 'zh-TW' && <Check className="w-3.5 h-3.5" />}
                    {s.language.zhTW}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    {locale === 'en' && <Check className="w-3.5 h-3.5" />}
                    {s.language.en}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <SectionHeader icon={Palette} title={s.sections.appearance} />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-700">{s.theme.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.theme.desc}</div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-ms-blue text-white border border-ms-blue flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {s.theme.light}
            </button>
            <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-gray-400 border border-gray-200 cursor-not-allowed" disabled>
              {s.theme.dark}
            </button>
          </div>
        </div>
      </Card>

      {/* M365 API Configuration */}
      <Card>
        <SectionHeader icon={Cloud} title={s.m365.sectionTitle} />
        <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-ms-blue flex-shrink-0" />
          {s.m365.hint}
        </p>

        <InputField
          label={s.m365.tenantId}
          value={m365Config.tenant_id}
          onChange={v => setM365Config(c => ({ ...c, tenant_id: v }))}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <InputField
          label={s.m365.clientId}
          value={m365Config.client_id}
          onChange={v => setM365Config(c => ({ ...c, client_id: v }))}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <SecretField
          label={s.m365.clientSecret}
          value={m365Config.client_secret}
          onChange={v => setM365Config(c => ({ ...c, client_secret: v }))}
          placeholder="••••••••••••••••••••••••••••••••"
        />
        <InputField
          label={s.m365.redirectUri}
          value={m365Config.redirect_uri}
          onChange={v => setM365Config(c => ({ ...c, redirect_uri: v }))}
          placeholder="http://localhost:8000/api/auth/callback"
        />

        {/* Test Connection Result */}
        {testResult && (
          <div className={clsx(
            'flex items-start gap-2 p-3 rounded-lg text-sm mb-4',
            testResult.success
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          )}>
            {testResult.success
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <div>
              <div className="font-semibold">
                {testResult.success ? s.m365.connectionSuccess : s.m365.connectionFailed}
              </div>
              <div className="text-xs mt-0.5 opacity-80">{testResult.message}</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestConnection}
            disabled={testLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:border-ms-blue hover:text-ms-blue transition-colors disabled:opacity-50"
          >
            {testLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Cloud className="w-4 h-4" />}
            {s.m365.testConnection}
          </button>

          <button
            onClick={handleSaveApi}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              apiSaved
                ? 'bg-green-500 text-white'
                : 'bg-ms-blue text-white hover:bg-blue-700'
            )}
          >
            {apiSaved ? (
              <>
                <Check className="w-4 h-4" />
                {s.saved}
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4" />
                {s.m365.saveApi}
              </>
            )}
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <SectionHeader icon={Bell} title={s.sections.notifications} />
        <div className="divide-y divide-gray-100">
          <ToggleRow
            label={s.notifications.email}
            desc={s.notifications.emailDesc}
            checked={notif.email}
            onChange={v => setNotif(n => ({ ...n, email: v }))}
          />
          <ToggleRow
            label={s.notifications.teams}
            desc={s.notifications.teamsDesc}
            checked={notif.teams}
            onChange={v => setNotif(n => ({ ...n, teams: v }))}
          />
          <ToggleRow
            label={s.notifications.digest}
            desc={s.notifications.digestDesc}
            checked={notif.digest}
            onChange={v => setNotif(n => ({ ...n, digest: v }))}
          />
        </div>
      </Card>

      {/* Security */}
      <Card>
        <SectionHeader icon={ShieldCheck} title={s.sections.security} />
        <div className="divide-y divide-gray-100">
          <ToggleRow
            label={s.security.mfa}
            desc={s.security.mfaDesc}
            checked={sec.mfa}
            onChange={v => setSec(s => ({ ...s, mfa: v }))}
          />
          <ToggleRow
            label={s.security.session}
            desc={s.security.sessionDesc}
            checked={sec.session}
            onChange={v => setSec(s => ({ ...s, session: v }))}
          />
          <ToggleRow
            label={s.security.audit}
            desc={s.security.auditDesc}
            checked={sec.audit}
            onChange={v => setSec(s => ({ ...s, audit: v }))}
            disabled
          />
        </div>
      </Card>

      {/* About */}
      <Card>
        <SectionHeader icon={Info} title={s.sections.about} />
        <div className="space-y-2 text-sm">
          {[
            [s.about.product, 'M365 Sentinel Platform'],
            [s.about.version, 'v1.1.0'],
            [s.about.build, '2026-03-28'],
            [s.about.vendor, 'HowardAI_Studio'],
            [s.about.license, 'Enterprise'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Save */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={handleSave}
          className={clsx(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
            saved
              ? 'bg-green-500 text-white'
              : 'bg-ms-blue text-white hover:bg-blue-700'
          )}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              {s.saved}
            </>
          ) : (
            <>
              <ChevronRight className="w-4 h-4" />
              {s.save}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
