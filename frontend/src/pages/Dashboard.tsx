import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, type Alert } from '../services/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  Users, Bell, Shield, CreditCard, TrendingUp, AlertTriangle,
  UserX, UserCheck, Clock, CheckCircle2, RefreshCw
} from 'lucide-react'
import clsx from 'clsx'
import { useLanguage } from '../contexts/LanguageContext'

function SeverityBadge({ severity }: { severity: string }) {
  const cls = {
    Critical: 'bg-red-100 text-red-700 border border-red-200',
    High: 'bg-orange-100 text-orange-700 border border-orange-200',
    Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    Low: 'bg-green-100 text-green-700 border border-green-200',
  }[severity] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', cls)}>
      {severity}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls = {
    Open: 'bg-red-50 text-red-600',
    Investigating: 'bg-orange-50 text-orange-600',
    Closed: 'bg-green-50 text-green-600',
  }[status] ?? 'bg-gray-50 text-gray-600'
  return (
    <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', cls)}>
      {status}
    </span>
  )
}

function KpiCard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string; value: string | number; sub?: string; icon: any; color: string; trend?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={clsx('p-3 rounded-xl flex-shrink-0', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
        {trend && (
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" /> {trend}
          </div>
        )}
      </div>
    </div>
  )
}

function ModuleStatusCard({ name, code, status, alerts, statusLabel, alertsLabel }: {
  name: string; code: string; status: string; alerts: number; statusLabel: string; alertsLabel: string
}) {
  const statusColor = status === 'Active' ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white bg-ms-blue px-2 py-0.5 rounded">{code}</span>
          <span className="text-sm font-semibold text-gray-800">{name}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">{alerts}{alertsLabel}</div>
      </div>
      <span className={clsx('text-xs font-semibold px-2 py-1 rounded-full', statusColor)}>{statusLabel}</span>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useLanguage()
  const d = t.dashboard

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardSummary,
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>{t.common.loading}</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>{t.common.error}</p>
          <button onClick={() => refetch()} className="mt-3 px-4 py-2 bg-ms-blue text-white rounded-lg text-sm hover:bg-ms-blue-dark">{t.common.retry}</button>
        </div>
      </div>
    )
  }

  const modules = [
    { code: 'M01', name: 'Identity & Access', status: 'Active', alerts: data.critical_alerts },
    { code: 'M02', name: 'Exchange Security', status: 'Active', alerts: 3 },
    { code: 'M03', name: 'SharePoint Security', status: 'Active', alerts: 2 },
    { code: 'M04', name: 'Teams Security', status: 'Active', alerts: 1 },
    { code: 'M11', name: 'Account Audit', status: 'Active', alerts: 0 },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{d.title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{d.lastUpdated}{new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm text-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> {d.refresh}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label={d.totalUsers} value={data.total_users} sub={`${data.guest_users} ${d.guests} · ${data.disabled_users} ${d.disabled}`} icon={Users} color="bg-ms-blue" />
        <KpiCard label={d.activeAlerts} value={data.open_alerts} sub={`${data.critical_alerts} ${d.critical}`} icon={Bell} color="bg-red-500" />
        <KpiCard label={d.secureScore} value={`${data.secure_score}/100`} sub="Microsoft Secure Score" icon={Shield} color="bg-green-500" trend={`+1 ${d.thisWeek}`} />
        <KpiCard label={d.licenseUtil} value={`${data.license_utilization}%`} sub={d.ofLicenses} icon={CreditCard} color="bg-purple-500" />
      </div>

      {/* Charts + Alerts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Activity Trend Chart */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{d.trend}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.activity_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="signIns" stroke="#0078D4" strokeWidth={2} dot={false} name={d.signIns} />
              <Line type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} dot={false} name={t.nav.alerts} />
              <Line type="monotone" dataKey="guestActivity" stroke="#f97316" strokeWidth={2} dot={false} name={d.guestActivity} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{d.quickStats}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {d.mfaEnabled}</span>
                <span className="font-semibold text-gray-800">{data.mfa_rate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${data.mfa_rate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {d.secureScore}</span>
                <span className="font-semibold text-gray-800">{data.secure_score}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-ms-blue h-2 rounded-full" style={{ width: `${data.secure_score}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600"><Users className="w-4 h-4 text-blue-400" /> {d.guestUsers}</span>
                <span className="font-semibold text-gray-800">{data.guest_users}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600"><UserX className="w-4 h-4 text-red-400" /> {d.disabledAccounts}</span>
                <span className="font-semibold text-gray-800">{data.disabled_users}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4 text-orange-400" /> {d.inactive90}</span>
                <span className="font-semibold text-gray-800">{data.inactive_users}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600"><CheckCircle2 className="w-4 h-4 text-green-400" /> {d.activeUsers}</span>
                <span className="font-semibold text-gray-800">{data.active_users}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{d.recentAlerts}</h3>
          <a href="/alerts" className="text-xs text-ms-blue hover:underline">{d.viewAll}</a>
        </div>
        <div className="divide-y divide-gray-50">
          {data.recent_alerts.map((alert: Alert) => (
            <div key={alert.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <SeverityBadge severity={alert.severity} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{alert.title}</div>
                <div className="text-xs text-gray-400">{alert.service} · {new Date(alert.triggeredAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</div>
              </div>
              <StatusBadge status={alert.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Module Status */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{d.moduleStatus}</h3>
        <div className="grid grid-cols-5 gap-3">
          {modules.map(m => (
            <ModuleStatusCard
              key={m.code}
              {...m}
              statusLabel={d.activeModule}
              alertsLabel={d.alertsCount}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
