import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'

const features = [
  { icon: '✂️', title: 'Segment Replacement',  desc: 'Cut any part of your video and replace with new footage using FFmpeg engine.' },
  { icon: '🎙️', title: 'Voiceover Studio',     desc: 'Record and mix voiceovers with precision volume control across all tracks.' },
  { icon: '▶️', title: 'Live Preview',          desc: 'See changes in real time before export. Full scrubbing support.' },
  { icon: '📱', title: 'Mobile First',          desc: 'Native Flutter app for Android and iOS — full studio in your pocket.' },
  { icon: '☁️', title: 'Cloud Export',          desc: 'Export in 4K to device storage or sync to Google Drive.' },
  { icon: '👥', title: 'Team Projects',         desc: 'Collaborate with shared timelines and comment threads.' },
]

const stats = [
  { value: '12k+', label: 'Active creators' },
  { value: '4.9★', label: 'App rating'      },
  { value: '2M+',  label: 'Videos edited'   },
]

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs text-accent-3">
            <span>🎬</span> Professional Video Editing Platform
          </div>
          <h1 className="font-display mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            Edit Videos Like a{' '}
            <span className="text-accent">Studio Pro</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-text2">
            Replace any segment of your video — audio or visual — in seconds.
            Built for creators, studios, and teams who demand more.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/pricing"
              className="rounded-xl bg-accent px-7 py-3.5 text-base font-medium text-white transition hover:bg-accent-2 hover:-translate-y-0.5"
            >
              Start Free Trial
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-border2 px-7 py-3.5 text-base text-text2 transition hover:border-accent hover:text-accent-3"
            >
              View Dashboard →
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border border-border">
            {stats.map(s => (
              <div key={s.label} className="bg-bg2 py-5 text-center">
                <div className="font-display text-3xl font-bold text-accent-3">{s.value}</div>
                <div className="mt-1 text-xs text-text3">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="font-display mb-2 text-center text-2xl font-bold">Everything you need</h2>
          <p className="mb-10 text-center text-sm text-text2">Powerful tools for professional video production</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(f => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-border2"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-xl">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-sm font-medium">{f.title}</h3>
                <p className="text-sm leading-relaxed text-text2">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="mx-auto mb-24 max-w-4xl px-6">
          <div className="rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/10 to-transparent p-10 text-center">
            <h2 className="font-display mb-4 text-3xl font-bold">Ready to edit like a pro?</h2>
            <p className="mb-7 text-text2">Start free. No credit card required.</p>
            <Link
              href="/pricing"
              className="inline-block rounded-xl bg-accent px-8 py-3.5 text-base font-medium text-white transition hover:bg-accent-2"
            >
              Get Started for Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-bg2 px-6 py-8 text-center text-xs text-text3">
        © {new Date().getFullYear()} DuoEdit · Built with Next.js + Flutter + FFmpeg
      </footer>
    </>
  )
}
