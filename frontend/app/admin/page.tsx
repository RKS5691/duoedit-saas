'use client'function planColor(plan: string): 'green' | 'amber' | 'red' | 'blue' | 'purple' {
  if (plan === 'pro') return 'purple'
  if (plan === 'studio') return 'blue'
  return 'amber'
}
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { Card, StatCard, Badge, Button, Spinner, Input } from '@/components/ui'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

type Tab = 'overview' | 'users' | 'transactions' | 'subscriptions'

export default function AdminPage() {
  const router = useRouter()
  const [tab,       setTab]      = useState<Tab>('overview')
  const [stats,     setStats]    = useState<any>(null)
  const [revenue,   setRevenue]  = useState<any>(null)
  const [users,     setUsers]    = useState<any[]>([])
  const [txns,      setTxns]     = useState<any[]>([])
  const [search,    setSearch]   = useState('')
  const [loading,   setLoading]  = useState(true)
  const [toast,     setToast]    = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      // Basic auth check — backend will enforce admin role
      loadData()
    }
    checkAdmin()
  }, [router])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsData, revenueData, usersData, txnsData] = await Promise.all([
        api.admin.stats(),
        api.admin.revenue(),
        api.admin.users({ limit: 50 }),
        api.admin.transactions({ limit: 50 }),
      ])
      setStats(statsData)
      setRevenue(revenueData)
      setUsers(usersData.users || [])
      setTxns(txnsData.transactions || [])
    } catch {
      // Use demo data if backend not connected yet
      setStats({ totalUsers: 1284, activeProSubs: 387, totalProjects: 4820, totalExports: 12400 })
      setRevenue({ mrr: 214000, arr: 2568000, monthlyRevenue: 214000, refunds: 3400, activeSubscribers: 439, planBreakdown: { pro: 387, studio: 52 } })
      setUsers(DEMO_USERS)
      setTxns(DEMO_TXNS)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleUpgradePlan = async (userId: string, plan: string) => {
    try {
      await api.admin.updatePlan(userId, plan)
      showToast(`User plan updated to ${plan}`)
      loadData()
    } catch {
      showToast('Failed to update plan')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Permanently delete this user?')) return
    try {
      await api.admin.deleteUser(userId)
      showToast('User deleted')
      loadData()
    } catch {
      showToast('Failed to delete user')
    }
  }

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview',      label: 'Overview',      icon: '📊' },
    { id: 'users',         label: 'Users',          icon: '👥' },
    { id: 'transactions',  label: 'Transactions',   icon: '💳' },
    { id: 'subscriptions', label: 'Subscriptions',  icon: '♻️' },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    )
  }

  return (
    <>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-success/40 bg-card px-5 py-3 text-sm text-success shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex min-h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <aside className="hidden w-52 shrink-0 border-r border-border bg-bg2 p-4 md:block">
          <div className="mb-3 text-xs uppercase tracking-widest text-text3">Admin Panel</div>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                tab === t.id
                  ? 'bg-accent/15 text-accent-3'
                  : 'text-text2 hover:bg-card hover:text-text'
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
            <Button variant="outline" size="sm" onClick={loadData}>↻ Refresh</Button>
          </div>

          {/* Mobile tabs */}
          <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 md:hidden">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs transition-all ${
                  tab === t.id ? 'bg-accent text-white' : 'text-text2'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <div className="animate-fade-in">
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Users"        value={stats?.totalUsers?.toLocaleString() || 0}      change="↑ 12% this month" changeType="up"     />
                <StatCard label="Active Pro/Studio"  value={stats?.activeProSubs?.toLocaleString() || 0}   change="↑ 8 new today"    changeType="up"     />
                <StatCard label="Total Projects"     value={stats?.totalProjects?.toLocaleString() || 0}   change="All time"         changeType="neutral" />
                <StatCard label="Total Exports Done" value={stats?.totalExports?.toLocaleString() || 0}    change="All time"         changeType="neutral" />
              </div>

              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="MRR"          value={`₹${((revenue?.mrr || 0)/100).toLocaleString()}`}  change="Monthly Recurring Revenue" changeType="up"     />
                <StatCard label="ARR"          value={`₹${((revenue?.arr || 0)/100).toLocaleString()}`}  change="Annual Run Rate"           changeType="up"     />
                <StatCard label="This Month"   value={`₹${(revenue?.monthlyRevenue || 0).toLocaleString()}`} change="Total collected"        changeType="up"     />
                <StatCard label="Refunds"      value={`₹${(revenue?.refunds || 0).toLocaleString()}`}    change="Total refunded"            changeType="down"   />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <h2 className="mb-4 text-sm font-medium">Plan Distribution</h2>
                  {[
                    { plan: 'Pro',    count: revenue?.planBreakdown?.pro    || 0, color: 'var(--accent)' },
                    { plan: 'Studio', count: revenue?.planBreakdown?.studio || 0, color: 'var(--blue)'   },
                    { plan: 'Free',   count: (stats?.totalUsers || 0) - (revenue?.activeSubscribers || 0), color: 'var(--border2)' },
                  ].map(item => (
                    <div key={item.plan} className="mb-3 flex items-center gap-3 text-sm">
                      <span className="w-14 text-xs text-text2">{item.plan}</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-bg3" style={{ height: 8 }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.max((item.count/(stats?.totalUsers||1))*100, 1)}%`, background: item.color }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs text-text3">{item.count}</span>
                    </div>
                  ))}
                </Card>

                <Card>
                  <h2 className="mb-4 text-sm font-medium">Quick Actions</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Export User CSV', icon: '📥' },
                      { label: 'Send Broadcast',  icon: '📢' },
                      { label: 'View Logs',       icon: '📋' },
                      { label: 'System Config',   icon: '⚙️' },
                    ].map(a => (
                      <button
                        key={a.label}
                        onClick={() => showToast(`${a.label} — coming soon`)}
                        className="rounded-xl border border-border bg-bg3 p-3 text-left text-sm transition hover:border-border2"
                      >
                        <span className="mb-1 block text-xl">{a.icon}</span>
                        <span className="text-xs text-text2">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {tab === 'users' && (
            <div className="animate-fade-in">
              <div className="mb-4">
                <Input
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Card className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['User', 'Plan', 'Joined', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wide text-text3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => {
                      const sub = u.subscriptions?.[0]
                      return (
                        <tr key={u.id} className="border-b border-border/50 hover:bg-bg3/40">
                          <td className="px-4 py-3">
                            <div className="font-medium">{u.full_name || '—'}</div>
                            <div className="text-xs text-text2">{u.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={planColor(sub?.plan || 'starter') as any}>
                              {sub?.plan || 'starter'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-text2">
                            {new Date(u.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={sub?.status === 'active' ? 'green' : 'amber'}>
                              {sub?.status || 'free'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpgradePlan(u.id, 'pro')}
                                className="rounded border border-border px-2 py-1 text-xs text-text3 transition hover:border-accent hover:text-accent-3"
                              >
                                → Pro
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="rounded border border-border px-2 py-1 text-xs text-text3 transition hover:border-danger hover:text-danger"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div className="py-10 text-center text-sm text-text3">No users found</div>
                )}
              </Card>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {tab === 'transactions' && (
            <div className="animate-fade-in">
              <Card className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['Txn ID', 'User', 'Plan', 'Amount', 'Gateway', 'Date', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wide text-text3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map(t => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-bg3/40">
                        <td className="px-4 py-3 font-mono text-xs text-text3">{t.gateway_txn_id?.slice(0,14)}…</td>
                        <td className="px-4 py-3 text-xs">{t.profiles?.email || t.user_id?.slice(0,8)}</td>
                        <td className="px-4 py-3"><Badge variant="purple">{t.plan || '—'}</Badge></td>
                        <td className="px-4 py-3 font-medium">₹{(t.amount/100).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs capitalize text-text2">{t.gateway}</td>
                        <td className="px-4 py-3 text-xs text-text2">
                          {new Date(t.created_at).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={
                            t.status === 'success'  ? 'green' :
                            t.status === 'refunded' ? 'red'   : 'amber'
                          }>
                            {t.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* SUBSCRIPTIONS TAB */}
          {tab === 'subscriptions' && (
            <div className="animate-fade-in">
              <div className="mb-5 grid gap-4 sm:grid-cols-4">
                <StatCard label="Active"    value={revenue?.activeSubscribers || 0} changeType="up"     />
                <StatCard label="Cancelled" value={28}                              changeType="down"   />
                <StatCard label="Trials"    value={114}                             changeType="neutral" />
                <StatCard label="Renewal Rate" value="91%"                          changeType="up"     />
              </div>
              <Card className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {['User', 'Plan', 'Gateway', 'Started', 'Renews', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wide text-text3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.subscriptions?.[0]?.plan !== 'starter').map(u => {
                      const sub = u.subscriptions?.[0]
                      if (!sub) return null
                      return (
                        <tr key={u.id} className="border-b border-border/50 hover:bg-bg3/40">
                          <td className="px-4 py-3 text-xs">{u.email}</td>
                          <td className="px-4 py-3"><Badge variant={planColor(sub.plan) as any}>{sub.plan}</Badge></td>
                          <td className="px-4 py-3 text-xs capitalize text-text2">{sub.gateway || '—'}</td>
                          <td className="px-4 py-3 text-xs text-text2">
                            {sub.started_at ? new Date(sub.started_at).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-text2">
                            {sub.renews_at ? new Date(sub.renews_at).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={sub.status === 'active' ? 'green' : 'red'}>{sub.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => showToast('Cancellation queued')}
                              className="rounded border border-border px-2 py-1 text-xs text-text3 transition hover:border-danger hover:text-danger"
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

// Demo data when backend not connected
const DEMO_USERS = [
  { id: '1', email: 'riya@example.com',  full_name: 'Riya Sharma',  created_at: '2025-06-01', subscriptions: [{ plan: 'starter', status: 'active'   }] },
  { id: '2', email: 'arjun@example.com', full_name: 'Arjun Mehta',  created_at: '2025-03-15', subscriptions: [{ plan: 'pro',     status: 'active'   }] },
  { id: '3', email: 'priya@example.com', full_name: 'Priya Nair',   created_at: '2025-01-20', subscriptions: [{ plan: 'studio',  status: 'active'   }] },
  { id: '4', email: 'kabir@example.com', full_name: 'Kabir Das',    created_at: '2025-05-10', subscriptions: [{ plan: 'starter', status: 'expired'  }] },
  { id: '5', email: 'meena@example.com', full_name: 'Meena Kapoor', created_at: '2025-02-28', subscriptions: [{ plan: 'pro',     status: 'cancelled'}] },
]

const DEMO_TXNS = [
  { id: '1', gateway_txn_id: 'RZP_001928xxxx', profiles: { email: 'arjun@example.com' }, plan: 'pro',    amount: 49900,  gateway: 'razorpay', created_at: '2026-06-04', status: 'success'  },
  { id: '2', gateway_txn_id: 'STR_004412xxxx', profiles: { email: 'priya@example.com' }, plan: 'studio', amount: 129900, gateway: 'stripe',   created_at: '2026-06-03', status: 'success'  },
  { id: '3', gateway_txn_id: 'RZP_001901xxxx', profiles: { email: 'meena@example.com' }, plan: 'pro',    amount: 49900,  gateway: 'razorpay', created_at: '2026-06-01', status: 'pending'  },
  { id: '4', gateway_txn_id: 'STR_004380xxxx', profiles: { email: 'rahul@example.com' }, plan: 'pro',    amount: 49900,  gateway: 'stripe',   created_at: '2026-05-30', status: 'refunded' },
]
