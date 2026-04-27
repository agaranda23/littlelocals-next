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
        // Supabase auto-detects and exchanges the token from URL on init.
        // We just wait a beat and check the session.
        await new Promise(r => setTimeout(r, 300))
        const { data: { session } } = await supabase.auth.getSession()

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

    handleAuth()
  }, [])

  return null
}
