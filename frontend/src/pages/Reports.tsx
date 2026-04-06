import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getReports, scheduleReport, generateReport, type Report } from '../services/api'
import {
  FileText, Search, Calendar, Download, Clock, RefreshCw, X, CheckCircle2
} from 'lucide-react'
import clsx from 'clsx'
import { useLanguage } from '../contexts/LanguageContext'

const CATEGORY_COLORS: Record<string, string> = {
  Identity: 'bg-blue-100 text-blue-700',
  Exchange: 'bg-cyan-100 text-cyan-700',
  SharePoint: 'bg-green-100 text-green-700',
  Teams: 'bg-purple-100 text-purple-700',
  DLP: 'bg-orange-100 text-orange-700',
  Security: 'bg-red-100 text-red-700',
  Compliance: 'bg-yellow-100 text-yellow-700',
  Devices: 'bg-gray-100 text-gray-700',
  CloudApps: 'bg-indigo-100 text-indigo-700',
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-600')}>
      {category}
    </span>
  )
}

interface ScheduleModalProps {
  report: Report
  onClose: () => void
}

function ScheduleModal({ report, onClose }: ScheduleModalProps) {
  const { t } = useLanguage()
  const rp = t.reports
  const [frequency, setFrequency] = useState('Weekly')
  const [time, setTime] = useState('09:00')
  const [recipients, setRecipients] = useState('admin@contoso.onmicrosoft.com')
  const [format, setFormat] = useState('Excel')
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: scheduleReport,
    onSuccess: () => setSuccess(true),
  })

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center" onClick={e => e.stopPropagation()}>
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">{rp.success_title}</h3>
          <p className="text-sm text-gray-500 mb-4">
            "{report.name}" {rp.success_desc_will} <strong>{frequency}</strong> {rp.success_desc_run} <strong>{format}</strong>.
          </p>
          <button onClick={onClose} className="px-6 py-2 bg-ms-blue text-white rounded-lg text-sm font-medium hover:bg-ms-blue-dark">
            {rp.done}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{rp.scheduleTitle}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-0.5">{report.name}</div>
            <CategoryBadge category={report.category} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">{rp.frequency}</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ms-blue">
                {[rp.daily, rp.weekly, rp.monthly].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">{rp.time}</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ms-blue" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">{rp.recipients}</label>
            <input
              type="text"
              value={recipients}
              onChange={e => setRecipients(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ms-blue"
              placeholder="email@domain.com"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">{rp.format}</label>
            <div className="flex gap-2">
              {['Excel', 'CSV', 'PDF'].map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                    format === f ? 'bg-ms-blue text-white border-ms-blue' : 'text-gray-600 border-gray-200 hover:border-ms-blue'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">{rp.cancel}</button>
          <button
            onClick={() => mutation.mutate({
              reportId: report.id,
              frequency,
              time,
              recipients: recipients.split(',').map(r => r.trim()),
              format,
            })}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-ms-blue text-white rounded-lg text-sm font-medium hover:bg-ms-blue-dark disabled:opacity-60"
          >
            {mutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            {rp.schedule}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const { t } = useLanguage()
  const rp = t.reports
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [schedulingReport, setSchedulingReport] = useState<Report | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['reports', search, category],
    queryFn: () => getReports({
      search: search || undefined,
      category: category !== 'All' ? category : undefined,
    }),
  })

  const handleGenerate = async (report: Report) => {
    setGenerating(report.id)
    try {
      await generateReport(report.id, report.name)
    } finally {
      setGenerating(null)
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" /><span className="text-gray-500">{t.common.loading}</span>
    </div>
  )

  const reports = data?.reports ?? []
  const categories = ['All', ...(data?.categories ?? [])]

  return (
    <div className="p-6 space-y-5">
      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={rp.search}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ms-blue"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                category === c ? 'bg-white text-ms-blue shadow-sm' : 'text-gray-600 hover:text-gray-800'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-ms-blue">{data?.total ?? 0}</div>
          <div className="text-xs text-gray-500 mt-0.5">{rp.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">{reports.filter((r: Report) => r.isScheduled).length}</div>
          <div className="text-xs text-gray-500 mt-0.5">{rp.scheduled}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-orange-600">{reports.filter((r: Report) => r.lastGenerated).length}</div>
          <div className="text-xs text-gray-500 mt-0.5">{rp.generated}</div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-3 gap-4">
        {reports.map((report: Report) => (
          <div key={report.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="p-4 flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-ms-blue flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-800 leading-tight">{report.name}</span>
                </div>
                {report.isScheduled && (
                  <span className="flex-shrink-0 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">{rp.scheduled_badge}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{report.description}</p>
              <CategoryBadge category={report.category} />
              {report.lastGenerated && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {new Date(report.lastGenerated).toLocaleDateString('zh-TW')}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => handleGenerate(report)}
                disabled={generating === report.id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ms-blue border border-ms-blue rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-60"
              >
                {generating === report.id
                  ? <><RefreshCw className="w-3 h-3 animate-spin" /> {rp.generating}</>
                  : <><Download className="w-3 h-3" /> {rp.generate}</>
                }
              </button>
              <button
                onClick={() => setSchedulingReport(report)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-3 h-3" /> {rp.schedule}
              </button>
            </div>
          </div>
        ))}
      </div>

      {schedulingReport && (
        <ScheduleModal report={schedulingReport} onClose={() => setSchedulingReport(null)} />
      )}
    </div>
  )
}
