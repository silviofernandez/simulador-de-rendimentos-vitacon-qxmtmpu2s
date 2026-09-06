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

interface PlanoPagamentoTableProps {
  plano: PlanoPagamentoItem[]
  valorTotalImovel: number
}

export function PlanoPagamentoTable({ plano, valorTotalImovel }: PlanoPagamentoTableProps) {
  const somaTotal = plano.reduce((acc, curr) => acc + curr.total, 0)
  const somaPercentual = plano.reduce((acc, curr) => acc + curr.percentual, 0)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#5E6E64]">
          Plano de Pagamento
        </span>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#0F6B4F]/10 text-[#0F6B4F] border-[#0F6B4F]/20 text-[11px] font-semibold">
            Em Obras: 30%
          </Badge>
          <Badge className="bg-[#5E6E64]/10 text-[#5E6E64] border-[#5E6E64]/20 text-[11px] font-semibold">
            Financiamento: 70%
          </Badge>
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
