import React, { useState, useEffect } from 'react'

interface AnimatedCounterProps {
  value: number
  formatter?: (val: number) => string
  duration?: number
}

export function AnimatedCounter({
  value,
  formatter = (v) => v.toString(),
  duration = 300,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    let startTimestamp: number | null = null
    const startValue = displayValue
    const endValue = value

    if (startValue === endValue) return

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const current = startValue + (endValue - startValue) * progress
      setDisplayValue(current)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else {
        setDisplayValue(endValue)
      }
    }

    const animId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(animId)
  }, [value, duration])

  return <span className="tabular-nums">{formatter(displayValue)}</span>
}
