import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getUsers, getInactiveUsers, getMfaStatus, getLicenses,
  getPrivileged, getGuests, type User
} from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { RefreshCw, AlertTriangle, ShieldAlert, UserX } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'users' | 'mfa' | 'licenses' | 'privileged' | 'guests'

function SeverityBadge({ level }: { level: string }) {
  const cls = {
    Critical: 'bg-red-100 text-red-700',
    High: 'bg-orange-100 text-orange-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-green-100 text-green-700',
  }[level] ?? 'bg-gray-100 text-gray-600'
  return <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', cls)}>{level}</span>
}

function StatusBadge({ enabled, daysInactive }: { enabled: boolean; daysInactive: number }) {
  if (!enabled) return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Disabled</span>
  if (daysInactive >= 90) return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Inactive</span>
  return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
        active ? 'border-ms-blue text-ms-blue' : 'border-transparent text-gray-500 hover:text-gray-700'
      )}
    >
      {children}
    </button>
  )
}

function UsersTab() {
  const [search, setSearch] = useState('')
  const [dept, setDept] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['users', search, dept],
    queryFn: () => getUsers({ search: search || undefined, department: dept || undefined }),
  })

  if (isLoading) return <div className="flex items-center justify-center h-32"><RefreshCw className="w-5 h-5 animate-spin text-gray-400" /></div>
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ms-blue"
        />
        <select value={dept} onChange={e => setDept(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ms-blue">
          <option value="">All Departments</option>
          {data.departments.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">UPN</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">License</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Last Sign-in</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.users.map((u: User) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{u.displayName}</div>
                  <div className="text-xs text-gray-400">{u.userType}</div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{u.userPrincipalName}</td>
                <td className="px-4 py-3 text-gray-600">{u.department}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">{u.license}</td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {new Date(u.lastSignIn).toLocaleDateString('zh-TW')}
                  {u.daysInactive > 0 && <div className="text-orange-500">{u.daysInactive}d ago</div>}
                </td>
                <td className="px-4 py-3"><StatusBadge enabled={u.accountEnabled} daysInactive={u.daysInactive} /></td>
                <td className="px-4 py-3"><SeverityBadge level={u.riskLevel} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
          Showing {data.users.length} of {data.total} users
        </div>
      </div>
    </div>
  )
}

function MfaTab() {
  const { data, isLoading } = useQuery({ queryKey: ['mfa'], queryFn: getMfaStatus })
  if (isLoading) return <div className="flex items-center justify-center h-32"><RefreshCw className="w-5 h-5 animate-spin text-gray-400" /></div>
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-600">{data.mfa_rate}%</div>
          <div className="text-sm text-gray-500 mt-1">MFA Coverage</div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${data.mfa_rate}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-ms-blue">{data.mfa_enabled}</div>
          <div className="text-sm text-gray-500 mt-1">MFA Enabled</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-red-600">{data.mfa_disabled}</div>
          <div className="text-sm text-gray-500 mt-1">MFA Disabled</div>
        </div>
      </div>

      {data.admins_without_mfa.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-800 text-sm">Admin Accounts Without MFA ({data.admins_without_mfa.length})</h4>
          </div>
          <div className="space-y-2">
            {data.admins_without_mfa.map((u: User) => (
              <div key={u.id} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-red-100">
                <div>
                  <div className="text-sm font-medium text-gray-800">{u.displayName}</div>
                  <div className="text-xs text-gray-400">{u.adminRoles.join(', ')}</div>
                </div>
                <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">No MFA</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700">Users Without MFA ({data.users_without_mfa.length})</h4>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Department</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Last Sign-in</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.users_without_mfa.map((u: User) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{u.displayName}</div>
                  <div className="text-xs text-gray-400 truncate max-w-xs">{u.userPrincipalName}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.department}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.lastSignIn).toLocaleDateString('zh-TW')}</td>
                <td className="px-4 py-3">
                  {u.isAdmin ? <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">Admin</span> : <span className="text-xs text-gray-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LicensesTab() {
  const { data, isLoading } = useQuery({ queryKey: ['licenses'], queryFn: getLicenses })
  if (isLoading) return <div className="flex items-center justify-center h-32"><RefreshCw className="w-5 h-5 animate-spin text-gray-400" /></div>
  if (!data) return null

  const chartData = data.licenses.map((l: any) => ({
    name: l.name.replace('Microsoft 365 ', 'M365 ').replace('Exchange Online ', 'EXO ').replace('Azure AD ', 'AAD '),
    assigned: l.assigned,
    available: l.available,
    utilization: Math.round(l.assigned / l.total * 100),
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-ms-blue">{data.summary.total_assigned}</div>
          <div className="text-sm text-gray-500 mt-1">Total Assigned</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-600">{data.summary.utilization_rate}%</div>
          <div className="text-sm text-gray-500 mt-1">Utilization Rate</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-purple-600">${data.summary.monthly_cost?.toFixed(0)}</div>
          <div className="text-sm text-gray-500 mt-1">Monthly Cost (USD)</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">License Utilization by SKU</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
            <Tooltip formatter={(v, n) => [v, n === 'assigned' ? 'Assigned' : 'Available']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="assigned" fill="#0078D4" radius={[0, 4, 4, 0]} />
            <Bar dataKey="available" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data.licenses.map((l: any) => {
          const pct = Math.round(l.assigned / l.total * 100)
          const color = pct > 90 ? 'text-red-600' : pct > 75 ? 'text-orange-600' : 'text-ms-blue'
          return (
            <div key={l.name} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm font-medium text-gray-800 leading-tight">{l.name}</div>
                <span className={clsx('text-sm font-bold', color)}>{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                <div className={clsx('h-1.5 rounded-full', pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-orange-400' : 'bg-ms-blue')} style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-gray-500">{l.assigned} / {l.total} assigned · {l.available} available</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PrivilegedTab() {
  const { data, isLoading } = useQuery({ queryKey: ['privileged'], queryFn: getPrivileged })
  if (isLoading) return <div className="flex items-center justify-center h-32"><RefreshCw className="w-5 h-5 animate-spin text-gray-400" /></div>
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-red-600">{data.global_admin_count}</div>
          <div className="text-sm text-gray-500 mt-1">Global Admins</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-orange-600">{data.total_admins}</div>
          <div className="text-sm text-gray-500 mt-1">Total Privileged Users</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700">Privileged Accounts</h4>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Roles</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">MFA</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Last Sign-in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.admins.map((u: User) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{u.displayName}</div>
                  <div className="text-xs text-gray-400 truncate max-w-xs">{u.userPrincipalName}</div>
                </td>
                <td className="px-4 py-3">
                  {u.adminRoles.map(r => (
                    <span key={r} className="text-xs bg-blue-50 text-ms-blue px-2 py-0.5 rounded-full mr-1 mb-1 inline-block">{r}</span>
                  ))}
                </td>
                <td className="px-4 py-3">
                  {u.mfaEnabled
                    ? <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">Enabled</span>
                    : <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full">Disabled</span>
                  }
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.lastSignIn).toLocaleDateString('zh-TW')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700">Recent Role Changes</h4>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">User</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Action</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.recent_role_changes.map((c: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{c.user}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{c.role}</td>
                <td className="px-4 py-3">
                  <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', c.action === 'Added' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                    {c.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(c.timestamp).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GuestsTab() {
  const { data, isLoading } = useQuery({ queryKey: ['guests'], queryFn: getGuests })
  if (isLoading) return <div className="flex items-center justify-center h-32"><RefreshCw className="w-5 h-5 animate-spin text-gray-400" /></div>
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-ms-blue">{data.total}</div>
          <div className="text-sm text-gray-500 mt-1">Total Guests</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-orange-600">{data.inactive_guests}</div>
          <div className="text-sm text-gray-500 mt-1">Inactive 60+ Days</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
          <div className="text-3xl font-bold text-red-600">{data.high_risk_guests}</div>
          <div className="text-sm text-gray-500 mt-1">High Risk</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Last Login</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Country</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.guests.map((g: User) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{g.displayName}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{g.userPrincipalName}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(g.lastSignIn).toLocaleDateString('zh-TW')}
                  {g.daysInactive > 0 && <div className="text-orange-500">{g.daysInactive}d ago</div>}
                </td>
                <td className="px-4 py-3 text-gray-600">{g.country}</td>
                <td className="px-4 py-3"><SeverityBadge level={g.riskLevel} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Identity() {
  const [tab, setTab] = useState<Tab>('users')

  return (
    <div className="p-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-5 overflow-x-auto">
        <TabBtn active={tab === 'users'} onClick={() => setTab('users')}>User Inventory</TabBtn>
        <TabBtn active={tab === 'mfa'} onClick={() => setTab('mfa')}>MFA Status</TabBtn>
        <TabBtn active={tab === 'licenses'} onClick={() => setTab('licenses')}>Licenses</TabBtn>
        <TabBtn active={tab === 'privileged'} onClick={() => setTab('privileged')}>Privileged Access</TabBtn>
        <TabBtn active={tab === 'guests'} onClick={() => setTab('guests')}>Guest Users</TabBtn>
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'mfa' && <MfaTab />}
      {tab === 'licenses' && <LicensesTab />}
      {tab === 'privileged' && <PrivilegedTab />}
      {tab === 'guests' && <GuestsTab />}
    </div>
  )
}
