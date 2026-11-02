// Minimal Upstash Redis REST client (no dependencies).
// Works with the env vars Vercel adds when you connect "Upstash for Redis"
// from the Vercel Marketplace (KV_REST_API_*), or plain UPSTASH_REDIS_REST_*.

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || ''
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ''

export const hasDb = () => Boolean(URL_ && TOKEN)

async function call(path, body) {
  const res = await fetch(URL_ + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Redis HTTP ${res.status}`)
  return res.json()
}

/** Run one command, e.g. cmd('GET', 'key'). */
export async function cmd(...args) {
  const out = await call('', args.map(String))
  if (out.error) throw new Error(out.error)
  return out.result
}

/** Run several commands in one round trip. Returns an array of results. */
export async function pipeline(commands) {
  if (!commands.length) return []
  const out = await call('/pipeline', commands.map((c) => c.map(String)))
  return out.map((r) => {
    if (r.error) throw new Error(r.error)
    return r.result
  })
}

export async function getJSON(key) {
  const v = await cmd('GET', key)
  if (v == null) return null
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

export const setJSON = (key, value) => cmd('SET', key, JSON.stringify(value))
