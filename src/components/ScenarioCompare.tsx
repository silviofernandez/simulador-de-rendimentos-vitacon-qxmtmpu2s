import { CenarioComparativo } from '@/types/simulador'
import { formatCurrency, formatPercent } from '@/lib/calculos'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { GitCompare, Sparkles, TrendingUp, ArrowRight, RotateCcw } from 'lucide-react'

interface ScenarioCompareProps {
  cenarios: CenarioComparativo[]
  onAtualizarCenario: (
    id: CenarioComparativo['id'],
    campo: 'diaria' | 'taxaOcupacaoPerc' | 'taxaAdminHousiPerc',
    valor: number,
  ) => void
  onRestaurarPadroes: () => void
  onAplicarAoSimulador: (cenario: CenarioComparativo) => void
}

export function ScenarioCompare({
  cenarios,
  onAtualizarCenario,
  onRestaurarPadroes,
  onAplicarAoSimulador,
}: ScenarioCompareProps) {
  return (
    <Card className="rounded-2xl border border-[#E3DFD6] bg-white shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-[#E3DFD6]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A227]/15 text-[#B08D1E]">
              <GitCompare className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-[#1F2A24]">
                Comparação de Cenários (Conservador, Provável, Otimista)
              </CardTitle>
              <CardDescription className="text-xs text-[#5E6E64]">
                Altere os valores de cada cenário livremente para comparar lado a lado
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRestaurarPadroes}
            className="h-8 rounded-xl border-[#E3DFD6] text-xs gap-1.5 text-[#5E6E64] hover:text-[#1F2A24]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar Padrões</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cenarios.map((cen) => {
            const isConservador = cen.id === 'conservador'
            const isProvavel = cen.id === 'provavel'
            const isOtimista = cen.id === 'otimista'

            const badgeBg = isConservador
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : isProvavel
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200'

            const borderHighlight = isProvavel ? 'border-[#0F6B4F] shadow-sm' : 'border-[#E3DFD6]'

            return (
              <div
                key={cen.id}
                className={`rounded-2xl border ${borderHighlight} bg-white p-4 flex flex-col justify-between space-y-4 transition-all`}
              >
                <div className="space-y-3">
                  {/* Cabeçalho do Card */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeBg}`}
                    >
                      {cen.nome}
                    </span>
                    {isProvavel && (
                      <span className="text-[10px] font-bold text-[#0F6B4F] flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Recomendado
                      </span>
                    )}
                  </div>

                  {/* Campos Editáveis */}
                  <div className="space-y-2.5 pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <Label className="text-[11px] font-semibold text-[#5E6E64]">
                          Diária Média
                        </Label>
                        <span className="font-bold text-[#1F2A24] tabular-nums">
                          {formatCurrency(cen.diaria)}
                        </span>
                      </div>
                      <Input
                        type="number"
                        value={cen.diaria}
                        onChange={(e) =>
                          onAtualizarCenario(cen.id, 'diaria', Number(e.target.value))
                        }
                        className="h-8 rounded-lg border-[#E3DFD6] text-xs font-medium"
                        step={10}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <Label className="text-[11px] font-semibold text-[#5E6E64]">
                          Taxa de Ocupação
                        </Label>
                        <span className="font-bold text-[#1F2A24] tabular-nums">
                          {cen.taxaOcupacaoPerc}% ({Math.round(30 * (cen.taxaOcupacaoPerc / 100))}d)
                        </span>
                      </div>
                      <Slider
                        value={[cen.taxaOcupacaoPerc]}
                        onValueChange={(vals) =>
                          onAtualizarCenario(cen.id, 'taxaOcupacaoPerc', vals[0])
                        }
                        min={30}
                        max={95}
                        step={1}
                        className="cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <Label className="text-[11px] font-semibold text-[#5E6E64]">
                          Admin Housi
                        </Label>
                        <span className="font-bold text-[#1F2A24] tabular-nums">
                          {cen.taxaAdminHousiPerc}%
                        </span>
                      </div>
                      <Input
                        type="number"
                        value={cen.taxaAdminHousiPerc}
                        onChange={(e) =>
                          onAtualizarCenario(cen.id, 'taxaAdminHousiPerc', Number(e.target.value))
                        }
                        className="h-8 rounded-lg border-[#E3DFD6] text-xs font-medium"
                        step={0.5}
                        min={10}
                        max={25}
                      />
                    </div>
                  </div>

                  {/* Resultados do Cenário */}
                  <div className="rounded-xl bg-[#F7F5F1] p-3 border border-[#E3DFD6] space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#5E6E64]">Receita Bruta:</span>
                      <strong className="text-[#1F2A24] tabular-nums">
                        {formatCurrency(cen.faturamentoBruto)}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#5E6E64]">Total Despesas:</span>
                      <span className="text-red-600 font-semibold tabular-nums">
                        - {formatCurrency(cen.totalDespesas)}
                      </span>
                    </div>
                    <div className="border-t border-[#E3DFD6] pt-1.5 flex justify-between items-center">
                      <span className="font-bold text-[#1F2A24]">Sobra Líquida:</span>
                      <span className="font-black text-sm text-[#0F6B4F] tabular-nums">
                        {formatCurrency(cen.sobraLiquida)}/mês
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#5E6E64]">% a.m. s/ Aporte:</span>
                      <span className="font-bold text-[#0F6B4F] tabular-nums">
                        {formatPercent(cen.rentabilidadeMensalSobreAporte, 2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#5E6E64]">% a.a. s/ Aporte:</span>
                      <span className="font-bold text-[#C9A227] tabular-nums">
                        {formatPercent(cen.rentabilidadeAnualSobreAporte, 1)}
                      </span>
                    </div>
                    {cen.paybackAnos < 90 && (
                      <div className="flex justify-between items-center text-[11px] pt-0.5">
                        <span className="text-[#5E6E64]">Payback Estimado:</span>
                        <span className="font-semibold text-neutral-800 tabular-nums">
                          {cen.paybackAnos.toFixed(1)} anos
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão de Aplicar ao Simulador */}
                <Button
                  onClick={() => onAplicarAoSimulador(cen)}
                  variant="outline"
                  size="sm"
                  className="w-full h-8 rounded-xl border-[#E3DFD6] hover:bg-[#0F6B4F] hover:text-white hover:border-[#0F6B4F] text-xs font-semibold gap-1.5 transition-colors"
                >
                  <span>Carregar este Cenário</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
