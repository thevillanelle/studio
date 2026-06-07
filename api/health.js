export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Cache-Control', 'no-store')

  const url    = process.env.VITE_SUPABASE_URL
  const key    = process.env.VITE_SUPABASE_ANON_KEY
  const app    = process.env.VITE_APP_NAME || 'unknown'

  if (!url || !key) {
    return res.status(500).json({
      status: 'degraded',
      app,
      supabase: 'error',
      error: 'Missing env vars',
      ts: new Date().toISOString(),
    })
  }

  try {
    // Ping Supabase REST API — a HEAD on the base URL returns 200 if the
    // project is up and the anon key is valid
    const start = Date.now()
    const ping = await fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })
    const supabaseMs = Date.now() - start

    if (!ping.ok && ping.status !== 400) {
      // 400 is acceptable — it means Supabase is up but needs a table name
      return res.status(200).json({
        status: 'degraded',
        app,
        supabase: 'error',
        supabase_status: ping.status,
        supabase_ms: supabaseMs,
        ts: new Date().toISOString(),
      })
    }

    return res.status(200).json({
      status: 'ok',
      app,
      supabase: 'ok',
      supabase_ms: supabaseMs,
      ts: new Date().toISOString(),
    })
  } catch (err) {
    return res.status(200).json({
      status: 'degraded',
      app,
      supabase: 'error',
      error: err.message,
      ts: new Date().toISOString(),
    })
  }
}
