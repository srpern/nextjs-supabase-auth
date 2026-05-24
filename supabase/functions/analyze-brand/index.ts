// Supabase Edge Function — deploy with:
//   supabase functions deploy analyze-brand
//   supabase secrets set GROQ_API_KEY=your_key

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

const PROMPT = `Analyze this brand's visual identity. Return ONLY a raw JSON object — no markdown, no code fences, no explanation:
{"primary_color":"#hexcode","secondary_color":"#hexcode","accent_color":"#hexcode","tone":"one of: resmi/samimi/esprili/premium/sıcak","visual_style":"short description in Turkish","typography_feeling":"one of: bold/light/balanced","content_themes":["theme1","theme2","theme3"],"brand_description":"2-3 sentences in Turkish","suggested_price_segment":"one of: Ekonomik/Orta Segment/Premium","overall_aesthetic":"one sentence in Turkish"}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { logoUrl, screenshotUrl } = await req.json()

    const apiKey = Deno.env.get('GROQ_API_KEY')
    if (!apiKey) throw new Error('GROQ_API_KEY secret is not set')

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

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('analyze-brand error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
