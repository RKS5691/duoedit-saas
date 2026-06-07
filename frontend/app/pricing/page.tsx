'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { Button, Spinner } from '@/components/ui'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹0',
    per: '/month',
    desc: 'Perfect for trying out DuoEdit for personal projects.',
    features: [
      { text: '5 exports / month',    included: true  },
      { text: '720p max quality',     included: true  },
      { text: 'Basic audio trim',     included: true  },
      { text: '500 MB storage',       included: true  },
      { text: 'Team collaboration',   included: false },
      { text: 'Priority support',     included: false },
    ],
    popular: false,
    cta: 'Get Started Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹499',
    per: '/month',
    desc: 'Everything creators need to produce professional content.',
    features: [
      { text: 'Unlimited exports',    included: true  },
      { text: '4K quality',           included: true  },
      { text: 'Full audio studio',    included: true  },
      { text: '50 GB storage',        included: true  },
      { text: 'Priority support',     included: true  },
      { text: 'Team workspace',       included: false },
    ],
    popular: true,
    cta: 'Subscribe Now',
  },
  {
    id: 'studio',
    name: 'Studio',
    price: '₹1,299',
    per: '/month',
    desc: 'For studios and teams working on serious productions.',
    features: [
      { text: 'Unlimited exports',      included: true },
      { text: '8K quality',             included: true },
      { text: 'Full audio studio',      included: true },
      { text: '500 GB storage',         included: true },
      { text: 'Team workspace (10)',     included: true },
      { text: 'Dedicated support',      included: true },
    ],
    popular: false,
    cta: 'Get Studio',
  },
]

declare global { interface Window { Razorpay: any } }

export default function PricingPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [gateway, setGateway] = useState<'razorpay' | 'stripe'>('razorpay')

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise(resolve => {
      if (document.getElementById('razorpay-script')) return resolve(true)
      const script = document.createElement('script')
      script.id  = 'razorpay-script'
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload  = () => resolve(true)
      script.onerror = () => resolve(false)
      document.head.appendChild(script)
    })

  const handleSubscribe = async (planId: string) => {
    // Free plan — just go to signup
    if (planId === 'starter') {
      router.push('/login')
      return
    }

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?redirect=/pricing`)
      return
    }

    setLoading(planId)

    try {
      if (gateway === 'razorpay') {
        const ok = await loadRazorpayScript()
        if (!ok) throw new Error('Razorpay failed to load')

        const order = await api.payment.razorpayOrder(planId)

        const rzp = new window.Razorpay({
          key:          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount:       order.amount,
          currency:     order.currency,
          order_id:     order.orderId,
          name:         'DuoEdit',
          description:  `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
          prefill:      { email: user.email },
          theme:        { color: '#7c6ff7' },
          handler: async (response: any) => {
            try {
              await api.payment.razorpayVerify({
                orderId:   order.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                plan:      planId,
              })
              router.push('/dashboard?payment=success')
            } catch {
              alert('Payment verification failed. Contact support.')
            }
          },
          modal: { ondismiss: () => setLoading(null) },
        })
        rzp.open()
      } else {
        // Stripe — redirect to hosted checkout
        const { url } = await api.payment.stripeSession(planId)
        window.location.href = url
      }
    } catch (err: any) {
      alert(err.message || 'Payment failed')
      setLoading(null)
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="font-display mb-2 text-center text-4xl font-extrabold tracking-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="mb-4 text-center text-text2">Start free. Upgrade when you need more power.</p>

        {/* Gateway toggle */}
        <div className="mb-10 flex justify-center">
          <div className="flex gap-2 rounded-xl border border-border bg-card p-1">
            {(['razorpay', 'stripe'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGateway(g)}
                className={`rounded-lg px-5 py-2 text-sm transition-all ${
                  gateway === g ? 'bg-accent text-white' : 'text-text2 hover:text-text'
                }`}
              >
                {g === 'razorpay' ? '🇮🇳 Razorpay' : '🌍 Stripe'}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 transition ${
                plan.popular
                  ? 'border-accent bg-gradient-to-b from-accent/10 to-card shadow-lg shadow-accent/10'
                  : 'border-border bg-card hover:border-border2'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-0.5 text-xs font-medium text-white">
                  Most Popular
                </div>
              )}

              <div className="font-display text-base font-bold">{plan.name}</div>
              <div className="font-display mt-3 text-4xl font-extrabold text-accent-3">
                {plan.price}
                <span className="text-sm font-normal text-text3">{plan.per}</span>
              </div>
              <p className="mb-5 mt-2 text-sm leading-relaxed text-text2">{plan.desc}</p>

              <ul className="mb-6 space-y-2.5">
                {plan.features.map(f => (
                  <li key={f.text} className={`flex items-center gap-2 text-sm ${f.included ? 'text-text2' : 'text-text3 line-through opacity-40'}`}>
                    <span className={f.included ? 'text-success' : 'text-text3'}>{f.included ? '✓' : '✗'}</span>
                    {f.text}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
                  plan.popular
                    ? 'bg-accent text-white hover:bg-accent-2'
                    : 'border border-border2 text-text2 hover:border-accent hover:text-accent-3'
                } disabled:opacity-60`}
              >
                {loading === plan.id && <Spinner className="h-3.5 w-3.5" />}
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-text3">
          Payments secured via Razorpay & Stripe · Cancel anytime · GST included
        </p>
      </main>
    </>
  )
}
