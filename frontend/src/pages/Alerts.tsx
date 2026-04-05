import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAlerts, updateAlertStatus, type Alert, type AlertStatus } from '../services/api'
import { Bell, X, RefreshCw, AlertTriangle, ChevronRight, Clock, MapPin, Monitor } from 'lucide-react'
import clsx from 'clsx'
import { useLanguage } from '../contexts/LanguageContext'

function SeverityBadge({ severity }: { severity: string }) {
  const cls = {
    Critical: 'bg-red-100 text-red-700 border border-red-200',
    High: 'bg-orange-100 text-orange-700 border border-orange-200',
    Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    Low: 'bg-green-100 text-green-700 border border-green-200',
  }[severity] ?? 'bg-gray-100 text-gray-600'
  return <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', cls)}>{severity}</span>
}

function StatusBadge({ status }: { status: string }) {
  const cls = {
    Open: 'bg-red-50 text-red-600 border border-red-200',
    Investigating: 'bg-orange-50 text-orange-600 border border-orange-200',
    Closed: 'bg-green-50 text-green-600 border border-green-200',
  }[status] ?? 'bg-gray-50 text-gray-500'
  return <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', cls)}>{status}</span>
}

const SERVICES = ['All', 'Identity', 'Exchange', 'SharePoint', 'Teams', 'DLP', 'Defender', 'Compliance']
const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low']
const STATUSES = ['All', 'Open', 'Investigating', 'Closed']

export default function Alerts() {
  const { t } = useLanguage()
  const al = t.alerts
  const [statusFilter, setStatusFilter] = useState('All')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [serviceFilter, setServiceFilter] = useState('All')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alerts', statusFilter, severityFilter, serviceFilter],
    queryFn: () => getAlerts({
      status: statusFilter !== 'All' ? statusFilter : undefined,
      severity: severityFilter !== 'All' ? severityFilter : undefined,
      service: serviceFilter !== 'All' ? serviceFilter : undefined,
    }),
  })

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AlertStatus }) => updateAlertStatus(id, status),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      setSelectedAlert(result.alert)
    },
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" /><span className="text-gray-500">{t.common.loading}</span>
    </div>
  )

  if (error || !data) return (
    <div className="flex items-center justify-center h-64 text-red-500">
      <AlertTriangle className="w-5 h-5 mr-2" /><span>{t.common.error}</span>
    </div>
  )

  const { alerts, counts } = data

  const severityCountMap: Record<string, { key: string; label: string; color: string }> = {
    critical: { key: 'critical', label: 'Critical', color: 'text-red-600' },
    high: { key: 'high', label: 'High', color: 'text-orange-600' },
    medium: { key: 'medium', label: 'Medium', color: 'text-yellow-600' },
    low: { key: 'low', label: 'Low', color: 'text-green-600' },
  }

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto min-w-0">
        {/* Summary Bar */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {Object.entries(severityCountMap).map(([key, { label, color }]) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
              <div className={clsx('text-2xl font-bold', color)}>{counts[key] ?? 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label} Severity</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Status Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={clsx(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    statusFilter === s ? 'bg-white text-ms-blue shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  )}
                >
                  {s} {s !== 'All' ? `(${counts[s.toLowerCase()] ?? 0})` : `(${counts.total ?? 0})`}
                </button>
              ))}
            </div>

            {/* Severity */}
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-ms-blue"
            >
              {SEVERITIES.map(s => <option key={s}>{s}</option>)}
            </select>

            {/* Service */}
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-ms-blue"
            >
              {SERVICES.map(s => <option key={s}>{s}</option>)}
            </select>

            <button onClick={() => refetch()} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50">
              <RefreshCw className="w-3.5 h-3.5" /> {t.common.refresh}
            </button>
          </div>
        </div>

        {/* Alert Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{al.severity}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{al.title ?? 'Alert Title'}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{al.service}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{al.time}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{al.status}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {alerts.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No alerts found.</td></tr>
              )}
              {alerts.map(alert => (
                <tr
                  key={alert.id}
                  className={clsx('hover:bg-gray-50 transition-colors cursor-pointer', selectedAlert?.id === alert.id && 'bg-blue-50')}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{alert.title}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{alert.service}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(alert.triggeredAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={alert.status} /></td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedAlert && (
        <div className="w-96 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">{al.details}</h3>
            <button onClick={() => setSelectedAlert(null)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 flex-1 space-y-4">
            {/* Title & Badges */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <SeverityBadge severity={selectedAlert.severity} />
                <StatusBadge status={selectedAlert.status} />
              </div>
              <h4 className="text-base font-bold text-gray-900">{selectedAlert.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{selectedAlert.description}</p>
            </div>

            {/* Meta */}
            <div className="space-y-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400">{al.service}:</span>
                <span className="font-medium">{selectedAlert.service}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400">{al.time}:</span>
                <span className="font-medium">{new Date(selectedAlert.triggeredAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400">{al.affectedUser}:</span>
                <span className="font-medium truncate">{selectedAlert.affectedUser}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400">{al.location}:</span>
                <span className="font-medium">{selectedAlert.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400">Source IP:</span>
                <span className="font-mono font-medium">{selectedAlert.sourceIp}</span>
              </div>
            </div>

            {/* Recommended Actions */}
            <div>
              <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Recommended Actions</h5>
              <ul className="space-y-1.5">
                {selectedAlert.recommendedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-4 h-4 rounded-full bg-ms-blue text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            {/* Status Update */}
            <div>
              <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Update Status</h5>
              <div className="flex gap-2">
                {(['Open', 'Investigating', 'Closed'] as AlertStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => mutation.mutate({ id: selectedAlert.id, status: s })}
                    disabled={mutation.isPending || selectedAlert.status === s}
                    className={clsx(
                      'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      selectedAlert.status === s
                        ? 'bg-ms-blue text-white border-ms-blue'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-ms-blue hover:text-ms-blue'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {mutation.isPending && <p className="text-xs text-gray-400 mt-1">Updating...</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
