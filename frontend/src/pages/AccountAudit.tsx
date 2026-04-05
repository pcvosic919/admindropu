import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  triggerScan, getScanResults, getTeamsMembers, getSpoMembers,
  getAuditGuests, getAuditGroups, getAuditLog, remediateAccounts,
  getTeamsPermissions, getSpoPermissions,
  type TeamsMember, type SpoMember, type Group, type AuditLog, type User,
  type TeamsPermission, type SpoPermission
} from '../services/api'
import { Search, RefreshCw, AlertTriangle, CheckCircle2, Play, Shield, Users, X, Filter, Lock, Globe, Share2, Eye, Edit3, ShieldOff } from 'lucide-react'
import clsx from 'clsx'

type AuditTab = 'teams' | 'spo' | 'guests' | 'groups' | 'pending' | 'auditlog' | 'teams-perm' | 'spo-perm'

function RiskBadge({ level }: { level: string }) {
  const cls = {
    Critical: 'bg-red-100 text-red-700 border border-red-200',
    High: 'bg-orange-100 text-orange-700 border border-orange-200',
    Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    Low: 'bg-green-100 text-green-700 border border-green-200',
  }[level] ?? 'bg-gray-100 text-gray-600'
  return <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', cls)}>{level}</span>
}

function PermBadge({ level }: { level: string }) {
  const cfg: Record<string, string> = {
    'Full Control': 'bg-red-100 text-red-700 border border-red-200',
    'Edit':         'bg-orange-100 text-orange-700 border border-orange-200',
    'Read':         'bg-green-100 text-green-700 border border-green-200',
    'Limited Access': 'bg-gray-100 text-gray-500 border border-gray-200',
  }
  return <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', cfg[level] ?? 'bg-gray-100 text-gray-500')}>{level}</span>
}

function SharingBadge({ scope, linkType, sharingWith }: { scope: string; linkType: string | null; sharingWith: string | null }) {
  if (scope === 'Anonymous') return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
      <ShieldOff className="w-3 h-3" /> 匿名連結 ({linkType})
    </span>
  )
  if (scope === 'SpecificExternal') return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
      <Share2 className="w-3 h-3" /> 外部帳號 {sharingWith ? `(${sharingWith.split('@')[0]})` : ''}
    </span>
  )
  if (scope === 'OrganizationInternal') return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-ms-blue border border-blue-200">
      <Globe className="w-3 h-3" /> 組織內部
    </span>
  )
  return <span className="text-xs text-gray-400">—</span>
}

function UserTypeBadge({ type }: { type: string }) {
  const cfg: Record<string, string> = {
    'Internal': 'bg-blue-50 text-blue-700',
    'Guest':    'bg-yellow-50 text-yellow-700',
    'External': 'bg-red-50 text-red-600',
  }
  return <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', cfg[type] ?? 'bg-gray-100 text-gray-500')}>{type}</span>
}

