import { useNavigate } from 'react-router-dom'

export default function PageHeader({ title, backTo }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-10 bg-at-cream/90 backdrop-blur border-b border-at-border px-6 py-4 flex items-center gap-4">
      <button
        onClick={() => backTo ? navigate(backTo) : navigate(-1)}
        className="flex items-center gap-2 bg-white border border-at-border text-at-plum
                   font-display text-sm px-4 py-2 rounded-pill shadow-card
                   hover:-translate-y-0.5 hover:border-at-teal hover:shadow-glow
                   active:translate-y-0.5 transition-all duration-100"
      >
        ← Back
      </button>
      {title && <h1 className="font-display text-at-plum text-xl">{title}</h1>}
    </header>
  )
}
