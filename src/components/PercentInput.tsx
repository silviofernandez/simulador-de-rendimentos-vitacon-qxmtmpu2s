import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface PercentInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> {
  value: number | undefined
  onChange: (value: number) => void
  decimals?: number
  suffix?: string
  min?: number
  max?: number
}

/**
 * Converte texto digitado para percentual numérico:
 * "16,5" -> 16.5
 * "16.5" -> 16.5
 * "16,5%" -> 16.5
 */
function parsePercentInput(text: string): number {
  if (!text || text.trim() === '') return 0
  const cleaned = text.replace(/[^0-9,.]/g, '').trim()
  if (!cleaned) return 0
  const normalized = cleaned.replace(',', '.')
  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * PercentInput:
 * - Não deixa zero residual no início (ex: digitar 15 em cima de 0 não vira 015).
 * - Ao focar quando 0 ou vazio: esvazia o campo.
 * - Ao desfocar: formata no padrão brasileiro com vírgula (ex: "16,5%").
 */
export const PercentInput = React.forwardRef<HTMLInputElement, PercentInputProps>(
  (
    {
      value,
      onChange,
      className,
      decimals = 1,
      suffix = '%',
      min = 0,
      max = 100,
      placeholder = '0%',
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [displayVal, setDisplayVal] = useState<string>('')
    const inputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
      if (!isFocused) {
        if (value === undefined || value === null) {
          setDisplayVal('')
        } else {
          const formatted = new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals,
          }).format(value)
          setDisplayVal(suffix ? `${formatted}${suffix}` : formatted)
        }
      }
    }, [value, isFocused, decimals, suffix])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      if (!value || value === 0) {
        setDisplayVal('')
      } else {
        // Sem o sufixo '%' no foco para facilitar digitação
        const formatted = new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: decimals,
        }).format(value)
        setDisplayVal(formatted)
      }
      onFocus?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      // Aceita dígitos, vírgula e ponto
      const sanitized = raw.replace(/[^0-9,.]/g, '')

      // Evita múltiplos separadores decimais
      const commas = (sanitized.match(/,/g) || []).length
      const dots = (sanitized.match(/\./g) || []).length
      if (commas > 1 || dots > 1 || (commas >= 1 && dots >= 1)) {
        return
      }

      // Remove zero inicial caso o usuário digite seguido de outro número
      let finalVal = sanitized
      if (/^0[0-9]+/.test(sanitized)) {
        finalVal = sanitized.replace(/^0+/, '')
      }

      setDisplayVal(finalVal)
      let parsed = parsePercentInput(finalVal)
      if (max !== undefined && parsed > max) parsed = max
      if (min !== undefined && parsed < min) parsed = min
      onChange(parsed)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      let parsed = parsePercentInput(displayVal)
      if (max !== undefined && parsed > max) parsed = max
      if (min !== undefined && parsed < min) parsed = min
      onChange(parsed)

      const formatted = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      }).format(parsed)
      setDisplayVal(suffix ? `${formatted}${suffix}` : formatted)
      onBlur?.(e)
    }

    return (
      <Input
        {...props}
        ref={(node) => {
          inputRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        type="text"
        inputMode="decimal"
        value={displayVal}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn('tabular-nums transition-colors', className)}
      />
    )
  },
)

PercentInput.displayName = 'PercentInput'