// Shared filter input components for column headers
function ColTextFilter({ value, onChange, placeholder = '篩選...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-ms-blue bg-white"
      />
      <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 pointer-events-none" />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

function ColSelectFilter({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-ms-blue bg-white"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

const RISK_OPTS = [
  { label: '全部風險', value: '' },
  { label: 'Critical', value: 'Critical' },
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' },
]

const DAYS_OPTS = [
  { label: '不限', value: '' },
  { label: '> 30 天', value: '30' },
  { label: '> 60 天', value: '60' },
  { label: '> 90 天', value: '90' },
  { label: '> 180 天', value: '180' },
]

const REMEDIATION_ACTIONS = [
  'Remove Guest', 'Disable Account', 'Remove from Team',
  'Remove from Group', 'Revoke License', 'Reset MFA',
]

// Th with filter row cell styling
function FilterTh({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={clsx('px-3 py-1.5 bg-blue-50/60', className)}>
      {children}
    </th>
  )
}

function ResultBar({ filtered, total, onClear, active }: { filtered: number; total: number; onClear: () => void; active: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
      <span className="flex items-center gap-1.5">
        <Filter className="w-3 h-3" />
        {active ? (
          <span>篩選結果：<strong className="text-gray-700">{filtered}</strong> / {total} 筆</span>
        ) : (
          <span>共 <strong className="text-gray-700">{total}</strong> 筆</span>
        )}
      </span>
      {active && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="w-3 h-3" /> 清除所有篩選
        </button>
      )}
    </div>
  )
}

export default function AccountAudit() {
  const [tab, setTab] = useState<AuditTab>('teams')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [remAction, setRemAction] = useState(REMEDIATION_ACTIONS[0])
  const [dryRun, setDryRun] = useState(true)
  const [remResult, setRemResult] = useState<any>(null)
  const [scanTime, setScanTime] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // ── Teams column filters ────────────────────────────────────────────────
  const [tUser, setTUser] = useState('')
  const [tTeam, setTTeam] = useState('')
  const [tRole, setTRole] = useState('')
  const [tType, setTType] = useState('')
  const [tDays, setTDays] = useState('')
  const [tRisk, setTRisk] = useState('')
  const [tReason, setTReason] = useState('')

  // ── SPO column filters ──────────────────────────────────────────────────
  const [sUser, setSUser] = useState('')
  const [sSite, setSSite] = useState('')
  const [sPerm, setSPerm] = useState('')
  const [sType, setSType] = useState('')
  const [sDays, setSDays] = useState('')
  const [sRisk, setSRisk] = useState('')

  // ── Guests column filters ───────────────────────────────────────────────
  const [gName, setGName] = useState('')
  const [gEmail, setGEmail] = useState('')
  const [gDays, setGDays] = useState('')
  const [gCountry, setGCountry] = useState('')
  const [gRisk, setGRisk] = useState('')
  const [gRedemption, setGRedemption] = useState('')

  // ── Groups column filters ───────────────────────────────────────────────
  const [grName, setGrName] = useState('')
  const [grType, setGrType] = useState('')
  const [grGuests, setGrGuests] = useState('')
  const [grInactive, setGrInactive] = useState('')
  const [grRisk, setGrRisk] = useState('')

  // ── Pending column filters ──────────────────────────────────────────────
  const [pUser, setPUser] = useState('')
  const [pSource, setPSource] = useState('')
  const [pDays, setPDays] = useState('')
  const [pRisk, setPRisk] = useState('')
  const [pReason, setPReason] = useState('')

  // ── Teams Permissions column filters ────────────────────────────────────
  const [tpUser, setTpUser] = useState('')
  const [tpTeam, setTpTeam] = useState('')
  const [tpRole, setTpRole] = useState('')
  const [tpType, setTpType] = useState('')
  const [tpPerm, setTpPerm] = useState('')
  const [tpCanShare, setTpCanShare] = useState('')
  const [tpRisk, setTpRisk] = useState('')

  // ── SPO Permissions column filters ──────────────────────────────────────
  const [spUser, setSpUser] = useState('')
  const [spSite, setSpSite] = useState('')
  const [spPerm, setSpPerm] = useState('')
  const [spType, setSpType] = useState('')
  const [spAssign, setSpAssign] = useState('')
  const [spSharing, setSpSharing] = useState('')
  const [spRisk, setSpRisk] = useState('')

  // Queries
  const { data: scanData } = useQuery({ queryKey: ['scan-results'], queryFn: getScanResults })
  const { data: teamsData } = useQuery({ queryKey: ['teams-members'], queryFn: () => getTeamsMembers() })
  const { data: spoData } = useQuery({ queryKey: ['spo-members'], queryFn: () => getSpoMembers() })
  const { data: guestsData } = useQuery({ queryKey: ['audit-guests'], queryFn: getAuditGuests })
  const { data: groupsData } = useQuery({ queryKey: ['audit-groups'], queryFn: getAuditGroups })
  const { data: auditLogData } = useQuery({ queryKey: ['audit-log'], queryFn: getAuditLog })
  const { data: teamsPermData } = useQuery({ queryKey: ['teams-permissions'], queryFn: getTeamsPermissions })
  const { data: spoPermData } = useQuery({ queryKey: ['spo-permissions'], queryFn: getSpoPermissions })

  const scanMutation = useMutation({
    mutationFn: triggerScan,
    onSuccess: (data) => {
      setScanTime(data.timestamp)
      queryClient.invalidateQueries({ queryKey: ['scan-results'] })
    },
  })

  const remMutation = useMutation({
    mutationFn: remediateAccounts,
    onSuccess: (data) => {
      setRemResult(data)
      if (!data.dryRun) {
        queryClient.invalidateQueries({ queryKey: ['audit-log'] })
        setSelectedUsers([])
      }
    },
  })

  const summary = scanData?.summary
  const allRiskyUsers = (teamsData?.members ?? []).filter(
    (m: TeamsMember) => m.riskLevel === 'Critical' || m.riskLevel === 'High'
  )

  // ── Filtered datasets ───────────────────────────────────────────────────

  const filteredTeams = useMemo(() => {
    let d: TeamsMember[] = teamsData?.members ?? []
    if (tUser) { const q = tUser.toLowerCase(); d = d.filter(m => m.displayName.toLowerCase().includes(q) || m.upn.toLowerCase().includes(q)) }
    if (tTeam) { const q = tTeam.toLowerCase(); d = d.filter(m => m.teamName.toLowerCase().includes(q)) }
    if (tRole) d = d.filter(m => m.role === tRole)
    if (tType) d = d.filter(m => m.userType === tType)
    if (tDays) d = d.filter(m => m.daysInactive > Number(tDays))
    if (tRisk) d = d.filter(m => m.riskLevel === tRisk)
    if (tReason) { const q = tReason.toLowerCase(); d = d.filter(m => m.riskReason.toLowerCase().includes(q)) }
    return d
  }, [teamsData, tUser, tTeam, tRole, tType, tDays, tRisk, tReason])

  const filteredSpo = useMemo(() => {
    let d: SpoMember[] = spoData?.members ?? []
    if (sUser) { const q = sUser.toLowerCase(); d = d.filter(m => m.displayName.toLowerCase().includes(q) || m.upn.toLowerCase().includes(q)) }
    if (sSite) { const q = sSite.toLowerCase(); d = d.filter(m => m.siteName.toLowerCase().includes(q) || m.siteUrl.toLowerCase().includes(q)) }
    if (sPerm) { const q = sPerm.toLowerCase(); d = d.filter(m => m.permissionLevel.toLowerCase().includes(q)) }
    if (sType === 'external') d = d.filter(m => m.userType === 'Guest')
    if (sType === 'internal') d = d.filter(m => m.userType === 'Member')
    if (sDays) d = d.filter(m => m.daysInactive > Number(sDays))
    if (sRisk) d = d.filter(m => m.riskLevel === sRisk)
    return d
  }, [spoData, sUser, sSite, sPerm, sType, sDays, sRisk])

  const filteredGuests = useMemo(() => {
    let d: User[] = guestsData?.guests ?? []
    if (gName) { const q = gName.toLowerCase(); d = d.filter(g => g.displayName.toLowerCase().includes(q)) }
    if (gEmail) { const q = gEmail.toLowerCase(); d = d.filter(g => g.userPrincipalName.toLowerCase().includes(q)) }
    if (gDays) d = d.filter(g => g.daysInactive > Number(gDays))
    if (gCountry) { const q = gCountry.toLowerCase(); d = d.filter(g => g.country?.toLowerCase().includes(q)) }
    if (gRisk) d = d.filter(g => g.riskLevel === gRisk)
    if (gRedemption === 'accepted') d = d.filter(g => g.accountEnabled)
    if (gRedemption === 'pending') d = d.filter(g => !g.accountEnabled)
    return d
  }, [guestsData, gName, gEmail, gDays, gCountry, gRisk, gRedemption])

  const filteredGroups = useMemo(() => {
    let d: Group[] = groupsData?.groups ?? []
    if (grName) { const q = grName.toLowerCase(); d = d.filter(g => g.name.toLowerCase().includes(q)) }
    if (grType) d = d.filter(g => g.type === grType)
    if (grGuests === 'yes') d = d.filter(g => g.guestCount > 0)
    if (grGuests === 'no') d = d.filter(g => g.guestCount === 0)
    if (grInactive === 'yes') d = d.filter(g => g.inactiveCount > 0)
    if (grInactive === 'no') d = d.filter(g => g.inactiveCount === 0)
    if (grRisk) d = d.filter(g => g.riskLevel === grRisk)
    return d
  }, [groupsData, grName, grType, grGuests, grInactive, grRisk])

  const filteredPending = useMemo(() => {
    let d: TeamsMember[] = allRiskyUsers
    if (pUser) { const q = pUser.toLowerCase(); d = d.filter(u => u.displayName.toLowerCase().includes(q) || u.upn.toLowerCase().includes(q)) }
    if (pSource) { const q = pSource.toLowerCase(); d = d.filter(u => u.teamName.toLowerCase().includes(q)) }
    if (pDays) d = d.filter(u => u.daysInactive > Number(pDays))
    if (pRisk) d = d.filter(u => u.riskLevel === pRisk)
    if (pReason) { const q = pReason.toLowerCase(); d = d.filter(u => u.riskReason.toLowerCase().includes(q)) }
    return d
  }, [allRiskyUsers, pUser, pSource, pDays, pRisk, pReason])

  const filteredTeamsPerm = useMemo(() => {
    let d: TeamsPermission[] = teamsPermData?.permissions ?? []
    if (tpUser) { const q = tpUser.toLowerCase(); d = d.filter(r => r.memberName.toLowerCase().includes(q) || r.memberUPN.toLowerCase().includes(q)) }
    if (tpTeam) { const q = tpTeam.toLowerCase(); d = d.filter(r => r.teamName.toLowerCase().includes(q)) }
    if (tpRole) d = d.filter(r => r.role === tpRole)
    if (tpType) d = d.filter(r => r.userType === tpType)
    if (tpPerm) d = d.filter(r => r.permissionLevel === tpPerm)
    if (tpCanShare === 'yes') d = d.filter(r => r.canShare)
    if (tpCanShare === 'no') d = d.filter(r => !r.canShare)
    if (tpRisk) d = d.filter(r => r.riskLevel === tpRisk)
    return d
  }, [teamsPermData, tpUser, tpTeam, tpRole, tpType, tpPerm, tpCanShare, tpRisk])

  const filteredSpoPerm = useMemo(() => {
    let d: SpoPermission[] = spoPermData?.permissions ?? []
    if (spUser) { const q = spUser.toLowerCase(); d = d.filter(r => r.memberName.toLowerCase().includes(q) || r.memberUPN.toLowerCase().includes(q)) }
    if (spSite) { const q = spSite.toLowerCase(); d = d.filter(r => r.siteName.toLowerCase().includes(q) || r.siteUrl.toLowerCase().includes(q)) }
    if (spPerm) d = d.filter(r => r.permissionLevel === spPerm)
    if (spType) d = d.filter(r => r.userType === spType)
    if (spAssign) d = d.filter(r => r.permissionType === spAssign)
    if (spSharing && spSharing !== '') d = d.filter(r => r.sharingScope === spSharing)
    if (spRisk) d = d.filter(r => r.riskLevel === spRisk)
    return d
  }, [spoPermData, spUser, spSite, spPerm, spType, spAssign, spSharing, spRisk])

  const teamsActive = !!(tUser || tTeam || tRole || tType || tDays || tRisk || tReason)
  const spoActive = !!(sUser || sSite || sPerm || sType || sDays || sRisk)
  const guestsActive = !!(gName || gEmail || gDays || gCountry || gRisk || gRedemption)
  const groupsActive = !!(grName || grType || grGuests || grInactive || grRisk)
  const pendingActive = !!(pUser || pSource || pDays || pRisk || pReason)
  const teamsPermActive = !!(tpUser || tpTeam || tpRole || tpType || tpPerm || tpCanShare || tpRisk)
  const spoPermActive = !!(spUser || spSite || spPerm || spType || spAssign || spSharing || spRisk)

  const tabs: { key: AuditTab; label: string; count?: number; group?: string }[] = [
    { key: 'teams', label: 'Teams 成員', count: teamsData?.total, group: '成員清查' },
    { key: 'spo', label: 'SPO 成員', count: spoData?.total, group: '成員清查' },
    { key: 'guests', label: 'Guest 帳號', count: guestsData?.total, group: '成員清查' },
    { key: 'groups', label: 'M365 群組', count: groupsData?.total, group: '成員清查' },
    { key: 'teams-perm', label: 'Teams 權限', count: teamsPermData?.total, group: '權限清查' },
    { key: 'spo-perm', label: 'SPO 權限', count: spoPermData?.total, group: '權限清查' },
    { key: 'pending', label: '待處理', count: allRiskyUsers.length, group: '動作' },
    { key: 'auditlog', label: '稽核紀錄', count: auditLogData?.total, group: '動作' },
  ]

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white bg-ms-blue px-2 py-0.5 rounded">M11</span>
            <h2 className="text-lg font-bold text-gray-900">Account Audit Module</h2>
          </div>
          {scanTime && <p className="text-xs text-gray-400 mt-0.5">Last scan: {new Date(scanTime).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>}
        </div>
        <button
          onClick={() => scanMutation.mutate()}
          disabled={scanMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-ms-blue text-white rounded-lg text-sm font-medium hover:bg-ms-blue-dark transition-colors disabled:opacity-60"
        >
          {scanMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {scanMutation.isPending ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total Scanned', value: summary?.totalScanned ?? '—', color: 'text-gray-800' },
          { label: 'Critical Risk', value: summary?.critical ?? '—', color: 'text-red-600' },
          { label: 'High Risk', value: summary?.high ?? '—', color: 'text-orange-600' },
          { label: 'Medium Risk', value: summary?.medium ?? '—', color: 'text-yellow-600' },
          { label: 'Low Risk', value: summary?.low ?? '—', color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
            <div className={clsx('text-2xl font-bold', color)}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5',
              tab === t.key ? 'border-ms-blue text-ms-blue' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={clsx('text-xs px-1.5 py-0.5 rounded-full', tab === t.key ? 'bg-blue-100 text-ms-blue' : 'bg-gray-100 text-gray-500')}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Teams Tab ── */}
      {tab === 'teams' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <ResultBar
            filtered={filteredTeams.length}
            total={teamsData?.total ?? 0}
            active={teamsActive}
            onClear={() => { setTUser(''); setTTeam(''); setTRole(''); setTType(''); setTDays(''); setTRisk(''); setTReason('') }}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Team</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Days Inactive</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Risk</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                </tr>
                <tr className="border-b border-blue-100">
                  <FilterTh><ColTextFilter value={tUser} onChange={setTUser} placeholder="搜尋用戶..." /></FilterTh>
                  <FilterTh><ColTextFilter value={tTeam} onChange={setTTeam} placeholder="搜尋 Team..." /></FilterTh>
                  <FilterTh>
                    <ColSelectFilter value={tRole} onChange={setTRole} options={[
                      { label: '全部角色', value: '' }, { label: 'Owner', value: 'Owner' }, { label: 'Member', value: 'Member' },
                    ]} />
                  </FilterTh>
                  <FilterTh>
                    <ColSelectFilter value={tType} onChange={setTType} options={[
                      { label: '全部類型', value: '' }, { label: 'Internal', value: 'Internal' }, { label: 'Guest', value: 'Guest' },
                    ]} />
                  </FilterTh>
                  <FilterTh><ColSelectFilter value={tDays} onChange={setTDays} options={DAYS_OPTS} /></FilterTh>
                  <FilterTh><ColSelectFilter value={tRisk} onChange={setTRisk} options={RISK_OPTS} /></FilterTh>
                  <FilterTh><ColTextFilter value={tReason} onChange={setTReason} placeholder="搜尋原因..." /></FilterTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTeams.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">無符合條件的資料</td></tr>
                ) : filteredTeams.map((m: TeamsMember) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-800">{m.displayName}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[160px]">{m.upn}</div>
                    </td>
                    <td className="px-3 py-3 text-gray-600 text-xs">{m.teamName}</td>
                    <td className="px-3 py-3">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', m.role === 'Owner' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600')}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">{m.userType}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">{m.daysInactive}d</td>
                    <td className="px-3 py-3"><RiskBadge level={m.riskLevel} /></td>
                    <td className="px-3 py-3 text-xs text-gray-400">{m.riskReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SPO Tab ── */}
      {tab === 'spo' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <ResultBar
            filtered={filteredSpo.length}
            total={spoData?.total ?? 0}
            active={spoActive}
            onClear={() => { setSUser(''); setSSite(''); setSPerm(''); setSType(''); setSDays(''); setSRisk('') }}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Site</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Permission</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Days Inactive</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Risk</th>
                </tr>
                <tr className="border-b border-blue-100">
                  <FilterTh><ColTextFilter value={sUser} onChange={setSUser} placeholder="搜尋用戶..." /></FilterTh>
                  <FilterTh><ColTextFilter value={sSite} onChange={setSSite} placeholder="搜尋站台..." /></FilterTh>
                  <FilterTh><ColTextFilter value={sPerm} onChange={setSPerm} placeholder="搜尋權限..." /></FilterTh>
                  <FilterTh>
                    <ColSelectFilter value={sType} onChange={setSType} options={[
                      { label: '全部類型', value: '' }, { label: 'Internal', value: 'internal' }, { label: 'External', value: 'external' },
                    ]} />
                  </FilterTh>
                  <FilterTh><ColSelectFilter value={sDays} onChange={setSDays} options={DAYS_OPTS} /></FilterTh>
                  <FilterTh><ColSelectFilter value={sRisk} onChange={setSRisk} options={RISK_OPTS} /></FilterTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSpo.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">無符合條件的資料</td></tr>
                ) : filteredSpo.map((m: SpoMember) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-800">{m.displayName}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[160px]">{m.upn}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-600">{m.siteName}</div>
                      <a href={m.siteUrl} className="text-xs text-ms-blue hover:underline truncate block max-w-[180px]" target="_blank" rel="noopener noreferrer">{m.siteUrl}</a>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">{m.permissionLevel}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{m.userType}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">{m.daysInactive}d</td>
                    <td className="px-3 py-3"><RiskBadge level={m.riskLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Guests Tab ── */}
      {tab === 'guests' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Guests', value: guestsData?.total ?? 0, color: 'text-ms-blue' },
              { label: 'Inactive 60+ Days', value: guestsData?.inactive ?? 0, color: 'text-orange-600' },
              { label: 'High Risk', value: guestsData?.high_risk ?? 0, color: 'text-red-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
                <div className={clsx('text-2xl font-bold', color)}>{value}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <ResultBar
              filtered={filteredGuests.length}
              total={guestsData?.total ?? 0}
              active={guestsActive}
              onClear={() => { setGName(''); setGEmail(''); setGDays(''); setGCountry(''); setGRisk(''); setGRedemption('') }}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Days Inactive</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Country</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Redemption</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Risk</th>
                  </tr>
                  <tr className="border-b border-blue-100">
                    <FilterTh><ColTextFilter value={gName} onChange={setGName} placeholder="搜尋名稱..." /></FilterTh>
                    <FilterTh><ColTextFilter value={gEmail} onChange={setGEmail} placeholder="搜尋 Email..." /></FilterTh>
                    <FilterTh><ColSelectFilter value={gDays} onChange={setGDays} options={DAYS_OPTS} /></FilterTh>
                    <FilterTh><ColTextFilter value={gCountry} onChange={setGCountry} placeholder="搜尋國家..." /></FilterTh>
                    <FilterTh>
                      <ColSelectFilter value={gRedemption} onChange={setGRedemption} options={[
                        { label: '全部', value: '' }, { label: 'Accepted', value: 'accepted' }, { label: 'Pending', value: 'pending' },
                      ]} />
                    </FilterTh>
                    <FilterTh><ColSelectFilter value={gRisk} onChange={setGRisk} options={RISK_OPTS} /></FilterTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredGuests.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">無符合條件的資料</td></tr>
                  ) : filteredGuests.map((g: User) => (
                    <tr key={g.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 font-medium text-gray-800">{g.displayName}</td>
                      <td className="px-3 py-3 text-xs text-gray-500 truncate max-w-[200px]">{g.userPrincipalName}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{g.daysInactive}d</td>
                      <td className="px-3 py-3 text-gray-600 text-xs">{g.country}</td>
                      <td className="px-3 py-3">
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full', g.accountEnabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                          {g.accountEnabled ? 'Accepted' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-3 py-3"><RiskBadge level={g.riskLevel} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Groups Tab ── */}
      {tab === 'groups' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <ResultBar
            filtered={filteredGroups.length}
            total={groupsData?.total ?? 0}
            active={groupsActive}
            onClear={() => { setGrName(''); setGrType(''); setGrGuests(''); setGrInactive(''); setGrRisk('') }}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Group Name</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Members</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Guests</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Inactive</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Last Activity</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Risk</th>
                </tr>
                <tr className="border-b border-blue-100">
                  <FilterTh><ColTextFilter value={grName} onChange={setGrName} placeholder="搜尋群組..." /></FilterTh>
                  <FilterTh>
                    <ColSelectFilter value={grType} onChange={setGrType} options={[
                      { label: '全部類型', value: '' }, { label: 'Microsoft 365', value: 'Microsoft 365' }, { label: 'Security', value: 'Security' }, { label: 'Distribution', value: 'Distribution' },
                    ]} />
                  </FilterTh>
                  <FilterTh />
                  <FilterTh>
                    <ColSelectFilter value={grGuests} onChange={setGrGuests} options={[
                      { label: '不限', value: '' }, { label: '含 Guest', value: 'yes' }, { label: '無 Guest', value: 'no' },
                    ]} />
                  </FilterTh>
                  <FilterTh>
                    <ColSelectFilter value={grInactive} onChange={setGrInactive} options={[
                      { label: '不限', value: '' }, { label: '含閒置', value: 'yes' }, { label: '無閒置', value: 'no' },
                    ]} />
                  </FilterTh>
                  <FilterTh />
                  <FilterTh><ColSelectFilter value={grRisk} onChange={setGrRisk} options={RISK_OPTS} /></FilterTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredGroups.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">無符合條件的資料</td></tr>
                ) : filteredGroups.map((g: Group) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-800">{g.name}</div>
                      <div className="text-xs text-gray-400">{g.owners.length ? g.owners.join(', ') : <span className="text-red-400">No Owner</span>}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">{g.type}</td>
                    <td className="px-3 py-3 text-center font-medium text-gray-700">{g.memberCount}</td>
                    <td className="px-3 py-3 text-center text-xs">
                      {g.guestCount > 0 ? <span className="text-orange-600 font-semibold">{g.guestCount}</span> : <span className="text-gray-400">0</span>}
                    </td>
                    <td className="px-3 py-3 text-center text-xs">
                      {g.inactiveCount > 0 ? <span className="text-red-600 font-semibold">{g.inactiveCount}</span> : <span className="text-gray-400">0</span>}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">{new Date(g.lastActivity).toLocaleDateString('zh-TW')}</td>
                    <td className="px-3 py-3"><RiskBadge level={g.riskLevel} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pending Actions Tab ── */}
      {tab === 'pending' && (
        <div className="space-y-4">
          {/* Remediation Panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-ms-blue" /> Remediation Panel
            </h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Action</label>
                <select value={remAction} onChange={e => setRemAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ms-blue">
                  {REMEDIATION_ACTIONS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} className="w-4 h-4 rounded text-ms-blue" />
                  <span className="text-sm text-gray-700">Dry Run (preview only)</span>
                </label>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => remMutation.mutate({ userIds: selectedUsers, action: remAction, dryRun })}
                  disabled={selectedUsers.length === 0 || remMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-ms-blue text-white rounded-lg text-sm font-medium hover:bg-ms-blue-dark disabled:opacity-50 transition-colors"
                >
                  {remMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {dryRun ? 'Preview' : 'Execute'} ({selectedUsers.length} selected)
                </button>
              </div>
            </div>
            {remResult && (
              <div className={clsx('rounded-lg p-4 text-sm', remResult.dryRun ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200')}>
                <div className="font-semibold mb-2 flex items-center gap-2">
                  {remResult.dryRun ? <AlertTriangle className="w-4 h-4 text-ms-blue" /> : <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  {remResult.dryRun ? 'Dry Run Preview' : 'Remediation Executed'}
                  <span className="text-gray-500 font-normal">— {remResult.processedCount} account(s)</span>
                </div>
                <div className="space-y-1">
                  {remResult.results?.map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={clsx('px-1.5 py-0.5 rounded font-semibold', r.status === 'Success' ? 'bg-green-100 text-green-700' : r.status === 'DryRun' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600')}>
                        {r.status}
                      </span>
                      <span>{r.displayName ?? r.userId}</span>
                      <span className="text-gray-400">→ {r.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pending table with column filters */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" /> Accounts Requiring Remediation
              </h4>
              <button onClick={() => setSelectedUsers(filteredPending.map((u: TeamsMember) => u.userId))} className="text-xs text-ms-blue hover:underline">
                Select All ({filteredPending.length})
              </button>
            </div>
            <ResultBar
              filtered={filteredPending.length}
              total={allRiskyUsers.length}
              active={pendingActive}
              onClear={() => { setPUser(''); setPSource(''); setPDays(''); setPRisk(''); setPReason('') }}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 py-2.5 w-10"></th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">User</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Source</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Days Inactive</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Risk</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                  </tr>
                  <tr className="border-b border-blue-100">
                    <FilterTh />
                    <FilterTh><ColTextFilter value={pUser} onChange={setPUser} placeholder="搜尋用戶..." /></FilterTh>
                    <FilterTh><ColTextFilter value={pSource} onChange={setPSource} placeholder="搜尋來源..." /></FilterTh>
                    <FilterTh><ColSelectFilter value={pDays} onChange={setPDays} options={DAYS_OPTS} /></FilterTh>
                    <FilterTh><ColSelectFilter value={pRisk} onChange={setPRisk} options={RISK_OPTS} /></FilterTh>
                    <FilterTh><ColTextFilter value={pReason} onChange={setPReason} placeholder="搜尋原因..." /></FilterTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPending.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">無符合條件的資料</td></tr>
                  ) : filteredPending.map((u: TeamsMember) => (
                    <tr key={u.id} className={clsx('hover:bg-gray-50 transition-colors', selectedUsers.includes(u.userId) && 'bg-blue-50')}>
                      <td className="px-3 py-3 text-center">
                        <input type="checkbox" checked={selectedUsers.includes(u.userId)}
                          onChange={e => setSelectedUsers(prev => e.target.checked ? [...prev, u.userId] : prev.filter(id => id !== u.userId))}
                          className="w-4 h-4 rounded text-ms-blue" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-800">{u.displayName}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[180px]">{u.upn}</div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">{u.teamName}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{u.daysInactive}d</td>
                      <td className="px-3 py-3"><RiskBadge level={u.riskLevel} /></td>
                      <td className="px-3 py-3 text-xs text-gray-400">{u.riskReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Teams Permissions Tab ── */}
      {tab === 'teams-perm' && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="grid grid-cols-6 gap-3">
            {[
              { label: 'Owner', value: teamsPermData?.summary.owners ?? '—', color: 'text-purple-700', icon: <Shield className="w-4 h-4 text-purple-400" /> },
              { label: '可讀寫 (Edit)', value: teamsPermData?.summary.editors ?? '—', color: 'text-orange-600', icon: <Edit3 className="w-4 h-4 text-orange-400" /> },
              { label: '唯讀 (Read)', value: teamsPermData?.summary.readers ?? '—', color: 'text-green-600', icon: <Eye className="w-4 h-4 text-green-400" /> },
              { label: 'Guest 帳號', value: teamsPermData?.summary.guests ?? '—', color: 'text-yellow-600', icon: <Users className="w-4 h-4 text-yellow-400" /> },
              { label: 'Critical', value: teamsPermData?.summary.critical ?? '—', color: 'text-red-600', icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
              { label: 'High Risk', value: teamsPermData?.summary.high ?? '—', color: 'text-orange-600', icon: <AlertTriangle className="w-4 h-4 text-orange-400" /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm flex items-center gap-3">
                {icon}
                <div>
                  <div className={clsx('text-xl font-bold', color)}>{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100">
            <span className="font-semibold text-gray-600">權限等級：</span>
            <PermBadge level="Full Control" /><span>完整控制（Owner）</span>
            <PermBadge level="Edit" /><span>可讀寫</span>
            <PermBadge level="Read" /><span>唯讀</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <ResultBar filtered={filteredTeamsPerm.length} total={teamsPermData?.total ?? 0} active={teamsPermActive}
              onClear={() => { setTpUser(''); setTpTeam(''); setTpRole(''); setTpType(''); setTpPerm(''); setTpCanShare(''); setTpRisk('') }} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">帳號</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Team</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">角色</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">帳號類型</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">權限等級</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">頻道存取</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">可分享</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">加入日期</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Risk</th>
                  </tr>
                  <tr className="border-b border-blue-100">
                    <FilterTh><ColTextFilter value={tpUser} onChange={setTpUser} placeholder="搜尋帳號..." /></FilterTh>
                    <FilterTh><ColTextFilter value={tpTeam} onChange={setTpTeam} placeholder="搜尋 Team..." /></FilterTh>
                    <FilterTh><ColSelectFilter value={tpRole} onChange={setTpRole} options={[
                      { label: '全部角色', value: '' }, { label: 'Owner', value: 'Owner' }, { label: 'Member', value: 'Member' }, { label: 'Guest', value: 'Guest' },
                    ]} /></FilterTh>
                    <FilterTh><ColSelectFilter value={tpType} onChange={setTpType} options={[
                      { label: '全部類型', value: '' }, { label: 'Internal', value: 'Internal' }, { label: 'Guest', value: 'Guest' }, { label: 'External', value: 'External' },
                    ]} /></FilterTh>
                    <FilterTh><ColSelectFilter value={tpPerm} onChange={setTpPerm} options={[
                      { label: '全部權限', value: '' }, { label: 'Full Control', value: 'Full Control' }, { label: 'Edit（讀寫）', value: 'Edit' }, { label: 'Read（唯讀）', value: 'Read' },
                    ]} /></FilterTh>
                    <FilterTh />
                    <FilterTh><ColSelectFilter value={tpCanShare} onChange={setTpCanShare} options={[
                      { label: '不限', value: '' }, { label: '可分享', value: 'yes' }, { label: '不可分享', value: 'no' },
                    ]} /></FilterTh>
                    <FilterTh />
                    <FilterTh><ColSelectFilter value={tpRisk} onChange={setTpRisk} options={RISK_OPTS} /></FilterTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTeamsPerm.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">無符合條件的資料</td></tr>
                  ) : filteredTeamsPerm.map((r: TeamsPermission) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-800">{r.memberName}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[180px]">{r.memberUPN}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm text-gray-700">{r.teamName}</div>
                        <div className="text-xs text-gray-400">{r.department}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                          r.role === 'Owner' ? 'bg-purple-100 text-purple-700' : r.role === 'Guest' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600')}>
                          {r.role}
                        </span>
                      </td>
                      <td className="px-3 py-3"><UserTypeBadge type={r.userType} /></td>
                      <td className="px-3 py-3"><PermBadge level={r.permissionLevel} /></td>
                      <td className="px-3 py-3 text-xs text-gray-500">{r.channelAccess}</td>
                      <td className="px-3 py-3 text-center">
                        {r.canShare
                          ? <span className="text-xs text-orange-600 font-medium flex items-center gap-1"><Share2 className="w-3 h-3" />可</span>
                          : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-400">{new Date(r.addedDate).toLocaleDateString('zh-TW')}</td>
                      <td className="px-3 py-3">
                        <RiskBadge level={r.riskLevel} />
                        {r.riskReason && <div className="text-xs text-gray-400 mt-0.5 max-w-[120px] truncate">{r.riskReason}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SPO Permissions Tab ── */}
      {tab === 'spo-perm' && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Full Control', value: spoPermData?.summary.full_control ?? '—', color: 'text-red-600' },
              { label: '可讀寫 (Edit)', value: spoPermData?.summary.editors ?? '—', color: 'text-orange-600' },
              { label: '唯讀 (Read)', value: spoPermData?.summary.readers ?? '—', color: 'text-green-600' },
              { label: '外部分享', value: spoPermData?.summary.external_shares ?? '—', color: 'text-orange-600' },
              { label: '匿名連結', value: spoPermData?.summary.anonymous_links ?? '—', color: 'text-red-600' },
              { label: '組織內分享', value: spoPermData?.summary.org_shares ?? '—', color: 'text-blue-600' },
              { label: 'Critical', value: spoPermData?.summary.critical ?? '—', color: 'text-red-600' },
              { label: 'High Risk', value: spoPermData?.summary.high ?? '—', color: 'text-orange-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
                <div className={clsx('text-xl font-bold', color)}>{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100">
            <span className="font-semibold text-gray-600">分享範圍：</span>
            <span className="flex items-center gap-1"><ShieldOff className="w-3 h-3 text-red-500" />匿名連結（最高風險）</span>
            <span className="flex items-center gap-1"><Share2 className="w-3 h-3 text-orange-500" />外部特定帳號</span>
            <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-blue-500" />組織內部</span>
            <span className="flex items-center gap-1 ml-4 font-semibold text-gray-600">指派方式：</span>
            <span>Direct（直接指派）</span><span>/</span><span>Group（群組）</span><span>/</span><span>Inherited（繼承）</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <ResultBar filtered={filteredSpoPerm.length} total={spoPermData?.total ?? 0} active={spoPermActive}
              onClear={() => { setSpUser(''); setSpSite(''); setSpPerm(''); setSpType(''); setSpAssign(''); setSpSharing(''); setSpRisk('') }} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">帳號</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">站台 (Site)</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">帳號類型</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">權限等級</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">指派方式</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">分享狀態</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">加入日期</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Risk</th>
                  </tr>
                  <tr className="border-b border-blue-100">
                    <FilterTh><ColTextFilter value={spUser} onChange={setSpUser} placeholder="搜尋帳號..." /></FilterTh>
                    <FilterTh><ColTextFilter value={spSite} onChange={setSpSite} placeholder="搜尋站台..." /></FilterTh>
                    <FilterTh><ColSelectFilter value={spType} onChange={setSpType} options={[
                      { label: '全部類型', value: '' }, { label: 'Internal', value: 'Internal' }, { label: 'Guest', value: 'Guest' }, { label: 'External', value: 'External' },
                    ]} /></FilterTh>
                    <FilterTh><ColSelectFilter value={spPerm} onChange={setSpPerm} options={[
                      { label: '全部權限', value: '' }, { label: 'Full Control', value: 'Full Control' }, { label: 'Edit（讀寫）', value: 'Edit' }, { label: 'Read（唯讀）', value: 'Read' }, { label: 'Limited Access', value: 'Limited Access' },
                    ]} /></FilterTh>
                    <FilterTh><ColSelectFilter value={spAssign} onChange={setSpAssign} options={[
                      { label: '全部', value: '' }, { label: 'Direct 直接指派', value: 'Direct' }, { label: 'Group 群組', value: 'Group' }, { label: 'Inherited 繼承', value: 'Inherited' },
                    ]} /></FilterTh>
                    <FilterTh><ColSelectFilter value={spSharing} onChange={setSpSharing} options={[
                      { label: '全部分享', value: '' }, { label: '未分享', value: 'None' }, { label: '組織內部', value: 'OrganizationInternal' }, { label: '外部特定帳號', value: 'SpecificExternal' }, { label: '匿名連結', value: 'Anonymous' },
                    ]} /></FilterTh>
                    <FilterTh />
                    <FilterTh><ColSelectFilter value={spRisk} onChange={setSpRisk} options={RISK_OPTS} /></FilterTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSpoPerm.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">無符合條件的資料</td></tr>
                  ) : filteredSpoPerm.map((r: SpoPermission) => (
                    <tr key={r.id} className={clsx('hover:bg-gray-50 transition-colors',
                      r.sharingScope === 'Anonymous' && 'bg-red-50/40',
                      r.sharingScope === 'SpecificExternal' && 'bg-orange-50/30')}>
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-800">{r.memberName}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[180px]">{r.memberUPN}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm text-gray-700">{r.siteName}</div>
                        <a href={r.siteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-ms-blue hover:underline truncate block max-w-[160px]">{r.siteUrl}</a>
                      </td>
                      <td className="px-3 py-3"><UserTypeBadge type={r.userType} /></td>
                      <td className="px-3 py-3"><PermBadge level={r.permissionLevel} /></td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-gray-600">{r.permissionType}</div>
                        {r.groupName && <div className="text-xs text-gray-400 truncate max-w-[120px]">{r.groupName}</div>}
                      </td>
                      <td className="px-3 py-3">
                        <SharingBadge scope={r.sharingScope} linkType={r.sharingLinkType} sharingWith={r.sharingWith} />
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-400">{new Date(r.addedDate).toLocaleDateString('zh-TW')}</td>
                      <td className="px-3 py-3">
                        <RiskBadge level={r.riskLevel} />
                        {r.riskReason && <div className="text-xs text-gray-400 mt-0.5 max-w-[120px] truncate">{r.riskReason}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Audit Log Tab ── */}
      {tab === 'auditlog' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Target User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Performed By</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(auditLogData?.logs ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">尚無稽核紀錄</td></tr>
              ) : (auditLogData?.logs ?? []).map((log: AuditLog) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{log.action}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 truncate max-w-[200px]">{log.targetUser}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.performedBy}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full',
                      log.status === 'Success' ? 'bg-green-100 text-green-700'
                        : log.status === 'DryRun' ? 'bg-blue-100 text-ms-blue'
                        : 'bg-red-100 text-red-600')}>
                      {log.isDryRun ? 'DryRun' : log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate">{log.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
