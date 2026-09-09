import { useState } from 'react'
import { PlanoPagamentoItem } from '@/types/simulador'
import { formatCurrency, formatCurrencyDetailed, formatPercent } from '@/lib/calculos'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Copy } from 'lucide-react'

interface PlanoPagamentoTableProps {
  plano: PlanoPagamentoItem[]
  valorTotalImovel: number
  percentualAteChaves?: number
  onCompartilharWhatsApp?: () => void
  onCopiarPlano?: () => Promise<boolean> | void
}

export function PlanoPagamentoTable({
  plano,
  valorTotalImovel,
  percentualAteChaves = 30,
  onCompartilharWhatsApp,
  onCopiarPlano,
}: PlanoPagamentoTableProps) {
  const [copiado, setCopiado] = useState(false)
  const somaTotal = plano.reduce((acc, curr) => acc + curr.total, 0)
  const somaPercentual = plano.reduce((acc, curr) => acc + curr.percentual, 0)
  const percFinanc = Math.max(0, 100 - percentualAteChaves)

  const handleCopiar = async () => {
    if (!onCopiarPlano) return
    const res = await onCopiarPlano()
    // Se a função retornar boolean, verifica se foi sucesso (ou assume sucesso se void)
    if (res !== false) {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1F2A24]">
            Plano de Pagamento
          </span>
          <div className="flex items-center gap-1.5">
            <Badge className="bg-[#0F6B4F]/10 text-[#0F6B4F] border-[#0F6B4F]/20 text-[11px] font-semibold">
              Em Obras: {percentualAteChaves}%
            </Badge>
            <Badge className="bg-[#5E6E64]/10 text-[#5E6E64] border-[#5E6E64]/20 text-[11px] font-semibold">
              Financiamento: {percFinanc}%
            </Badge>
          </div>
        </div>

        {/* Botões de Ação para o Plano de Pagamento */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onCopiarPlano && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopiar}
              className="h-8 rounded-lg border-[#E3DFD6] hover:bg-neutral-100 text-xs font-semibold gap-1.5 text-[#5E6E64] hover:text-[#1F2A24] transition-colors"
              title="Copiar texto do plano de pagamento"
            >
              {copiado ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#0F6B4F]" />
                  <span className="text-[#0F6B4F]">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar Plano</span>
                </>
              )}
            </Button>
          )}

          {onCompartilharWhatsApp && (
            <Button
              type="button"
              size="sm"
              onClick={onCompartilharWhatsApp}
              className="h-8 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold gap-1.5 shadow-sm active:scale-95 transition-transform"
              title="Compartilhar plano de pagamento no WhatsApp"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>WhatsApp</span>
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E3DFD6] bg-white">
        <Table>
          <TableHeader className="bg-[#F7F5F1]">
            <TableRow>
              <TableHead className="sticky left-0 bg-[#F7F5F1] z-10 text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                Série
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                Início
              </TableHead>
              <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                Qtd
              </TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                Valor Parcela
              </TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                Total
              </TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                %
              </TableHead>
              <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                Fase
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plano.map((item) => (
              <TableRow key={item.serie} className="hover:bg-neutral-50/80 text-xs">
                <TableCell className="sticky left-0 bg-white font-bold text-[#1F2A24] z-10">
                  {item.serie}
                </TableCell>
                <TableCell className="text-[#5E6E64] font-medium">{item.inicio}</TableCell>
                <TableCell className="text-center font-medium">{item.quantidade}x</TableCell>
                <TableCell className="text-right tabular-nums font-medium text-[#1F2A24]">
                  {formatCurrencyDetailed(item.valorParcela)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-bold text-[#0F6B4F]">
                  {formatCurrency(item.total)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-[#5E6E64]">
                  {formatPercent(item.percentual, 1)}
                </TableCell>
                <TableCell className="text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.fase === 'Em Obras'
                        ? 'bg-[#0F6B4F]/10 text-[#0F6B4F] border border-[#0F6B4F]/20'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {item.fase}
                  </span>
                </TableCell>
              </TableRow>
            ))}

            {/* Linha Totalizadora */}
            <TableRow className="bg-[#F7F5F1] font-bold text-xs border-t-2 border-[#E3DFD6]">
              <TableCell className="sticky left-0 bg-[#F7F5F1] z-10 text-[#1F2A24]">
                TOTAL
              </TableCell>
              <TableCell colSpan={2} className="text-[#5E6E64]">
                100% do Imóvel
              </TableCell>
              <TableCell className="text-right text-[#5E6E64]">-</TableCell>
              <TableCell className="text-right tabular-nums text-[#0F6B4F] font-extrabold text-sm">
                {formatCurrency(somaTotal || valorTotalImovel)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-[#1F2A24]">
                {formatPercent(somaPercentual, 0)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="text-[10px] bg-white border-[#E3DFD6]">
                  Conferido
                </Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
