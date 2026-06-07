import { supabase } from './supabase'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'API request failed')
  }
  return res.json()
}

// ── Auth ─────────────────────────────────────────────────────
export const api = {
  auth: {
    me:      ()                          => apiFetch<any>('/api/auth/me'),
    usage:   ()                          => apiFetch<any>('/api/auth/usage'),
    profile: (body: any)                 => apiFetch<any>('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  },

  // ── Payments ───────────────────────────────────────────────
  payment: {
    razorpayOrder:  (plan: string)       => apiFetch<any>('/api/payment/razorpay/create-order', { method: 'POST', body: JSON.stringify({ plan }) }),
    razorpayVerify: (body: any)          => apiFetch<any>('/api/payment/razorpay/verify', { method: 'POST', body: JSON.stringify(body) }),
    stripeSession:  (plan: string)       => apiFetch<any>('/api/payment/stripe/create-session', { method: 'POST', body: JSON.stringify({ plan }) }),
    stripePortal:   ()                   => apiFetch<any>('/api/payment/stripe/portal', { method: 'POST' }),
  },

  // ── Subscriptions ──────────────────────────────────────────
  subscriptions: {
    me:           ()                     => apiFetch<any>('/api/subscriptions/me'),
    cancel:       ()                     => apiFetch<any>('/api/subscriptions/cancel', { method: 'POST' }),
    transactions: ()                     => apiFetch<any>('/api/subscriptions/transactions'),
  },

  // ── Admin ──────────────────────────────────────────────────
  admin: {
    stats:        ()                     => apiFetch<any>('/api/admin/stats'),
    users:        (params?: any)         => apiFetch<any>('/api/admin/users?' + new URLSearchParams(params)),
    transactions: (params?: any)         => apiFetch<any>('/api/admin/transactions?' + new URLSearchParams(params)),
    revenue:      ()                     => apiFetch<any>('/api/admin/revenue'),
    updatePlan:   (id: string, plan: string) => apiFetch<any>(`/api/admin/users/${id}/plan`, { method: 'PATCH', body: JSON.stringify({ plan }) }),
    deleteUser:   (id: string)           => apiFetch<any>(`/api/admin/users/${id}`, { method: 'DELETE' }),
  },
}
