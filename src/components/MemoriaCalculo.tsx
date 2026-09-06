import { useMemo } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatPercent } from '@/lib/calculos'
import { FileText, Calculator } from 'lucide-react'

interface MemoriaCalculoProps {
  valorDiaria: number
  valorTotalImovel: number
  faturamentoBruto: number
  custosOperacionais: number
  lucroLiquido: number
  dataInicioObra: Date
}

export function MemoriaCalculo({
  valorDiaria,
  valorTotalImovel,
  faturamentoBruto,
  custosOperacionais,
  lucroLiquido,
  dataInicioObra,
}: MemoriaCalculoProps) {
  // 1. Tabela de Sensibilidade de Ocupação (espelho da planilha "Calculos")
  const diasSensibilidade = [
    { dias: 15, perc: 0.5 },
    { dias: 18, perc: 0.6 },
    { dias: 21, perc: 0.7 },
    { dias: 22.5, perc: 0.75 },
    { dias: 24, perc: 0.8 },
    { dias: 27, perc: 0.9 },
    { dias: 30, perc: 1.0 },
  ]

  const tabelaDias = useMemo(() => {
    return diasSensibilidade.map((item) => ({
      dias: item.dias,
      percentual: item.perc * 100,
      valorMensal: valorDiaria * item.dias,
    }))
  }, [valorDiaria])

  // 2. Tabela de marcos de valorização temporal da planilha "Calculos"
  const ano0 = dataInicioObra.getFullYear()
  const tabelaValorizacao = [
    { marco: `Abr/${ano0}`, perc: 0, valor: valorTotalImovel },
    { marco: `Dez/${ano0 + 1}`, perc: 20, valor: valorTotalImovel * 1.2 },
    { marco: `Dez/${ano0 + 2}`, perc: 40, valor: valorTotalImovel * 1.4 },
    { marco: `Dez/${ano0 + 3}`, perc: 60, valor: valorTotalImovel * 1.6 },
  ]

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value="memoria"
        className="border border-[#E3DFD6] bg-white rounded-2xl overflow-hidden px-4"
      >
        <AccordionTrigger className="hover:no-underline py-4 text-sm font-semibold text-[#1F2A24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#0F6B4F]" />
            <span>Memória de Cálculo e Análise de Sensibilidade</span>
          </div>
          <span className="text-xs text-[#5E6E64] font-normal mr-2 hidden sm:inline">
            Clique para detalhar fórmulas e cenários
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-6 space-y-6 pt-2">
          {/* Fórmulas explicadas */}
          <div className="rounded-xl bg-[#F7F5F1] p-4 border border-[#E3DFD6] space-y-2 text-xs">
            <div className="font-semibold text-[#0F6B4F] flex items-center gap-1.5">
              <Calculator className="h-4 w-4" />
              <span>Fórmulas Matemáticas do Modelo Vitacon:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[#1F2A24]">
              <div>
                • <strong>Valor Total:</strong> Valor do m² × Metragem
              </div>
              <div>
                • <strong>Faturamento Bruto:</strong> Diária × 30 dias × % Ocupação
              </div>
              <div>
                • <strong>Custos Operacionais:</strong> Faturamento Bruto × % Custos
              </div>
              <div>
                • <strong>Lucro Líquido:</strong> Faturamento Bruto − Custos
              </div>
              <div>
                • <strong>Rentab. Mensal s/ Patrimônio:</strong> Lucro Líquido ÷ Valor Total
              </div>
              <div>
                • <strong>Rentab. Anual s/ Patrimônio:</strong> Rentab. Mensal × 12
              </div>
              <div>
                • <strong>Rentab. sobre Aporte:</strong> Lucro Líquido ÷ Aporte em Obras (30%)
              </div>
              <div>
                • <strong>Rentab. Anual s/ Aporte:</strong> Rentab. s/ Aporte × 12
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabela de Dias de Ocupação */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2A24]">
                Faturamento Bruto por Dias de Ocupação (Mês 30d)
              </h4>
              <div className="overflow-hidden rounded-xl border border-[#E3DFD6]">
                <Table>
                  <TableHeader className="bg-[#F7F5F1]">
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-[#1F2A24]">Dias</TableHead>
                      <TableHead className="text-xs font-semibold text-[#1F2A24]">
                        % Ocupação
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold text-[#1F2A24]">
                        Valor Mensal
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabelaDias.map((row) => (
                      <TableRow key={row.dias} className="text-xs hover:bg-neutral-50">
                        <TableCell className="font-semibold">{row.dias} dias</TableCell>
                        <TableCell>{formatPercent(row.percentual, 0)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-[#0F6B4F]">
                          {formatCurrency(row.valorMensal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Tabela de Estimativa de Valorização */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2A24]">
                Marcos Temporais de Valorização Referenciais
              </h4>
              <div className="overflow-hidden rounded-xl border border-[#E3DFD6]">
                <Table>
                  <TableHeader className="bg-[#F7F5F1]">
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-[#1F2A24]">Data</TableHead>
                      <TableHead className="text-xs font-semibold text-[#1F2A24]">
                        % Estimado
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold text-[#1F2A24]">
                        Valor Ativo
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabelaValorizacao.map((row) => (
                      <TableRow key={row.marco} className="text-xs hover:bg-neutral-50">
                        <TableCell className="font-semibold">{row.marco}</TableCell>
                        <TableCell>+{formatPercent(row.perc, 0)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-[#C9A227]">
                          {formatCurrency(row.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Breakdown Bruto / Líquido / Custos */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2A24]">
              Detalhamento de Fluxo Operacional Mensal
            </h4>
            <div className="overflow-hidden rounded-xl border border-[#E3DFD6]">
              <Table>
                <TableHeader className="bg-[#F7F5F1]">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-[#1F2A24]">Item</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-[#1F2A24]">
                      Faturamento Bruto
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-[#1F2A24]">
                      Custos Operacionais
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-[#1F2A24]">
                      Lucro Líquido
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="text-xs font-semibold">
                    <TableCell>Valores Atuais</TableCell>
                    <TableCell className="text-right tabular-nums text-[#1F2A24]">
                      {formatCurrency(faturamentoBruto)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[#C62828]">
                      - {formatCurrency(custosOperacionais)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[#0F6B4F] text-sm">
                      {formatCurrency(lucroLiquido)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
