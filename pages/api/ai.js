export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'No' })
  const { prompt, action } = req.body
  if (!prompt || !action) return res.status(400).json({ error: 'Missing' })
  const clean = prompt.replace(/<[^>]*>/g, '').trim().slice(0, 2000)
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are a YouTube SEO Expert. Be professional and concise.' },
          { role: 'user', content: clean }
        ],
        max_tokens: 1000
      })
    })
    const d = await r.json()
    if (!r.ok) return res.status(r.status).json({ error: d.error?.message || 'Error' })
    const text = d.choices?.[0]?.message?.content || ''
    return res.status(200).json({ result: text })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
