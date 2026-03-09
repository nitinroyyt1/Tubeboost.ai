export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'No' })
  const { prompt, action } = req.body
  if (!prompt || !action) return res.status(400).json({ error: 'Missing' })
  const clean = prompt.replace(/<[^>]*>/g, '').trim().slice(0, 2000)
  const key = process.env.GEMINI_API_KEY
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'You are a YouTube SEO Expert.\n\n' + clean }] }] })
    })
    const d = await r.json()
    if (!r.ok) return res.status(r.status).json({ error: d.error?.message || 'Error' })
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return res.status(200).json({ result: text })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
