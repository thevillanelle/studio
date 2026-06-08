import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle'

export default function PageHeader({ title, backTo }) {
  const navigate = useNavigate()
  return (
    <header style={{
      position:'sticky', top:0, zIndex:100,
      background:'color-mix(in srgb, var(--card-bg) 90%, transparent)',
      backdropFilter:'blur(16px)',
      borderBottom:'1px solid var(--card-border)',
      padding:'0 20px',
      height:'56px',
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px',
    }}>
      <button
        onClick={() => backTo ? navigate(backTo) : navigate(-1)}
        style={{
          display:'flex', alignItems:'center', gap:'6px',
          background:'var(--card-bg)', color:'var(--ink)',
          border:'1px solid var(--card-border)',
          padding:'6px 14px', borderRadius:'999px',
          fontSize:'13px', fontWeight:500, cursor:'pointer',
          flexShrink:0,
        }}>
        ← Back
      </button>
      {title && (
        <h1 style={{
          fontFamily:'var(--font-display, inherit)',
          fontSize:'16px', fontWeight:600,
          color:'var(--ink)', flex:1, textAlign:'center',
        }}>
          {title}
        </h1>
      )}
      <ThemeToggle />
    </header>
  )
}
