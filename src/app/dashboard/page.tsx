import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Profile = {
  id: string
  profile_name: string | null
  brand_name: string | null
  primary_color: string | null
  price_segment: string | null
  content_language: string | null
  profile_tier: string | null
  created_at: string
}

function tierLabel(tier: string | null) {
  switch (tier) {
    case 'hizli':       return 'Hızlı'
    case 'detayli':     return 'Detaylı'
    case 'cok_detayli': return 'Çok Detaylı'
    default:            return null
  }
}

function tierColor(tier: string | null) {
  switch (tier) {
    case 'hizli':       return { bg: '#e8f5e9', text: '#2e7d32' }
    case 'detayli':     return { bg: '#e3f2fd', text: '#1565c0' }
    case 'cok_detayli': return { bg: '#f3e5f5', text: '#6a1b9a' }
    default:            return { bg: '#f5f5f5', text: '#555' }
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, profile_name, brand_name, primary_color, price_segment, content_language, profile_tier, created_at')
    .order('created_at', { ascending: false })

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <main style={{ maxWidth: 860, margin: '60px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>{user.email}</p>
        </div>
        <form action={signOut}>
          <button type="submit" style={{
            padding: '6px 14px', background: '#fff', color: '#c00',
            border: '1px solid #c00', borderRadius: 4, cursor: 'pointer', fontSize: 14,
          }}>Çıkış</button>
        </form>
      </div>

      {/* Profiles section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Marka Profilleri</h2>
        <Link href="/profile/new">
          <button style={{
            padding: '8px 18px', background: '#0070f3', color: '#fff',
            border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>+ Yeni Profil</button>
        </Link>
      </div>

      {(!profiles || profiles.length === 0) ? (
        <div style={{ padding: 48, textAlign: 'center', border: '1px dashed #ccc', borderRadius: 8, color: '#999' }}>
          <p style={{ margin: 0, fontSize: 15 }}>Henüz marka profili yok.</p>
          <Link href="/profile/new" style={{ display: 'inline-block', marginTop: 12, color: '#0070f3', fontSize: 14 }}>
            İlk profilinizi oluşturun →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {(profiles as Profile[]).map(p => {
            const tc = tierColor(p.profile_tier)
            const tl = tierLabel(p.profile_tier)
            return (
              <div key={p.id} style={{
                border: '1px solid #e0e0e0', borderRadius: 8, padding: 16,
                background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}>
                {/* Color + name row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: p.primary_color ?? '#ccc',
                    border: '1px solid rgba(0,0,0,0.08)',
                  }} />
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.profile_name ?? '—'}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.brand_name ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {p.price_segment && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#e8f5e9', color: '#2e7d32' }}>
                      {p.price_segment}
                    </span>
                  )}
                  {p.content_language && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#fff8e1', color: '#e65100' }}>
                      {p.content_language}
                    </span>
                  )}
                  {tl && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: tc.bg, color: tc.text }}>
                      {tl}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
