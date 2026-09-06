import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/calculos'

interface AppreciationChartProps {
  valorInicial: number
  valorizacaoPercent: number // 0 a 100
  dataInicioObra: Date
}

export function AppreciationChart({
  valorInicial,
  valorizacaoPercent,
  dataInicioObra,
}: AppreciationChartProps) {
  // Constrói a curva de valorização do início ao término da obra (3 anos / 36 meses)
  const chartData = useMemo(() => {
    const ano0 = dataInicioObra.getFullYear()
    const taxaTotal = valorizacaoPercent / 100

    // Curva gradual em 4 marcos temporais (Início, Ano 1, Ano 2, Entrega)
    return [
      {
        marco: `Abr/${ano0}`,
        ano: 'Início da Obra',
        valor: Math.round(valorInicial),
        ganhoPerc: 0,
      },
      {
        marco: `Dez/${ano0 + 1}`,
        ano: 'Fase Estrutural',
        valor: Math.round(valorInicial * (1 + taxaTotal * 0.35)),
        ganhoPerc: taxaTotal * 0.35 * 100,
      },
      {
        marco: `Dez/${ano0 + 2}`,
        ano: 'Fase de Acabamento',
        valor: Math.round(valorInicial * (1 + taxaTotal * 0.7)),
        ganhoPerc: taxaTotal * 0.7 * 100,
      },
      {
        marco: `Abr/${ano0 + 3}`,
        ano: 'Entrega das Chaves',
        valor: Math.round(valorInicial * (1 + taxaTotal)),
        ganhoPerc: taxaTotal * 100,
      },
    ]
  }, [valorInicial, valorizacaoPercent, dataInicioObra])

  const valorFinal = valorInicial * (1 + valorizacaoPercent / 100)
  const ganhoTotal = valorFinal - valorInicial

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5E6E64]">
            Valorização no Período de Obra
          </span>
          <div className="text-base font-bold text-[#1F2A24] flex items-center gap-2">
            <span>{formatCurrency(valorFinal)}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#0F6B4F]/10 text-[#0F6B4F]">
              +{formatPercent(valorizacaoPercent, 0)} ({formatCurrency(ganhoTotal)})
            </span>
          </div>
        </div>
      </div>

      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A227" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0F6B4F" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3DFD6" />
            <XAxis
              dataKey="marco"
              tickLine={false}
              axisLine={{ stroke: '#E3DFD6' }}
              tick={{ fill: '#5E6E64', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#5E6E64', fontSize: 10 }}
              tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
              domain={['dataMin - 20000', 'dataMax + 20000']}
              width={60}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-xl border border-[#E3DFD6] bg-white p-3 shadow-lg">
                      <p className="text-xs font-bold text-[#1F2A24]">
                        {data.marco} — {data.ano}
                      </p>
                      <p className="text-sm font-extrabold text-[#0F6B4F] mt-1 tabular-nums">
                        {formatCurrency(data.valor)}
                      </p>
                      <p className="text-[11px] text-[#C9A227] font-semibold mt-0.5">
                        +{formatPercent(data.ganhoPerc, 1)} de valorização
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke="#0F6B4F"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorVal)"
              dot={{ fill: '#C9A227', r: 4, stroke: '#FFFFFF', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#0F6B4F', stroke: '#FFFFFF', strokeWidth: 2 }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
