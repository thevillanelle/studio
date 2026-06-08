import { useEffect, useRef } from 'react'

const GRADIENTS = [
  "linear-gradient(135deg, #FDF6F7 0%, #F0D8FF 50%, #D8EEFF 100%)",
  "linear-gradient(135deg, #F0D8FF 0%, #FFE0F5 50%, #FFF0D8 100%)",
  "linear-gradient(135deg, #D8EEFF 0%, #E8FFD8 50%, #FFEFD8 100%)",
  "linear-gradient(135deg, #FFF0D8 0%, #FFD8E8 50%, #E8D8FF 100%)",
  "linear-gradient(135deg, #E8D8FF 0%, #D8F0FF 50%, #D8FFE8 100%)",
  "linear-gradient(135deg, #D8FFE8 0%, #FFE8D8 50%, #FFD8F0 100%)",
  "linear-gradient(135deg, #FFD8F0 0%, #E0D8FF 50%, #D8F0FF 100%)",
  "linear-gradient(135deg, #D8F0FF 0%, #FFF0D8 50%, #F0FFD8 100%)",
]

export default function QuizBackground({ step, total, children, style }) {
  const progress = total > 0 ? step / total : 0
  const idx = Math.min(Math.floor(progress * GRADIENTS.length), GRADIENTS.length - 1)

  return (
    <div style={{
      minHeight: '100vh',
      background: GRADIENTS[idx],
      backgroundAttachment: 'fixed',
      transition: 'background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      ...style,
    }}>
      {children}
    </div>
  )
}

export const DARK_GRADIENTS = [
  "linear-gradient(135deg, #09090f 0%, #14081a 50%, #0a1020 100%)",
  "linear-gradient(135deg, #14081a 0%, #0a1420 50%, #0a1420 100%)",
  "linear-gradient(135deg, #0a1020 0%, #08140a 50%, #140a08 100%)",
  "linear-gradient(135deg, #140a08 0%, #1a0814 50%, #0a0814 100%)",
]

export function DarkQuizBackground({ step, total, children }) {
  const progress = total > 0 ? step / total : 0
  const idx = Math.min(Math.floor(progress * DARK_GRADIENTS.length), DARK_GRADIENTS.length - 1)
  return (
    <div style={{
      minHeight: '100vh',
      background: DARK_GRADIENTS[idx],
      backgroundAttachment: 'fixed',
      transition: 'background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      {children}
    </div>
  )
}
