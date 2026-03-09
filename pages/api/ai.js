export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const { prompt, action } = req.body
  if (!prompt || !action) {
    return res.status(400).json({ error: 'Missing fields' })
  }
  const clean = prompt.replace(/<[^>]*>/g, '').trim().slice(0, 2000)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
  const body = {
    contents: [{ parts: [{ text: 'You are a YouTube SEO Expert. Be professional and concise.\n\n' + clean }] }],
    generationConfig: { maxOutputTokens: 1000 }
  }
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const d = await r.json()
    if (!r.ok) return res.status(r.status).json({ error: d.error?.message || 'Error' })
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return res.status(200).json({ result: text })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
```
