import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Profile = {
  id: string
  profile_name: string | null
  brand_name: string | null
  primary_color: string | null
  sector: string | null
  created_at: string
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, profile_name, brand_name, primary_color, sector, created_at')
    .order('created_at', { ascending: false })

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <main style={{ maxWidth: 800, margin: '60px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>{user.email}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            style={{ padding: '6px 14px', background: '#fff', color: '#c00', border: '1px solid #c00', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
          >
            Çıkış
          </button>
        </form>
      </div>

      {/* Profiles section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Marka Profilleri</h2>
        <Link href="/profile/new">
          <button style={{ padding: '8px 18px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
            + Yeni Profil
          </button>
        </Link>
      </div>

      {(!profiles || profiles.length === 0) ? (
        <div style={{ padding: 40, textAlign: 'center', border: '1px dashed #ccc', borderRadius: 8, color: '#999' }}>
          <p style={{ margin: 0, fontSize: 15 }}>Henüz marka profili yok.</p>
          <Link href="/profile/new" style={{ display: 'inline-block', marginTop: 12, color: '#0070f3', fontSize: 14 }}>
            İlk profilinizi oluşturun →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {(profiles as Profile[]).map(profile => (
            <div
              key={profile.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: 16,
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: profile.primary_color ?? '#ccc',
                    border: '1px solid rgba(0,0,0,0.08)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile.profile_name ?? '—'}
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile.brand_name ?? '—'}
                  </p>
                </div>
              </div>
              {profile.sector && (
                <span style={{ display: 'inline-block', padding: '2px 8px', background: '#f0f0f0', borderRadius: 10, fontSize: 12, color: '#555' }}>
                  {profile.sector}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
