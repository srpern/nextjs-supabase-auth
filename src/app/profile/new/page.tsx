'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

type Tier = 'hizli' | 'detayli' | 'cok_detayli'

interface Analysis {
  primary_color: string
  secondary_color: string
  accent_color: string
  tone: string
  visual_style: string
  typography_feeling: string
  content_themes: string[]
  brand_description: string
  suggested_price_segment: string
  overall_aesthetic: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SECTORS       = ['F&B', 'Güzellik/Bakım', 'Giyim', 'Hizmet', 'Perakende', 'Diğer']
const TONES         = ['resmi', 'samimi', 'esprili', 'premium', 'sıcak']
const PRICE_SEGS    = ['Ekonomik', 'Orta Segment', 'Premium']
const CONTENT_LANGS = ['Türkçe', 'İngilizce', 'Her ikisi']
const TYPO_PREFS    = ['Kalın/Bold', 'İnce/Light', 'Dengeli']
const ADDR_STYLES   = ['Sen', 'Siz']
const EMOJI_OPTS    = ['Hiç', 'Az', 'Orta', 'Çok']
const PUNCT_STYLES  = ['Standart', 'Noktalama yok', 'Çok noktalı']

const TYPO_MAP: Record<string, string> = {
  bold: 'Kalın/Bold', light: 'İnce/Light', balanced: 'Dengeli',
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const sInput: React.CSSProperties = {
  padding: '8px 12px', fontSize: 14, border: '1px solid #ccc',
  borderRadius: 4, width: '100%', boxSizing: 'border-box',
}
const sLabel: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#444',
}
function btnStyle(primary = true, disabled = false): React.CSSProperties {
  return {
    padding: '10px 24px', fontSize: 14, fontWeight: 600, borderRadius: 4,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: primary ? 'none' : '1px solid #ccc',
    background: disabled ? '#e0e0e0' : primary ? '#0070f3' : '#fff',
    color: disabled ? '#aaa' : primary ? '#fff' : '#333',
  }
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Badge({ children, green }: { children: React.ReactNode; green?: boolean }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', fontSize: 12, borderRadius: 12,
      background: green ? '#e6f4ea' : '#e8f0fe',
      color: green ? '#2d6a2d' : '#1a4ea6',
    }}>{children}</span>
  )
}

function RadioGroup({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <span style={sLabel}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => (
          <button key={opt} type="button" onClick={() => onChange(opt)} style={{
            padding: '6px 16px', fontSize: 13, borderRadius: 20, cursor: 'pointer',
            border: `1px solid ${value === opt ? '#0070f3' : '#ccc'}`,
            background: value === opt ? '#0070f3' : '#fff',
            color: value === opt ? '#fff' : '#333',
          }}>{opt}</button>
        ))}
      </div>
    </div>
  )
}

function ColorField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  const safe = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000'
  return (
    <div>
      <span style={sLabel}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: value || '#ccc', border: '1px solid #ddd', flexShrink: 0 }} />
        <input type="color" value={safe} onChange={e => onChange(e.target.value)}
          style={{ width: 34, height: 28, padding: 0, border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }} />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder="#000000" style={{ ...sInput, width: 88 }} />
      </div>
    </div>
  )
}

// ─── Analysis result card ─────────────────────────────────────────────────────

