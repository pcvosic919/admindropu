import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Auth mode tracking — updated by App when auth mode changes
let _authMode: 'demo' | 'real' = 'demo'

export function setDemoMode(enabled: boolean) {
  _authMode = enabled ? 'demo' : 'real'
}

export function getSessionId(): string | null {
  return localStorage.getItem('m365-session-id')
}

export function setSessionId(sid: string | null) {
  if (sid) localStorage.setItem('m365-session-id', sid)
  else localStorage.removeItem('m365-session-id')
}

// Interceptor: attach X-Auth-Mode and X-Session-Id headers to every request
api.interceptors.request.use(config => {
  config.headers['X-Auth-Mode'] = _authMode
  const sid = getSessionId()
  if (sid) config.headers['X-Session-Id'] = sid
  return config
})

// ─── Types ────────────────────────────────────────────────────────────────

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low'
export type AlertStatus = 'Open' | 'Investigating' | 'Closed'

export interface User {
  id: string
  displayName: string
  userPrincipalName: string
  department: string
  jobTitle: string
  license: string
  lastSignIn: string
  daysInactive: number
  accountEnabled: boolean
  userType: 'Member' | 'Guest'
  mfaEnabled: boolean
  isAdmin: boolean
  adminRoles: string[]
  createdAt: string
  riskLevel: Severity
  country: string
}

export interface Alert {
  id: string
  title: string
  service: string
  severity: Severity
  status: AlertStatus
  description: string
  triggeredAt: string
  updatedAt: string
  affectedUser: string
  affectedUserId: string
  sourceIp: string
  location: string
  recommendedActions: string[]
  policyId: string
}

export interface AlertPolicy {
  id: string
  name: string
  description: string
  severity: Severity
  service: string
  enabled: boolean
  alertCount: number
  lastTriggered: string | null
  createdAt: string
}

export interface DashboardSummary {
  total_users: number
  active_users: number
  guest_users: number
  disabled_users: number
  open_alerts: number
  critical_alerts: number
  secure_score: number
  license_utilization: number
  mfa_rate: number
  inactive_users: number
  recent_alerts: Alert[]
  activity_trend: ActivityPoint[]
}

export interface ActivityPoint {
  date: string
  signIns: number
  alerts: number
  guestActivity: number
}

export interface License {
  name: string
  total: number
  assigned: number
  available: number
  costPerUser: number
}

export interface SecureScoreRec {
  id: string
  title: string
  impact: string
  points: number
  status: string
  service: string
}

export interface SecureScore {
  current: number
  maxScore: number
  comparisonToSimilarCompanies: number
  trend: { date: string; score: number }[]
  recommendations: SecureScoreRec[]
}

export interface Report {
  id: string
  name: string
  category: string
  description: string
  lastGenerated: string | null
  frequency: string | null
  format: string
  isScheduled: boolean
  nextRun: string | null
}

export interface TeamsMember {
  id: string
  userId: string
  displayName: string
  upn: string
  teamName: string
  role: string
  userType: string
  lastActivity: string
  daysInactive: number
  riskLevel: Severity
  riskReason: string
}

export interface SpoMember {
  id: string
  userId: string
  displayName: string
  upn: string
  siteName: string
  siteUrl: string
  permissionLevel: string
  userType: string
  lastActivity: string
  daysInactive: number
  riskLevel: Severity
}

export interface Group {
  id: string
  name: string
  type: string
  memberCount: number
  guestCount: number
  inactiveCount: number
  lastActivity: string
  riskLevel: Severity
  hasExternalMembers: boolean
  owners: string[]
}

