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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are a professional YouTube SEO Expert. Be professional, concise, and copy-pasteable.\n\n${sanitized}` }] }],
          generationConfig: { maxOutputTokens: 1000 }
        }),
      }
    );
    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'API error' });
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ result: text });
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
                      }