function AnalysisCard({ analysis }: { analysis: Analysis }) {
  return (
    <div style={{ border: '1px solid #b8d4ff', borderRadius: 8, padding: 20, background: '#f4f8ff' }}>
      <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 15, color: '#1a4ea6' }}>
        🤖 Gemini Analiz Sonucu
      </p>

      {/* Colors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
        {([
          ['Birincil Renk', analysis.primary_color],
          ['İkincil Renk', analysis.secondary_color],
          ['Vurgu Rengi', analysis.accent_color],
        ] as [string, string][]).map(([lbl, clr]) => (
          <div key={lbl}>
            <span style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>{lbl}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: clr || '#ccc', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{clr}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        {analysis.tone && (
          <span style={{ fontSize: 12, color: '#666' }}>Ton: <Badge>{analysis.tone}</Badge></span>
        )}
        {analysis.typography_feeling && (
          <span style={{ fontSize: 12, color: '#666' }}>Tipografi: <Badge>{analysis.typography_feeling}</Badge></span>
        )}
        {analysis.suggested_price_segment && (
          <span style={{ fontSize: 12, color: '#666' }}>Segment: <Badge green>{analysis.suggested_price_segment}</Badge></span>
        )}
      </div>

      {/* Visual style */}
      {analysis.visual_style && (
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 2 }}>Görsel Stil</span>
          <p style={{ margin: 0, fontSize: 14 }}>{analysis.visual_style}</p>
        </div>
      )}

      {/* Content themes */}
      {analysis.content_themes?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 6 }}>İçerik Temaları</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {analysis.content_themes.map((t, i) => <Badge key={i}>{t}</Badge>)}
          </div>
        </div>
      )}

      {/* Brand description */}
      {analysis.brand_description && (
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 2 }}>Marka Açıklaması</span>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{analysis.brand_description}</p>
        </div>
      )}

      {/* Overall aesthetic */}
      {analysis.overall_aesthetic && (
        <div>
          <span style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 2 }}>Genel Estetik</span>
          <p style={{ margin: 0, fontSize: 14 }}>{analysis.overall_aesthetic}</p>
        </div>
      )}
    </div>
  )
}

// ─── Tier selection screen ────────────────────────────────────────────────────

const TIER_DEFS = [
  {
    key: 'hizli' as Tier,
    title: 'Hızlı Profil',
    time: '~2 dakika',
    desc: 'Hemen başlamak isteyenler için',
    color: '#4caf50',
    items: [
      'Profil adı & marka adı',
      'Sektör & içerik dili',
      'Logo yükle + Gemini analizi',
    ],
  },
  {
    key: 'detayli' as Tier,
    title: 'Detaylı Profil',
    time: '~5 dakika',
    desc: 'Daha kapsamlı marka kimliği',
    color: '#0070f3',
    items: [
      'Hızlı Profil\'deki her şey',
      'Instagram screenshot analizi',
      'Fiyat segmenti & tipografi',
      'Rakip / ilham hesapları',
      'Hitap tarzı & emoji kullanımı',
    ],
  },
  {
    key: 'cok_detayli' as Tier,
    title: 'Çok Detaylı Profil',
    time: '~10 dakika',
    desc: 'Tam marka kişiliği & hedef kitle',
    color: '#9c27b0',
    items: [
      'Detaylı Profil\'deki her şey',
      'Hedef kitle (yaş, cinsiyet, ilgi)',
      'Noktalama & dil tercihleri',
      'Asla / her zaman kullanılacak kelimeler',
    ],
  },
] as const

