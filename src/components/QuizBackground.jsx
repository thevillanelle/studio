import { useEffect, useRef } from 'react'

// Light gradients — cycle through hues as you progress
const LIGHT_STOPS = [
  ["#FDF6F7","#F0D8FF","#D8EEFF"],
  ["#F0D8FF","#FFE0F5","#FFF0D8"],
  ["#D8EEFF","#E8FFD8","#FFEFD8"],
  ["#FFF0D8","#FFD8E8","#E8D8FF"],
  ["#E8D8FF","#D8F0FF","#D8FFE8"],
  ["#D8FFE8","#FFE8D8","#FFD8F0"],
  ["#FFD8F0","#E0D8FF","#D8F0FF"],
  ["#D8F0FF","#FFF0D8","#F0FFD8"],
]

// Dark gradients
const DARK_STOPS = [
  ["#09090f","#14081a","#0a1020"],
  ["#0a1420","#14081a","#0a0a14"],
  ["#0a1020","#08140a","#140a08"],
  ["#140a08","#1a0814","#0a0814"],
]

function lerp(a, b, t) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ar = (pa >> 16) & 0xff, ag = (pa >> 8) & 0xff, ab = pa & 0xff
  const br = (pb >> 16) & 0xff, bg = (pb >> 8) & 0xff, bb = pb & 0xff
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`
}

function useAnimatedGradient(stops, speed = 0.0008) {
  const ref = useRef(null)
  const tRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    let last = performance.now()
    const animate = (now) => {
      const dt = now - last
      last = now
      tRef.current = (tRef.current + dt * speed) % stops.length
      const idx = Math.floor(tRef.current)
      const next = (idx + 1) % stops.length
      const frac = tRef.current - idx
      const c0 = lerp(stops[idx][0], stops[next][0], frac)
      const c1 = lerp(stops[idx][1], stops[next][1], frac)
      const c2 = lerp(stops[idx][2], stops[next][2], frac)
      if (ref.current) {
        ref.current.style.background =
          `linear-gradient(135deg, ${c0} 0%, ${c1} 50%, ${c2} 100%)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return ref
}

export default function QuizBackground({ children, style }) {
  const ref = useAnimatedGradient(LIGHT_STOPS)
  return (
    <div ref={ref} style={{ minHeight:'100vh', transition:'none', ...style }}>
      {children}
    </div>
  )
}

export function DarkQuizBackground({ children }) {
  const ref = useAnimatedGradient(DARK_STOPS, 0.0005)
  return (
    <div ref={ref} style={{ minHeight:'100vh' }}>
      {children}
    </div>
  )
}
