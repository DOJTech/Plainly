// Server-side proxy: keeps your API key secret and calls Claude.
const hits = new Map(); // simple per-IP limit (best effort, resets when the function restarts)
const LIMIT = 20, WINDOW = 10 * 60 * 1000;

const reply = (code, obj) => ({
  statusCode: code,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(obj),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return reply(500, { error: 'Server is missing ANTHROPIC_API_KEY' });

  const ip = (event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW);
  if (recent.length >= LIMIT) return reply(429, { error: 'Too many requests, try again soon' });
  recent.push(now);
  hits.set(ip, recent);

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Bad JSON' }); }
  const prompt = String(body.prompt || '').slice(0, 20000);
  if (!prompt) return reply(400, { error: 'Missing prompt' });
  const images = (Array.isArray(body.images) ? body.images : [])
    .filter((i) => i && typeof i.data === 'string' && i.data.length < 5000000)
    .slice(0, 2);

  const content = [
    ...images.map((i) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: i.data } })),
    { type: 'text', text: prompt },
  ];

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content }],
      }),
    });
    if (!r.ok) return reply(r.status === 429 ? 429 : 502, { error: 'AI service error' });
    const data = await r.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    return reply(200, { text });
  } catch (e) {
    return reply(502, { error: 'Could not reach the AI service' });
  }
};