function TierSelection({ onSelect }: { onSelect: (t: Tier) => void }) {
  return (
    <main style={{ maxWidth: 820, margin: '60px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 8 }}>
        <Link href="/dashboard" style={{ color: '#0070f3', fontSize: 14 }}>← Dashboard</Link>
      </div>
      <h1 style={{ marginBottom: 6, marginTop: 8 }}>Yeni Marka Profili</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>Ne kadar detaylı bir profil oluşturmak istiyorsunuz?</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {TIER_DEFS.map(t => (
          <div key={t.key} style={{
            border: `2px solid ${t.color}`, borderRadius: 10, padding: 20,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 16, color: t.color }}>{t.title}</h2>
              <span style={{ fontSize: 11, color: '#999', background: '#f5f5f5', padding: '2px 8px', borderRadius: 10, flexShrink: 0, marginLeft: 8 }}>
                {t.time}
              </span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#666' }}>{t.desc}</p>
            <ul style={{ margin: '0 0 16px', paddingLeft: 16, fontSize: 13, color: '#444', lineHeight: 1.9, flex: 1 }}>
              {t.items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <button type="button" onClick={() => onSelect(t.key)} style={{
              width: '100%', padding: '9px', background: t.color,
              color: '#fff', border: 'none', borderRadius: 5,
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>Seç →</button>
          </div>
        ))}
      </div>
    </main>
  )
}

// ─── Main form component ──────────────────────────────────────────────────────

export default function NewProfilePage() {
  const router = useRouter()
  const [userId, setUserId]     = useState('')
  const [tier, setTier]         = useState<Tier | null>(null)
  const [step, setStep]         = useState(1)

  // Step 1 — basic
  const [profileName, setProfileName] = useState('')
  const [brandName, setBrandName]     = useState('')

  // Files & previews
  const [logoFile, setLogoFile]               = useState<File | null>(null)
  const [logoPreview, setLogoPreview]         = useState('')
  const [screenshotFile, setScreenshotFile]   = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState('')

  // Storage URLs (set after upload on "Analiz Et")
  const [logoStorageUrl, setLogoStorageUrl]             = useState('')
  const [screenshotStorageUrl, setScreenshotStorageUrl] = useState('')

  // Analysis
  const [analysis, setAnalysis]       = useState<Analysis | null>(null)
  const [analyzing, setAnalyzing]     = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')

  // Auto-filled + editable
  const [primaryColor, setPrimaryColor]   = useState('#000000')
  const [secondaryColor, setSecondaryColor] = useState('#ffffff')
  const [accentColor, setAccentColor]     = useState('#cccccc')
  const [tone, setTone]                   = useState('')

  // Step 2
  const [sector, setSector]                       = useState('')
  const [priceSegment, setPriceSegment]           = useState('')
  const [contentLanguage, setContentLanguage]     = useState('')
  const [competitorAccounts, setCompetitorAccounts] = useState('')
  const [typographyPreference, setTypographyPreference] = useState('')
  const [addressStyle, setAddressStyle]           = useState('')
  const [emojiUsage, setEmojiUsage]               = useState('')

  // Step 3 (cok_detayli only)
  const [ageMin, setAgeMin]                   = useState(18)
  const [ageMax, setAgeMax]                   = useState(35)
  const [gender, setGender]                   = useState<string[]>([])
  const [interests, setInterests]             = useState('')
  const [punctuationStyle, setPunctuationStyle] = useState('')
  const [neverWords, setNeverWords]           = useState('')
  const [alwaysWords, setAlwaysWords]         = useState('')

  // Save
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setAnalysis(null)
    setLogoStorageUrl('')
    setAnalyzeError('')
  }

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    setScreenshotFile(file)
    setScreenshotPreview(URL.createObjectURL(file))
    setAnalysis(null)
    setScreenshotStorageUrl('')
  }

  const handleAnalyze = useCallback(async () => {
    if (!logoFile || !userId) return
    setAnalyzing(true)
    setAnalyzeError('')
    setAnalysis(null)

    try {
      const supabase = createClient()
      const logoExt = logoFile.name.split('.').pop() ?? 'png'
      const { data: logoUp, error: logoErr } = await supabase.storage
        .from('brand-assets')
        .upload(`${userId}/${Date.now()}_logo.${logoExt}`, logoFile, { upsert: false })
      if (logoErr) throw new Error(logoErr.message)
      const { data: { publicUrl: logoUrl } } = supabase.storage.from('brand-assets').getPublicUrl(logoUp.path)
      setLogoStorageUrl(logoUrl)

      let screenshotUrl: string | null = null
      if (screenshotFile) {
        const ssExt = screenshotFile.name.split('.').pop() ?? 'png'
        const { data: ssUp, error: ssErr } = await supabase.storage
          .from('brand-assets')
          .upload(`${userId}/${Date.now()}_ss.${ssExt}`, screenshotFile, { upsert: false })
        if (ssErr) throw new Error(ssErr.message)
        const { data: { publicUrl } } = supabase.storage.from('brand-assets').getPublicUrl(ssUp.path)
        screenshotUrl = publicUrl
        setScreenshotStorageUrl(publicUrl)
      }

      const res = await fetch('/api/analyze-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl, screenshotUrl }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Analiz başarısız')

      setAnalysis(result)
      setPrimaryColor(result.primary_color ?? '#000000')
      setSecondaryColor(result.secondary_color ?? '#ffffff')
      setAccentColor(result.accent_color ?? '#cccccc')
      setTone(result.tone ?? '')
      if (result.typography_feeling) setTypographyPreference(TYPO_MAP[result.typography_feeling] ?? 'Dengeli')
      if (result.suggested_price_segment) setPriceSegment(result.suggested_price_segment)
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : String(err))
    } finally {
      setAnalyzing(false)
    }
  }, [logoFile, screenshotFile, userId])

  const handleGenderToggle = (g: string) => {
    if (g === 'Hepsi') {
      setGender(['Hepsi'])
    } else {
      setGender(prev => {
        const without = prev.filter(x => x !== 'Hepsi')
        return without.includes(g) ? without.filter(x => x !== g) : [...without, g]
      })
    }
  }

  const handleSave = async () => {
    if (!profileName.trim()) { setSaveError('Profil adı gereklidir.'); return }
    if (!brandName.trim())   { setSaveError('Marka adı gereklidir.'); return }
    if (!logoStorageUrl)     { setSaveError('Logo analizi tamamlanmalıdır.'); return }
    setSaving(true)
    setSaveError('')

    const payload: Record<string, unknown> = {
      user_id: userId,
      profile_name: profileName.trim(),
      brand_name: brandName.trim(),
      logo_url: logoStorageUrl,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_color: accentColor,
      tone,
      brand_analysis: analysis,
      profile_tier: tier,
      sector,
      content_language: contentLanguage,
    }

    if (tier !== 'hizli') {
      payload.screenshot_url      = screenshotStorageUrl || null
      payload.price_segment       = priceSegment
      payload.typography_preference = typographyPreference
      payload.competitor_accounts = competitorAccounts.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)
      payload.brand_language = {
        address_style: addressStyle,
        emoji_usage: emojiUsage,
        ...(tier === 'cok_detayli' ? {
          punctuation_style: punctuationStyle,
          never_words: neverWords.split(',').map(s => s.trim()).filter(Boolean),
          always_words: alwaysWords.split(',').map(s => s.trim()).filter(Boolean),
        } : {}),
      }
    }

    if (tier === 'cok_detayli') {
      payload.target_audience = {
        age_min: ageMin,
        age_max: ageMax,
        gender,
        interests: interests.split(',').map(s => s.trim()).filter(Boolean),
      }
    }

    const { error } = await createClient().from('profiles').insert(payload)
    if (error) { setSaveError(error.message); setSaving(false); return }
    router.push('/dashboard')
  }

  // ── Tier selection ──────────────────────────────────────────────────────────
  if (!tier) {
    return <TierSelection onSelect={(t) => { setTier(t); setStep(1) }} />
  }

  const totalSteps   = tier === 'hizli' ? 1 : tier === 'detayli' ? 2 : 3
  const canAnalyze   = !!logoFile && !analyzing && !!userId
  const analysisReady = !!analysis && !!logoStorageUrl

  // ── Shared layout wrapper ───────────────────────────────────────────────────
  const wrap = (children: React.ReactNode) => (
    <main style={{ maxWidth: 680, margin: '60px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button type="button"
          onClick={() => step > 1 ? setStep(s => s - 1) : setTier(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0070f3', fontSize: 14, padding: 0, flexShrink: 0 }}>
          ← Geri
        </button>
        <h1 style={{ margin: 0, fontSize: 20, flex: 1 }}>
          {tier === 'hizli' ? 'Hızlı Profil' : tier === 'detayli' ? 'Detaylı Profil' : 'Çok Detaylı Profil'}
        </h1>
        {totalSteps > 1 && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff',
                background: step === i + 1 ? '#0070f3' : step > i + 1 ? '#4caf50' : '#ddd',
              }}>{i + 1}</div>
            ))}
          </div>
        )}
      </div>
      {children}
    </main>
  )

  // ── Logo + screenshot + analyze section (shared across all tiers in step 1) ─
  const logoSection = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Logo upload */}
      <div>
        <label style={sLabel}>Logo *</label>
        <input type="file" accept="image/*" onChange={handleLogoChange}
          disabled={!userId} style={{ fontSize: 14 }} />
        {logoPreview && (
          <img src={logoPreview} alt="Logo önizleme" style={{
            marginTop: 10, maxWidth: 160, maxHeight: 160, display: 'block',
            border: '1px solid #eee', borderRadius: 4,
          }} />
        )}
      </div>

      {/* Screenshot — hidden for hizli */}
      {tier !== 'hizli' && (
        <div>
          <label style={sLabel}>Instagram Screenshot <span style={{ fontWeight: 400, color: '#999' }}>(opsiyonel)</span></label>
          <input type="file" accept="image/*" onChange={handleScreenshotChange}
            disabled={!userId} style={{ fontSize: 14 }} />
          {screenshotPreview && (
            <img src={screenshotPreview} alt="Screenshot önizleme" style={{
              marginTop: 10, maxWidth: 160, maxHeight: 160, display: 'block',
              border: '1px solid #eee', borderRadius: 4,
            }} />
          )}
        </div>
      )}

      {/* Analyze button */}
      <div>
        <button type="button" onClick={handleAnalyze}
          disabled={!canAnalyze} style={btnStyle(true, !canAnalyze)}>
          {analyzing ? '⏳ Analiz ediliyor...' : analysis ? '🔄 Yeniden Analiz Et' : '🔍 Analiz Et'}
        </button>
        {!logoFile && (
          <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Önce logo yükleyin.</p>
        )}
      </div>

      {/* Error */}
      {analyzeError && (
        <div style={{ padding: 12, background: '#fff0f0', borderRadius: 6, fontSize: 14, color: '#c00' }}>
          Hata: {analyzeError}
        </div>
      )}

      {/* Full analysis result card */}
      {analysis && <AnalysisCard analysis={analysis} />}

      {/* Editable auto-filled fields */}
      {analysis && (
        <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 16, background: '#fafafa' }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 600, color: '#555' }}>
            ✏️ Düzenlenebilir Analiz Sonuçları
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
            <ColorField label="Birincil Renk" value={primaryColor} onChange={setPrimaryColor} />
            <ColorField label="İkincil Renk"  value={secondaryColor} onChange={setSecondaryColor} />
            <ColorField label="Vurgu Rengi"   value={accentColor} onChange={setAccentColor} />
          </div>
          <RadioGroup label="Ton" options={TONES} value={tone} onChange={setTone} />
        </div>
      )}
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // HIZLI — single step
  // ══════════════════════════════════════════════════════════════════════════
  if (tier === 'hizli') {
    return wrap(
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={sLabel}>Profil Adı *</label>
          <input style={sInput} value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="ör. Yaz Kampanyası" />
        </div>
        <div>
          <label style={sLabel}>Marka Adı *</label>
          <input style={sInput} value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="ör. Acme Co." />
        </div>
        <div>
          <label style={sLabel}>Sektör</label>
          <select style={{ ...sInput, background: '#fff' }} value={sector} onChange={e => setSector(e.target.value)}>
            <option value="">Seçiniz</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <RadioGroup label="İçerik Dili" options={CONTENT_LANGS} value={contentLanguage} onChange={setContentLanguage} />

        <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
        {logoSection}

        {saveError && <p style={{ color: '#c00', fontSize: 14, margin: 0 }}>{saveError}</p>}
        <button type="button" onClick={handleSave}
          disabled={saving || !analysisReady}
          style={btnStyle(true, saving || !analysisReady)}>
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAYLI / COK_DETAYLI — Step 1: Visual Identity
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 1) {
    return wrap(
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={sLabel}>Profil Adı *</label>
          <input style={sInput} value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="ör. Yaz Kampanyası" />
        </div>
        <div>
          <label style={sLabel}>Marka Adı *</label>
          <input style={sInput} value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="ör. Acme Co." />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
        {logoSection}

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
          <button type="button" onClick={() => setStep(2)}
            disabled={!analysisReady}
            style={btnStyle(true, !analysisReady)}
            title={!analysisReady ? 'Önce analiz tamamlayın' : ''}>
            İleri →
          </button>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAYLI / COK_DETAYLI — Step 2: Brand Details
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 2) {
    const isLast = tier === 'detayli'
    return wrap(
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={sLabel}>Sektör</label>
          <select style={{ ...sInput, background: '#fff' }} value={sector} onChange={e => setSector(e.target.value)}>
            <option value="">Seçiniz</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <RadioGroup label="Fiyat Segmenti"   options={PRICE_SEGS}    value={priceSegment}        onChange={setPriceSegment} />
        <RadioGroup label="İçerik Dili"      options={CONTENT_LANGS} value={contentLanguage}     onChange={setContentLanguage} />
        <RadioGroup label="Tipografi Tercihi" options={TYPO_PREFS}   value={typographyPreference} onChange={setTypographyPreference} />
        <RadioGroup label="Hitap Tarzı"      options={ADDR_STYLES}   value={addressStyle}        onChange={setAddressStyle} />
        <RadioGroup label="Emoji Kullanımı"  options={EMOJI_OPTS}    value={emojiUsage}          onChange={setEmojiUsage} />
        <div>
          <label style={sLabel}>
            Rakip / İlham Hesapları <span style={{ fontWeight: 400, color: '#999' }}>(virgülle ayırın, max 3)</span>
          </label>
          <input style={sInput} value={competitorAccounts}
            onChange={e => setCompetitorAccounts(e.target.value)}
            placeholder="@hesap1, @hesap2, @hesap3" />
        </div>

        {saveError && <p style={{ color: '#c00', fontSize: 14, margin: 0 }}>{saveError}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
          {isLast ? (
            <button type="button" onClick={handleSave}
              disabled={saving} style={btnStyle(true, saving)}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          ) : (
            <button type="button" onClick={() => setStep(3)} style={btnStyle()}>
              İleri →
            </button>
          )}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COK_DETAYLI — Step 3: Audience & Voice
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 3) {
    return wrap(
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Target audience */}
        <div>
          <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 16 }}>Hedef Kitle</p>

          {/* Age sliders */}
          <div style={{ marginBottom: 18 }}>
            <label style={sLabel}>Yaş Aralığı: <strong>{ageMin} – {ageMax}</strong></label>
            {[
              { label: 'Min', value: ageMin, onChange: (v: number) => setAgeMin(Math.min(v, ageMax - 1)) },
              { label: 'Max', value: ageMax, onChange: (v: number) => setAgeMax(Math.max(v, ageMin + 1)) },
            ].map(({ label, value, onChange }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#666', minWidth: 28 }}>{label}</span>
                <input type="range" min={18} max={65} value={value}
                  onChange={e => onChange(Number(e.target.value))}
                  style={{ flex: 1 }} />
                <span style={{ fontSize: 13, minWidth: 24, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Gender */}
          <div style={{ marginBottom: 16 }}>
            <label style={sLabel}>Cinsiyet</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Kadın', 'Erkek', 'Hepsi'].map(g => (
                <button key={g} type="button" onClick={() => handleGenderToggle(g)} style={{
                  padding: '6px 18px', fontSize: 13, borderRadius: 20, cursor: 'pointer',
                  border: `1px solid ${gender.includes(g) ? '#0070f3' : '#ccc'}`,
                  background: gender.includes(g) ? '#0070f3' : '#fff',
                  color: gender.includes(g) ? '#fff' : '#333',
                }}>{g}</button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label style={sLabel}>İlgi Alanları <span style={{ fontWeight: 400, color: '#999' }}>(virgülle ayırın)</span></label>
            <input style={sInput} value={interests} onChange={e => setInterests(e.target.value)}
              placeholder="moda, yaşam tarzı, seyahat" />
          </div>
        </div>

        {/* Brand language */}
        <div>
          <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 16 }}>Marka Dili</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <RadioGroup label="Hitap Tarzı"     options={ADDR_STYLES}   value={addressStyle}     onChange={setAddressStyle} />
            <RadioGroup label="Emoji Kullanımı" options={EMOJI_OPTS}    value={emojiUsage}       onChange={setEmojiUsage} />
            <RadioGroup label="Noktalama Stili" options={PUNCT_STYLES}  value={punctuationStyle} onChange={setPunctuationStyle} />
            <div>
              <label style={sLabel}>Asla Kullanılmayacak Kelimeler <span style={{ fontWeight: 400, color: '#999' }}>(virgülle)</span></label>
              <input style={sInput} value={neverWords} onChange={e => setNeverWords(e.target.value)}
                placeholder="ucuz, indirim" />
            </div>
            <div>
              <label style={sLabel}>Her Zaman Kullanılacak Kelimeler <span style={{ fontWeight: 400, color: '#999' }}>(virgülle)</span></label>
              <input style={sInput} value={alwaysWords} onChange={e => setAlwaysWords(e.target.value)}
                placeholder="kalite, özgün" />
            </div>
          </div>
        </div>

        {saveError && <p style={{ color: '#c00', fontSize: 14, margin: 0 }}>{saveError}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
          <button type="button" onClick={handleSave}
            disabled={saving} style={btnStyle(true, saving)}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
