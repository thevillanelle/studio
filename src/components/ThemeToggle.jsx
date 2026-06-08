import { useEffect, useState } from 'react'

const CITIES = [
  { key: 'nyc',    label: 'NYC',    icon: '🗽' },
  { key: 'paris',  label: 'Paris',  icon: '🗼' },
  { key: 'tokyo',  label: 'Tokyo',  icon: '🌸' },
  { key: 'london', label: 'London', icon: '☂️' },
  { key: 'lagos',  label: 'Lagos',  icon: '🌍' },
  { key: 'seoul',  label: 'Seoul',  icon: '✨' },
]

export default function ThemeToggle() {
  const [active, setActive] = useState(() => localStorage.getItem('theme-at') || 'nyc')

  useEffect(() => {
    const root = document.documentElement
    CITIES.forEach(c => root.classList.remove(c.key))
    if (active !== 'nyc') root.classList.add(active)
    localStorage.setItem('theme-at', active)
  }, [active])

  return (
    <div className="theme-switcher">
      {CITIES.map(c => (
        <button key={c.key} onClick={() => setActive(c.key)}
          className={`theme-btn ${active === c.key ? 'active' : ''}`}>
          {c.icon} {c.label}
        </button>
      ))}
    </div>
  )
}