export interface AuditLog {
  id: string
  timestamp: string
  action: string
  targetUser: string
  performedBy: string
  status: string
  isDryRun: boolean
  notes: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────

export const getDashboardSummary = () =>
  api.get<DashboardSummary>('/dashboard/summary').then(r => r.data)

// ─── Alerts ───────────────────────────────────────────────────────────────

export const getAlerts = (params?: { status?: string; severity?: string; service?: string }) =>
  api.get<{ alerts: Alert[]; counts: Record<string, number> }>('/alerts', { params }).then(r => r.data)

export const getAlert = (id: string) =>
  api.get<Alert>(`/alerts/${id}`).then(r => r.data)

export const updateAlertStatus = (id: string, status: AlertStatus) =>
  api.put<{ success: boolean; alert: Alert }>(`/alerts/${id}/status`, { status }).then(r => r.data)

export const getAlertPolicies = () =>
  api.get<{ policies: AlertPolicy[]; total: number; enabled: number }>('/alerts/policies').then(r => r.data)

// ─── Identity ─────────────────────────────────────────────────────────────

export const getUsers = (params?: { department?: string; userType?: string; accountEnabled?: boolean; search?: string }) =>
  api.get<{ users: User[]; total: number; departments: string[] }>('/identity/users', { params }).then(r => r.data)

export const getInactiveUsers = (days = 90) =>
  api.get<{ users: User[]; total: number; threshold_days: number; breakdown: Record<string, number> }>('/identity/inactive', { params: { days } }).then(r => r.data)

export const getMfaStatus = () =>
  api.get<{ total_users: number; mfa_enabled: number; mfa_disabled: number; mfa_rate: number; admins_without_mfa: User[]; users_without_mfa: User[] }>('/identity/mfa-status').then(r => r.data)

export const getLicenses = () =>
  api.get<{ licenses: License[]; summary: Record<string, number> }>('/identity/licenses').then(r => r.data)

export const getPrivileged = () =>
  api.get<{ admins: User[]; global_admins: User[]; total_admins: number; global_admin_count: number; recent_role_changes: any[] }>('/identity/privileged').then(r => r.data)

export const getGuests = () =>
  api.get<{ guests: User[]; total: number; inactive_guests: number; high_risk_guests: number }>('/identity/guests').then(r => r.data)

// ─── Security ─────────────────────────────────────────────────────────────

export const getSecurityPosture = () =>
  api.get('/security/posture').then(r => r.data)

export const getExchangeSecurity = () =>
  api.get('/security/exchange').then(r => r.data)

export const getSharePointSecurity = () =>
  api.get('/security/sharepoint').then(r => r.data)

export const getTeamsSecurity = () =>
  api.get('/security/teams').then(r => r.data)

export const getSecureScore = () =>
  api.get<SecureScore>('/security/secure-score').then(r => r.data)

// ─── Reports ──────────────────────────────────────────────────────────────

export const getReports = (params?: { category?: string; search?: string }) =>
  api.get<{ reports: Report[]; total: number; categories: string[] }>('/reports', { params }).then(r => r.data)

export const getReport = (id: string) =>
  api.get(`/reports/${id}`).then(r => r.data)

export const scheduleReport = (body: { reportId: string; frequency: string; time: string; recipients: string[]; format: string }) =>
  api.post('/reports/schedule', body).then(r => r.data)

// ─── Account Audit ────────────────────────────────────────────────────────

export const triggerScan = () =>
  api.post('/account-audit/scan').then(r => r.data)

export const getScanResults = () =>
  api.get('/account-audit/results').then(r => r.data)

export const getTeamsMembers = (params?: { riskLevel?: string; teamName?: string }) =>
  api.get<{ members: TeamsMember[]; total: number; riskBreakdown: Record<string, number> }>('/account-audit/teams-members', { params }).then(r => r.data)

export const getSpoMembers = (params?: { riskLevel?: string }) =>
  api.get<{ members: SpoMember[]; total: number; riskBreakdown: Record<string, number> }>('/account-audit/spo-members', { params }).then(r => r.data)

export const getAuditGuests = () =>
  api.get('/account-audit/guests').then(r => r.data)

export const getAuditGroups = () =>
  api.get<{ groups: Group[]; total: number; with_guests: number; high_risk: number }>('/account-audit/groups').then(r => r.data)

export const remediateAccounts = (body: { userIds: string[]; action: string; dryRun: boolean; reason?: string }) =>
  api.post('/account-audit/remediate', body).then(r => r.data)

export const getAuditLog = () =>
  api.get<{ logs: AuditLog[]; total: number }>('/account-audit/audit-log').then(r => r.data)

// ─── Permissions Audit ────────────────────────────────────────────────────

export interface TeamsPermission {
  id: string
  teamName: string
  department: string
  memberUPN: string
  memberName: string
  userType: 'Internal' | 'Guest' | 'External'
  role: 'Owner' | 'Member' | 'Guest'
  permissionLevel: 'Full Control' | 'Edit' | 'Read'
  channelAccess: string
  canShare: boolean
  addedDate: string
  addedBy: string
  riskLevel: Severity
  riskReason: string
}

export interface SpoPermission {
  id: string
  siteName: string
  siteUrl: string
  memberUPN: string
  memberName: string
  userType: 'Internal' | 'Guest' | 'External'
  permissionLevel: 'Full Control' | 'Edit' | 'Read' | 'Limited Access'
  permissionType: 'Direct' | 'Group' | 'Inherited'
  groupName: string | null
  sharingScope: 'None' | 'OrganizationInternal' | 'SpecificExternal' | 'Anonymous'
  sharingWith: string | null
  sharingLinkType: 'View' | 'Edit' | null
  canShare: boolean
  addedDate: string
  riskLevel: Severity
  riskReason: string
}

export interface TeamsPermissionsResponse {
  permissions: TeamsPermission[]
  total: number
  summary: {
    owners: number; editors: number; readers: number
    guests: number; critical: number; high: number
  }
  teams: string[]
}

export interface SpoPermissionsResponse {
  permissions: SpoPermission[]
  total: number
  summary: {
    full_control: number; editors: number; readers: number
    external_shares: number; anonymous_links: number; org_shares: number
    critical: number; high: number
  }
  sites: string[]
}

export const getTeamsPermissions = () =>
  api.get<TeamsPermissionsResponse>('/account-audit/teams-permissions').then(r => r.data)

export const getSpoPermissions = () =>
  api.get<SpoPermissionsResponse>('/account-audit/spo-permissions').then(r => r.data)
