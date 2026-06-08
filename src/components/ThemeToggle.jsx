import { useEffect, useState } from 'react'

const MODES = [{"key": "nyc", "label": "\ud83d\uddfd NYC"}, {"key": "paris", "label": "\ud83d\uddfc Paris"}, {"key": "tokyo", "label": "\ud83c\udf38 Tokyo"}, {"key": "london", "label": "\u2602\ufe0f London"}, {"key": "lagos", "label": "\ud83c\udf0d Lagos"}, {"key": "seoul", "label": "\u2728 Seoul"}]
const STORAGE_KEY = 'theme-at'
const DEFAULT = 'nyc'

export default function ThemeToggle() {
  const [active, setActive] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    MODES.forEach(m => root.classList.remove(m.key))
    if (active !== DEFAULT) root.classList.add(active)
    localStorage.setItem(STORAGE_KEY, active)
  }, [active])

  const current = MODES.find(m => m.key === active) || MODES[0]

  return (
    <div style={{position:'relative',zIndex:200}}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:'6px',
          padding:'6px 14px', borderRadius:'999px', fontSize:'12px',
          fontWeight:500, cursor:'pointer', whiteSpace:'nowrap',
          background:'var(--card-bg)', color:'var(--ink)',
          border:'1px solid var(--card-border)',
          backdropFilter:'blur(8px)',
          boxShadow:'0 2px 8px rgba(0,0,0,0.12)',
        }}>
        {current.label} <span style={{opacity:0.4,fontSize:'10px',marginLeft:'2px'}}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)}
            style={{position:'fixed',inset:0,zIndex:199}} />
          <div style={{
            position:'absolute', top:'calc(100% + 4px)', right:0,
            background:'var(--card-bg)', border:'1px solid var(--card-border)',
            borderRadius:'12px', overflow:'hidden', minWidth:'160px',
            boxShadow:'0 8px 32px rgba(0,0,0,0.18)', zIndex:200,
            backdropFilter:'blur(16px)',
          }}>
            {MODES.map(m => (
              <button key={m.key}
                onClick={() => { setActive(m.key); setOpen(false) }}
                style={{
                  display:'block', width:'100%', textAlign:'left',
                  padding:'10px 16px', fontSize:'13px', cursor:'pointer',
                  background: active === m.key ? 'var(--accent)' : 'transparent',
                  color: active === m.key ? 'white' : 'var(--ink)',
                  border:'none', transition:'background 0.15s',
                }}>
                {m.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
