import { NextResponse } from 'next/server'

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

const PROMPT = `Analyze this brand's visual identity. Return ONLY a raw JSON object — no markdown, no code fences, no explanation:
{"primary_color":"#hexcode","secondary_color":"#hexcode","accent_color":"#hexcode","tone":"one of: resmi/samimi/esprili/premium/sıcak","visual_style":"short description in Turkish","typography_feeling":"one of: bold/light/balanced","content_themes":["theme1","theme2","theme3"],"brand_description":"2-3 sentences in Turkish","suggested_price_segment":"one of: Ekonomik/Orta Segment/Premium","overall_aesthetic":"one sentence in Turkish"}`

export async function POST(request: Request) {
  try {
    const { logoUrl, screenshotUrl } = await request.json()

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured')

    // Build message content — Groq accepts public image URLs directly
    const content: unknown[] = [
      { type: 'image_url', image_url: { url: logoUrl } },
    ]
    if (screenshotUrl) {
      content.push({ type: 'image_url', image_url: { url: screenshotUrl } })
    }
    content.push({ type: 'text', text: PROMPT })

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content }],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    })

    const groqData = await groqRes.json()
    console.log('Raw Groq response:', JSON.stringify(groqData))

    if (groqData.error) {
      throw new Error(`Groq API hatası: ${groqData.error.message}`)
    }

    const rawText: string = groqData.choices?.[0]?.message?.content ?? ''
    console.log('Groq text output:', rawText)

    if (!rawText) throw new Error('Groq boş yanıt döndürdü')

    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const analysis = JSON.parse(cleaned)

    return NextResponse.json(analysis)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('analyze-brand error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
