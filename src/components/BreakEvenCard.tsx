import { PontoEquilibrio } from '@/types/simulador'
import { formatCurrency, formatPercent } from '@/lib/calculos'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Scale, AlertCircle, CheckCircle2, TrendingUp, Target } from 'lucide-react'

interface BreakEvenCardProps {
  pontoEquilibrio: PontoEquilibrio
  diariaAtual: number
  ocupacaoAtualPerc: number
  comFinanciamento: boolean
}

export function BreakEvenCard({
  pontoEquilibrio,
  diariaAtual,
  ocupacaoAtualPerc,
  comFinanciamento,
}: BreakEvenCardProps) {
  const {
    ocupacaoMinimaPerc,
    diasMinimosOcupados,
    diariaMinima,
    receitaBrutaMinima,
    custoTotalComFinanciamento,
    equilibrioAtingivel,
  } = pontoEquilibrio

  // Matriz de sensibilidade simples: 3 diárias (-15%, atual, +15%) x 3 ocupações
  const precosTeste = [Math.round(diariaAtual * 0.85), diariaAtual, Math.round(diariaAtual * 1.15)]
  const ocupacoesTeste = [50, 65, 75, 85]

  return (
    <Card className="rounded-2xl border border-[#E3DFD6] bg-white shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-[#E3DFD6]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F6B4F]/10 text-[#0F6B4F]">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-[#1F2A24]">
                Ponto de Equilíbrio da Operação (Break-Even)
              </CardTitle>
              <CardDescription className="text-xs text-[#5E6E64]">
                Mínimo necessário para cobrir despesas fixas, administração Housi e{' '}
                {comFinanciamento ? 'parcela do financiamento' : 'custos da unidade'}
              </CardDescription>
            </div>
          </div>
          {equilibrioAtingivel ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#0F6B4F] bg-[#0F6B4F]/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Operação Saudável
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
              <AlertCircle className="h-3.5 w-3.5" />
              Atenção: Exige &gt;100% Ocupação
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-5">
        {/* Métricas Principais de Equilíbrio */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-[#F7F5F1] border border-[#E3DFD6]">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#5E6E64]">
              Ocupação Mínima
            </span>
            <span className="text-lg font-black text-[#1F2A24] tabular-nums mt-0.5 block">
              {formatPercent(ocupacaoMinimaPerc, 1)}
            </span>
            <span className="text-[11px] text-[#5E6E64]">
              {Math.ceil(diasMinimosOcupados)} noites/mês
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F5F1] border border-[#E3DFD6]">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#5E6E64]">
              Diária Mínima
            </span>
            <span className="text-lg font-black text-[#1F2A24] tabular-nums mt-0.5 block">
              {formatCurrency(diariaMinima)}
            </span>
            <span className="text-[11px] text-[#5E6E64]">a {ocupacaoAtualPerc}% ocupação</span>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F5F1] border border-[#E3DFD6]">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#5E6E64]">
              Receita Bruta Mínima
            </span>
            <span className="text-lg font-black text-[#0F6B4F] tabular-nums mt-0.5 block">
              {formatCurrency(receitaBrutaMinima)}
            </span>
            <span className="text-[11px] text-[#5E6E64]">/mês para zerar</span>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F5F1] border border-[#E3DFD6]">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#5E6E64]">
              Custo Total Mensal
            </span>
            <span className="text-lg font-black text-red-600 tabular-nums mt-0.5 block">
              {formatCurrency(custoTotalComFinanciamento)}
            </span>
            <span className="text-[11px] text-[#5E6E64]">
              {comFinanciamento ? 'Custos + Financiamento' : 'Despesas fixas'}
            </span>
          </div>
        </div>

        {/* Matriz de Sensibilidade: Combinações que geram Lucro Positivo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1F2A24] flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-[#0F6B4F]" />
              Matriz de Viabilidade: Diária vs. Taxa de Ocupação
            </span>
            <span className="text-[11px] text-[#5E6E64]">
              Verde = Resultado Positivo (lucro no bolso)
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E3DFD6]">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F5F1] border-b border-[#E3DFD6]">
                  <th className="p-2.5 font-bold text-[#1F2A24]">Diária / Ocupação</th>
                  {ocupacoesTeste.map((oc) => (
                    <th key={oc} className="p-2.5 text-center font-bold text-[#1F2A24]">
                      {oc}% ({Math.round(30 * (oc / 100))} dias)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {precosTeste.map((diaria) => {
                  return (
                    <tr key={diaria} className="hover:bg-neutral-50/60">
                      <td className="p-2.5 font-bold text-[#1F2A24] bg-[#F7F5F1]/40 tabular-nums">
                        {formatCurrency(diaria)}
                        {diaria === diariaAtual && (
                          <span className="ml-1 text-[10px] text-[#0F6B4F] font-semibold">
                            (Atual)
                          </span>
                        )}
                      </td>
                      {ocupacoesTeste.map((oc) => {
                        const receita = diaria * 30 * (oc / 100)
                        const sobra = receita - receitaBrutaMinima
                        const positivo = sobra >= 0
                        return (
                          <td
                            key={oc}
                            className={`p-2.5 text-center tabular-nums font-semibold transition-colors ${
                              positivo
                                ? 'bg-emerald-50/60 text-[#0F6B4F]'
                                : 'bg-red-50/40 text-red-600'
                            }`}
                          >
                            <span className="block text-xs">
                              {positivo ? '+' : ''}
                              {formatCurrency(
                                sobra * (1 - pontoEquilibrio.ocupacaoMinimaPerc / 100),
                              )}
                            </span>
                            <span className="text-[9px] block text-neutral-500 font-normal">
                              {positivo ? 'Viável' : 'Déficit'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
