'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const navLinks = [
  { href: '/',          label: 'Home'      },
  { href: '/pricing',   label: 'Pricing'   },
  { href: '/dashboard', label: 'Dashboard' },
]

export default function Navbar({ user }: { user?: any }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-accent-3">
          Duo<span className="text-gold">Edit</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === link.href
                  ? 'bg-card text-text'
                  : 'text-text2 hover:bg-card hover:text-text'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <span className="text-sm text-text2">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text2 transition hover:border-accent hover:text-accent-3"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-border px-4 py-2 text-sm text-text2 transition hover:border-accent hover:text-accent-3"
              >
                Log In
              </Link>
              <Link
                href="/pricing"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-2"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="rounded-lg p-2 text-text2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-bg2 px-6 py-4 md:hidden">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm text-text2 hover:text-text"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-3 flex gap-2">
            {user ? (
              <button onClick={handleSignOut} className="text-sm text-danger">Sign Out</button>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="text-sm text-text2">Log In</Link>
                <Link href="/pricing" onClick={() => setOpen(false)} className="ml-auto rounded bg-accent px-3 py-1 text-sm text-white">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
