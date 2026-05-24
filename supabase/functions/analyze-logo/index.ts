// Supabase Edge Function — deploy with:
//   supabase functions deploy analyze-logo
//   supabase secrets set GEMINI_API_KEY=your_key

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY secret is not set')

    const imageRes = await fetch(imageUrl)
    const buffer = await imageRes.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    const base64 = btoa(binary)
    const mimeType = imageRes.headers.get('content-type') ?? 'image/png'

    const prompt = `Analyze this brand logo. Return ONLY a raw JSON object — no markdown, no code fences, no explanation:
{"primary_color":"#hexcode","secondary_color":"#hexcode","tone":"one of: resmi/samimi/esprili/premium/sıcak","visual_style":"short description in Turkish","brand_description":"2-sentence visual identity description in Turkish"}`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: prompt },
          ]}],
          generationConfig: { temperature: 0.1 },
        }),
      }
    )

    const geminiData = await geminiRes.json()
    console.log('Raw Gemini response:', JSON.stringify(geminiData))

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    console.log('Gemini text output:', rawText)

    if (!rawText) throw new Error('Empty response from Gemini')

    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const analysis = JSON.parse(cleaned)

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('analyze-logo error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
