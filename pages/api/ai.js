export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { prompt, action } = req.body;
  if (!prompt || !action) {
    return res.status(400).json({ error: 'Missing prompt or action' });
  }
  const sanitized = prompt.replace(/<[^>]*>/g, '').trim().slice(0, 2000);
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are a professional YouTube SEO Expert. Be professional, concise, and copy-pasteable.',
        messages: [{ role: 'user', content: sanitized }],
      }),
    });
    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'API error' });
    }
    const data = await response.json();
    const text = data.content.map((b) => b.text || '').join('');
    return res.status(200).json({ result: text });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}
