import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface CurrencyInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> {
  value: number | undefined
  onChange: (value: number) => void
  prefix?: string
  allowZero?: boolean
}

/**
 * Formata um número num formato brasileiro: "1.234,56" ou com prefixo "R$ 1.234,56"
 */
export function formatBRL(val: number, showPrefix = false): string {
  if (isNaN(val)) return ''
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
  return showPrefix ? `R$ ${formatted}` : formatted
}

/**
 * Converte string digitada livremente com separador de milhar e vírgula decimal para número.
 * Exemplos:
 * "300" -> 300
 * "300,50" -> 300.5
 * "1.234,56" -> 1234.56
 * "0" -> 0
 */
export function parseBRLInput(text: string): number {
  if (!text || text.trim() === '') return 0
  // Remove tudo exceto dígitos, vírgulas e pontos
  const cleaned = text.replace(/[^0-9,.]/g, '').trim()
  if (!cleaned) return 0

  // Se tiver vírgula e ponto (ex: 1.234,56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Padrão brasileiro: ponto é milhar, vírgula é decimal
    const normalized = cleaned.replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(normalized)
    return isNaN(parsed) ? 0 : parsed
  }

  // Se tiver apenas vírgula (ex: 300,50)
  if (cleaned.includes(',')) {
    const normalized = cleaned.replace(',', '.')
    const parsed = parseFloat(normalized)
    return isNaN(parsed) ? 0 : parsed
  }

  // Se tiver apenas ponto
  if (cleaned.includes('.')) {
    // Pode ser milhar como "1.000" ou decimal
    const parts = cleaned.split('.')
    if (parts.length === 2 && parts[1].length === 3) {
      // Provável milhar: 1.000 -> 1000
      const parsed = parseFloat(cleaned.replace(/\./g, ''))
      return isNaN(parsed) ? 0 : parsed
    }
    // Caso padrão ponto decimal
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  // Apenas dígitos
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * CurrencyInput
 * - Ao focar quando 0 ou vazio: esvazia o campo para digitação limpa (sem "0" residual no início).
 * - Aceita digitação flexível: o usuário pode digitar "300" ou "300,00" ou colar "1.500,50".
 * - Enquanto focado: exibe texto editável limpo. Se o valor for 0 no foco, o campo fica vazio.
 * - Ao desfocar (blur): formata com precisão brasileira "300,00" ou "1.234,56".
 * - Suporta prefixo opcional "R$ ".
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onChange,
      className,
      prefix,
      allowZero = true,
      placeholder = '0,00',
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [displayVal, setDisplayVal] = useState<string>('')
    const inputRef = useRef<HTMLInputElement | null>(null)

    // Sincroniza estado visual quando o valor muda externamente e não está focado
    useEffect(() => {
      if (!isFocused) {
        if (value === undefined || value === null || (value === 0 && !allowZero)) {
          setDisplayVal('')
        } else if (value === 0) {
          setDisplayVal(placeholder === '0' ? '0' : '0,00')
        } else {
          setDisplayVal(formatBRL(value, false))
        }
      }
    }, [value, isFocused, allowZero, placeholder])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      // Se for 0 ou vazio, deixa limpo para o usuário não ter zero na frente!
      if (!value || value === 0) {
        setDisplayVal('')
      } else {
        // Mostra o número de forma natural para edição
        // Se for inteiro redondo, ex: 300, mostra "300" para facilitar edição, ou "300,00"
        // Exibir formato amigável sem prefixo:
        const hasDecimals = value % 1 !== 0
        setDisplayVal(hasDecimals ? formatBRL(value, false) : value.toString())
      }
      onFocus?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      // Aceita apenas dígitos, vírgula e ponto
      const sanitized = raw.replace(/[^0-9,.]/g, '')

      // Impede múltiplos pontos/vírgulas
      const commas = (sanitized.match(/,/g) || []).length
      const dots = (sanitized.match(/\./g) || []).length
      if (commas > 1 || (commas >= 1 && dots >= 1)) {
        // Não adiciona segundo separador decimal
        return
      }

      // Se o usuário digitou e começou com '0' seguido de dígito (ex: "0300"), remove o 0 inicial
      let finalVal = sanitized
      if (/^0[0-9]+/.test(sanitized)) {
        finalVal = sanitized.replace(/^0+/, '')
      }

      setDisplayVal(finalVal)

      const parsed = parseBRLInput(finalVal)
      onChange(parsed)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      const parsed = parseBRLInput(displayVal)
      onChange(parsed)

      if (parsed === 0 && !allowZero) {
        setDisplayVal('')
      } else {
        setDisplayVal(formatBRL(parsed, false))
      }
      onBlur?.(e)
    }

    return (
      <div className="relative flex items-center w-full">
        {prefix && (
          <span className="absolute left-3 text-xs font-semibold text-[#5E6E64] pointer-events-none select-none">
            {prefix}
          </span>
        )}
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
          className={cn('tabular-nums transition-colors', prefix ? 'pl-8' : '', className)}
        />
      </div>
    )
  },
)

CurrencyInput.displayName = 'CurrencyInput'
