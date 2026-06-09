'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import { Card, StatCard, Badge, Button, ProgressBar, Spinner } from '@/components/ui'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

const SIDEBAR = [
  { icon: '🏠', label: 'Overview',  active: true  },
  { icon: '🎬', label: 'Projects',  active: false },
  { icon: '🕒', label: 'Recent',    active: false },
  { icon: '☁️', label: 'Storage',   active: false },
  { icon: '⚙️', label: 'Settings',  active: false },
]

function planColor(plan: string) {
  if (plan === 'pro') return 'purple'
  if (plan === 'studio') return 'blue'
  return 'amber'
}

export default function DashboardClient() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [user,  setUser]  = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [sub,   setSub]   = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }

      try {
        const [profile, usageData, subData] = await Promise.all([
          api.auth.me(),
          api.auth.usage(),
          api.subscriptions.me(),
        ])
        setUser(profile)
        setUsage(usageData)
        setSub(subData)
      } catch {
        setUser({ email: authUser.email, full_name: authUser.email?.split('@')[0] })
        setUsage({ plan: 'starter', exports_this_month: 0, export_limit: 5, storage_used_bytes: 0, storage_limit_bytes: 524288000 })
        setSub({ plan: 'starter', status: 'active' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    )
  }

  const storageUsedMB  = Math.round((usage?.storage_used_bytes || 0) / 1024 / 1024)
  const storageLimitMB = Math.round((usage?.storage_limit_bytes || 524288000) / 1024 / 1024)
  const storagePct     = Math.round((storageUsedMB / storageLimitMB) * 100)
  const exportPct      = Math.round(((usage?.exports_this_month || 0) / (usage?.export_limit || 5)) * 100)

  return (
    <>
      <Navbar user={user} />
      <div className="flex min-h-[calc(100vh-65px)]">
        <aside className="hidden w-56 shrink-0 border-r border-border bg-bg2 p-4 md:flex md:flex-col">
          <div className="mb-4 text-xs uppercase tracking-widest text-text3">Main</div>
          {SIDEBAR.map(item => (
            <button
              key={item.label}
              className={`mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors text-left w-full ${
                item.active ? 'bg-accent/15 text-accent-3' : 'text-text2 hover:bg-card hover:text-text'
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
          <div className="mt-4 border-t border-border pt-4">
            <Link href="/pricing" className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-text2 hover:bg-card hover:text-text">
              <span>👑</span> Upgrade
            </Link>
          </div>
          <div className="mt-auto rounded-xl border border-accent/25 bg-accent/8 p-4">
            <div className="mb-1 text-sm font-medium capitalize text-accent-3">{sub?.plan || 'Starter'} Plan</div>
            <div className="text-xs text-text3">{usage?.exports_this_month || 0}/{usage?.export_limit || 5} exports used</div>
            <ProgressBar value={usage?.exports_this_month || 0} max={usage?.export_limit || 5} />
            {(sub?.plan === 'starter' || !sub?.plan) && (
              <Link href="/pricing"><Button size="sm" className="mt-3 w-full">Upgrade Now</Button></Link>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {searchParams.get('payment') === 'success' && (
            <div className="mb-5 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              🎉 Payment successful! Your subscription is now active.
            </div>
          )}

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">
                Welcome back, {user?.full_name?.split(' ')[0] || 'Creator'} 👋
              </h1>
              <p className="mt-1 text-sm text-text2">Here&apos;s what&apos;s happening with your projects</p>
            </div>
            <Button>+ New Project</Button>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Projects"     value="14"   change="+3 this week"   changeType="up" />
            <StatCard label="Exports This Month" value={`${usage?.exports_this_month || 0} / ${usage?.export_limit || 5}`}
              change={exportPct >= 80 ? 'Limit approaching' : `${100-exportPct}% remaining`}
              changeType={exportPct >= 80 ? 'down' : 'neutral'}
            />
            <StatCard label="Storage Used"   value={`${storageUsedMB} MB`} change={`${storagePct}% used`} changeType="neutral" />
            <StatCard label="Hours Edited"   value="4.2h"  change="+1.1h today"   changeType="up" />
          </div>

          <div className="mb-6 grid gap-5 lg:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium">Export Activity</h2>
                <span className="text-xs text-text3">Last 7 days</span>
              </div>
              <div className="flex h-24 items-end gap-1.5">
                {[1,3,0,2,4,3,1].map((v, i) => (
                  <div key={i} className="flex-1 rounded-t-sm transition-all"
                    style={{ height: `${(v/4)*100}%`, background: i === 4 ? 'var(--accent)' : 'rgba(124,111,247,0.3)', minHeight: v === 0 ? '4px' : undefined }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-text3">
                {['M','T','W','T','F','S','S'].map((d,i) => <span key={i}>{d}</span>)}
              </div>
            </Card>

            <Card>
              <h2 className="mb-4 text-sm font-medium">Storage Breakdown</h2>
              {[
                { label: 'Raw footage', pct: 68, color: 'var(--accent)' },
                { label: 'Exports',     pct: 45, color: 'var(--gold)'   },
                { label: 'Voiceovers', pct: 22, color: 'var(--green)'  },
                { label: 'Thumbnails', pct:  8, color: 'var(--blue)'   },
              ].map(item => (
                <div key={item.label} className="mb-3 flex items-center gap-3 text-sm">
                  <span className="w-24 text-xs text-text2">{item.label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-bg3" style={{ height: 6 }}>
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                  </div>
                  <span className="w-8 text-right text-xs text-text3">{item.pct}%</span>
                </div>
              ))}
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 text-sm font-medium">Recent Projects</h2>
            {[
              { name: 'Wedding Reel — Final Cut', info: 'Modified 2 hours ago · 128 MB',  status: 'Exported',    badge: 'green' as const },
              { name: 'Brand Ad — v3',            info: 'Modified yesterday · 84 MB',     status: 'In Progress', badge: 'amber' as const },
              { name: 'YouTube Intro Loop',       info: 'Modified 3 days ago · 32 MB',   status: 'Exported',    badge: 'green' as const },
              { name: 'Podcast Visuals',          info: 'Modified 5 days ago · 61 MB',   status: 'Draft',       badge: 'red'   as const },
            ].map(p => (
              <div key={p.name} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                <div>
                  <div className="text-sm">{p.name}</div>
                  <div className="mt-0.5 text-xs text-text2">{p.info}</div>
                </div>
                <Badge variant={p.badge}>{p.status}</Badge>
              </div>
            ))}
          </Card>
        </main>
      </div>
    </>
  )
}
