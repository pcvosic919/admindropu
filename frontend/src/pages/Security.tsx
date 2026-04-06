import { useQuery } from '@tanstack/react-query'
import {
  getSecurityPosture, getExchangeSecurity, getSharePointSecurity,
  getTeamsSecurity, getSecureScore
} from '../services/api'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { Shield, Mail, Database, Users, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

function MetricCard({ label, value, sub, good }: { label: string; value: string | number; sub?: string; good?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className={clsx('text-xl font-bold', good === undefined ? 'text-gray-800' : good ? 'text-green-600' : 'text-red-600')}>{value}</div>
      <div className="text-xs font-medium text-gray-700 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function ServiceCard({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={clsx('flex items-center gap-3 px-4 py-3 border-b border-gray-100', color)}>
        <Icon className="w-5 h-5" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export default function Security() {
  const { data: posture, isLoading: loadingPosture } = useQuery({ queryKey: ['posture'], queryFn: getSecurityPosture })
  const { data: exchange, isLoading: loadingExchange } = useQuery({ queryKey: ['exchange'], queryFn: getExchangeSecurity })
  const { data: sharepoint } = useQuery({ queryKey: ['sharepoint'], queryFn: getSharePointSecurity })
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: getTeamsSecurity })
  const { data: score } = useQuery({ queryKey: ['secure-score'], queryFn: getSecureScore })

  if (loadingPosture || loadingExchange) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" /><span className="text-gray-500">Loading security data...</span>
    </div>
  )

  const gaugeData = [
    { name: 'Score', value: score?.current ?? 68, fill: (score?.current ?? 0) >= 80 ? '#22c55e' : (score?.current ?? 0) >= 60 ? '#0078D4' : '#ef4444' },
  ]

  const incomplete = score?.recommendations?.filter((r: any) => r.status === 'Incomplete') ?? []
  const complete = score?.recommendations?.filter((r: any) => r.status === 'Complete') ?? []

  return (
    <div className="p-6 space-y-5">
      {/* Secure Score + Score Trend */}
      <div className="grid grid-cols-3 gap-4">
        {/* Gauge */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Microsoft Secure Score</h3>
          <div className="relative w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="60%"
                outerRadius="100%"
                startAngle={180}
                endAngle={0}
                data={[{ value: score?.current ?? 68, fill: '#0078D4' }]}
              >
                <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#f3f4f6' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
              <div className="text-4xl font-extrabold text-gray-900">{score?.current ?? 68}</div>
              <div className="text-xs text-gray-400">out of 100</div>
            </div>
          </div>
          <div className="text-center mt-2">
            <div className="text-xs text-gray-500">Industry avg: <span className="font-semibold">{score?.comparisonToSimilarCompanies ?? 72}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 w-full">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{complete.length}</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{incomplete.length}</div>
              <div className="text-xs text-gray-500">Incomplete</div>
            </div>
          </div>
        </div>

        {/* Score Trend */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Secure Score Trend (7 Days)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={score?.trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[55, 80]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="score" stroke="#0078D4" strokeWidth={2.5} dot={{ r: 3 }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
          {/* Posture quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{posture?.mfa_coverage ?? 0}%</div>
              <div className="text-xs text-gray-500">MFA Coverage</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-ms-blue">{posture?.conditional_access_coverage ?? 0}%</div>
              <div className="text-xs text-gray-500">CA Coverage</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{posture?.dlp_policies_active ?? 0}</div>
              <div className="text-xs text-gray-500">Active DLP Policies</div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Cards Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Exchange */}
        <ServiceCard title="Exchange Online" icon={Mail} color="bg-blue-50 text-blue-700">
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Malware Blocked" value={exchange?.malwareDetected ?? 0} good={false} />
            <MetricCard label="Phishing Blocked" value={exchange?.phishingBlocked ?? 0} />
            <MetricCard label="Spam Filtered" value={exchange?.spamFiltered ?? 0} />
            <MetricCard label="DLP Matches" value={exchange?.dlpPolicyMatches ?? 0} good={exchange?.dlpPolicyMatches === 0} />
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-xs font-semibold text-gray-600 mb-1">Key Policies</div>
            {exchange?.policies?.map((p: any) => (
              <div key={p.name} className="flex items-center gap-2 text-xs text-gray-600">
                {p.enabled
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                <span className={p.enabled ? '' : 'text-red-500'}>{p.name}</span>
              </div>
            ))}
          </div>
        </ServiceCard>

        {/* SharePoint */}
        <ServiceCard title="SharePoint Online" icon={Database} color="bg-green-50 text-green-700">
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="External Shares" value={sharepoint?.sitesWithExternalSharing ?? 0} good={false} />
            <MetricCard label="Anonymous Links" value={sharepoint?.anonymousLinks ?? 0} good={false} />
            <MetricCard label="Sensitive Exposed" value={sharepoint?.sensitiveFilesExposed ?? 0} good={(sharepoint?.sensitiveFilesExposed ?? 0) === 0} />
            <MetricCard label="External Users" value={sharepoint?.externalUsersWithAccess ?? 0} />
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="text-xs font-semibold text-gray-600 mb-1">Sharing Settings</div>
            {sharepoint?.sharingPolicies && Object.entries(sharepoint.sharingPolicies).map(([k, v]) => (
              <div key={k} className="flex items-start gap-2 text-xs text-gray-600">
                {typeof v === 'boolean'
                  ? (v ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />)
                  : <span className="w-3.5 h-3.5 flex-shrink-0" />}
                <span className="break-all">{k.replace(/([A-Z])/g, ' $1').trim()}: <span className="font-medium">{String(v)}</span></span>
              </div>
            ))}
          </div>
        </ServiceCard>

        {/* Teams */}
        <ServiceCard title="Microsoft Teams" icon={Users} color="bg-purple-50 text-purple-700">
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="Teams w/ Guests" value={teams?.teamsWithGuests ?? 0} />
            <MetricCard label="Unowned Teams" value={teams?.unownedTeams ?? 0} good={(teams?.unownedTeams ?? 0) === 0} />
            <MetricCard label="Archive Candidates" value={teams?.archiveCandidates ?? 0} />
            <MetricCard label="Sensitive Teams" value={teams?.sensitiveTeams ?? 0} />
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-xs font-semibold text-gray-600 mb-1">Access Policies</div>
            {teams?.policies && Object.entries(teams.policies).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-xs text-gray-600">
                {typeof v === 'boolean'
                  ? (v ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />)
                  : null}
                <span>{k.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))}
          </div>
        </ServiceCard>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Security Recommendations</h3>
          <span className="text-xs text-gray-400">{incomplete.length} items to improve</span>
        </div>
        <div className="divide-y divide-gray-50">
          {score?.recommendations?.map((r: any) => (
            <div key={r.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              {r.status === 'Complete'
                ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                : <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">{r.title}</div>
                <div className="text-xs text-gray-400">{r.service}</div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={clsx(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  r.impact === 'High' ? 'bg-red-100 text-red-700' : r.impact === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                )}>{r.impact} Impact</span>
                <span className="text-xs text-ms-blue font-semibold">+{r.points} pts</span>
                <span className={clsx(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  r.status === 'Complete' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                )}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Events Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Recent Security Events</h3>
        </div>
        <div className="p-4 space-y-3">
          {posture?.recent_events?.map((evt: any, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <div className={clsx(
                'w-2 h-2 rounded-full flex-shrink-0 mt-1.5',
                evt.type === 'positive' ? 'bg-green-500' : evt.type === 'warning' ? 'bg-orange-400' : 'bg-ms-blue'
              )} />
              <div className="flex-1">
                <div className="text-sm text-gray-700">{evt.event}</div>
                <div className="text-xs text-gray-400 mt-0.5">{new Date(evt.timestamp).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
