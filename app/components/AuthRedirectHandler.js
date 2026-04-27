'use client'
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AuthRedirectHandler() {
  useEffect(() => {
    // Only run if there's an auth token in the URL hash or query
    const hash = window.location.hash
    const search = window.location.search

    const hasAuthHash = hash.includes('access_token=') || hash.includes('error=')
    const hasAuthQuery = search.includes('code=') || search.includes('token_hash=')

    if (!hasAuthHash && !hasAuthQuery) return

    async function handleAuth() {
      try {
        // Try up to 6 times over ~3s for Supabase to detect & exchange
        // the token from the URL hash and persist the session.
        let session = null
        for (let i = 0; i < 6; i++) {
          const { data } = await supabase.auth.getSession()
          if (data?.session) { session = data.session; break }
          await new Promise(r => setTimeout(r, 500))
        }

        if (session) {
          // Clean the URL (remove the auth hash/query) before redirecting
          window.history.replaceState({}, '', window.location.pathname)

          // Already on dashboard? Don't bounce.
          if (window.location.pathname.startsWith('/provider/dashboard')) return

          // Otherwise route to dashboard
          window.location.href = '/provider/dashboard'
        }
      } catch (err) {
        console.error('Auth redirect handler error:', err)
      }
    }

    // Also listen for SIGNED_IN events as a backup signal.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && !window.location.pathname.startsWith('/provider/dashboard')) {
        window.history.replaceState({}, '', window.location.pathname)
        window.location.href = '/provider/dashboard'
      }
    })

    handleAuth()

    return () => { sub?.subscription?.unsubscribe?.() }
  }, [])

  return null
}
