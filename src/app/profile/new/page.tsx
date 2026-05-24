'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import Link from 'next/link'

type Analysis = {
  primary_color: string
  secondary_color: string
  tone: string
  visual_style: string
  brand_description: string
}

const sectors = ['F&B', 'Güzellik/Bakım', 'Giyim', 'Hizmet', 'Perakende', 'Diğer']
const tones = ['resmi', 'samimi', 'esprili', 'premium', 'sıcak']

const input: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 14,
  border: '1px solid #ccc',
  borderRadius: 4,
  width: '100%',
  boxSizing: 'border-box',
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 4,
  color: '#444',
}

export default function NewProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userId, setUserId] = useState('')

  const [profileName, setProfileName] = useState('')
  const [brandName, setBrandName] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [sector, setSector] = useState('')

  const [primaryColor, setPrimaryColor] = useState('#000000')
  const [secondaryColor, setSecondaryColor] = useState('#ffffff')
  const [tone, setTone] = useState('')

  const [logoPreview, setLogoPreview] = useState('')
  const [logoStorageUrl, setLogoStorageUrl] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  const handleLogoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoPreview(URL.createObjectURL(file))
    setAnalysis(null)
    setAnalyzeError('')
    setAnalyzing(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `${userId}/${Date.now()}.${ext}`

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('logos')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadErr) throw new Error(uploadErr.message)

      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(uploadData.path)
      setLogoStorageUrl(urlData.publicUrl)

      const res = await fetch('/api/analyze-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: urlData.publicUrl }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Analiz başarısız')

      setAnalysis(result)
      setPrimaryColor(result.primary_color)
      setSecondaryColor(result.secondary_color)
      setTone(result.tone)
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : String(err))
    } finally {
      setAnalyzing(false)
    }
  }, [userId, logoPreview])

  const handleSave = async () => {
    if (!logoStorageUrl) { setSaveError('Logo yüklemek zorunludur.'); return }
    if (!profileName.trim()) { setSaveError('Profil adı gereklidir.'); return }
    if (!brandName.trim()) { setSaveError('Marka adı gereklidir.'); return }

    setSaving(true)
    setSaveError('')

    const { error } = await createClient().from('profiles').insert({
      user_id: userId,
      profile_name: profileName.trim(),
      brand_name: brandName.trim(),
      sector,
      tone,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      logo_url: logoStorageUrl,
      instagram_url: instagramUrl.trim(),
      brand_analysis: analysis,
    })

    if (error) {
      setSaveError(error.message)
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main style={{ maxWidth: 620, margin: '60px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard" style={{ color: '#0070f3', fontSize: 14 }}>← Dashboard</Link>
        <h1 style={{ marginTop: 8, marginBottom: 0 }}>Yeni Marka Profili</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Basic info */}
        <div>
          <label style={label}>Profil Adı *</label>
          <input style={input} value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="ör. Yaz Kampanyası" />
        </div>

        <div>
          <label style={label}>Marka Adı *</label>
          <input style={input} value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="ör. Acme Co." />
        </div>

        <div>
          <label style={label}>Instagram URL</label>
          <input style={input} value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/marka" />
        </div>

        <div>
          <label style={label}>Sektör</label>
          <select style={{ ...input, background: '#fff' }} value={sector} onChange={e => setSector(e.target.value)}>
            <option value="">Seçiniz</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Logo upload */}
        <div>
          <label style={label}>Logo *</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            disabled={!userId}
            style={{ fontSize: 14 }}
          />
          {!userId && <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Oturum yükleniyor...</p>}
        </div>

        {/* Logo preview */}
        {logoPreview && (
          <div>
            <img
              src={logoPreview}
              alt="Logo önizleme"
              style={{ maxWidth: 200, maxHeight: 200, border: '1px solid #eee', borderRadius: 4, display: 'block' }}
            />
          </div>
        )}

        {/* Analysis loading */}
        {analyzing && (
          <div style={{ padding: 16, background: '#f0f7ff', borderRadius: 6, fontSize: 14, color: '#0070f3' }}>
            ⏳ Logo analiz ediliyor...
          </div>
        )}

        {/* Analysis error */}
        {analyzeError && (
          <div style={{ padding: 12, background: '#fff0f0', borderRadius: 6, fontSize: 14, color: '#c00' }}>
            Analiz hatası: {analyzeError}
          </div>
        )}

        {/* Analysis results */}
        {analysis && (
          <div style={{ border: '1px solid #d0e8d0', borderRadius: 6, padding: 16, background: '#f6fff6' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#2a7a2a' }}>✓ Analiz Tamamlandı</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 12, color: '#666' }}>Görsel Stil</span>
                <p style={{ margin: '2px 0 0', fontSize: 14 }}>{analysis.visual_style}</p>
              </div>
              <div>
                <span style={{ fontSize: 12, color: '#666' }}>Ton</span>
                <div style={{ marginTop: 4 }}>
                  <span style={{ display: 'inline-block', padding: '2px 10px', background: '#e8f0fe', borderRadius: 12, fontSize: 13 }}>
                    {analysis.tone}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 12, color: '#666' }}>Marka Açıklaması</span>
              <p style={{ margin: '2px 0 0', fontSize: 14, lineHeight: 1.5 }}>{analysis.brand_description}</p>
            </div>
          </div>
        )}

        {/* Editable derived fields — shown once a logo is uploaded */}
        {(logoStorageUrl || analysis) && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={label}>Birincil Renk</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: primaryColor || '#ccc',
                      border: '1px solid #ccc', flexShrink: 0,
                    }}
                  />
                  <input
                    type="color"
                    value={primaryColor || '#000000'}
                    onChange={e => setPrimaryColor(e.target.value)}
                    style={{ width: 36, height: 32, padding: 0, border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    placeholder="#000000"
                    style={{ ...input, width: 90 }}
                  />
                </div>
              </div>

              <div>
                <label style={label}>İkincil Renk</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: secondaryColor || '#ccc',
                      border: '1px solid #ccc', flexShrink: 0,
                    }}
                  />
                  <input
                    type="color"
                    value={secondaryColor || '#ffffff'}
                    onChange={e => setSecondaryColor(e.target.value)}
                    style={{ width: 36, height: 32, padding: 0, border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    placeholder="#ffffff"
                    style={{ ...input, width: 90 }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={label}>Ton</label>
              <select style={{ ...input, background: '#fff' }} value={tone} onChange={e => setTone(e.target.value)}>
                <option value="">Seçiniz</option>
                {tones.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Save */}
        {saveError && (
          <p style={{ color: '#c00', fontSize: 14, margin: 0 }}>{saveError}</p>
        )}

        <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
          <button
            onClick={handleSave}
            disabled={saving || analyzing || !logoStorageUrl}
            style={{
              padding: '10px 28px',
              background: saving || analyzing || !logoStorageUrl ? '#ccc' : '#0070f3',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: saving || analyzing || !logoStorageUrl ? 'not-allowed' : 'pointer',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <Link href="/dashboard">
            <button style={{ padding: '10px 20px', background: '#fff', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', fontSize: 15 }}>
              İptal
            </button>
          </Link>
        </div>

      </div>
    </main>
  )
}
