import { ResultadosSimulacao } from '@/types/simulador'
import { formatCurrency, formatPercent } from '@/lib/calculos'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Building2, CheckCircle2 } from 'lucide-react'

interface SlideVitaconViewProps {
  nomeEmpreendimento: string
  metragem: number
  resultados: ResultadosSimulacao
}

export function SlideVitaconView({
  nomeEmpreendimento,
  metragem,
  resultados,
}: SlideVitaconViewProps) {
  const {
    valorImovelSemDecoracao,
    percentualAteChaves,
    montanteAteChaves,
    saldoRestanteFinanciar,
    valorDecoracao,
    patrimonioTotal,
    totalInvestidoAporte,
    faturamentoBrutoMensal,
    diasOcupados,
    custosOperacionaisDetalhados,
    valorTaxaAdminHousi,
    totalDespesasMensais,
    receitaLiquidaAntesFinanciamento,
    percentualSobreAporteAntesFinanc,
    percentualSobrePatrimonioAntesFinanc,
    financiamento,
    resultadoLiquidoFinal,
  } = resultados

  const percentualFinanc = 100 - percentualAteChaves

  return (
    <div className="w-full space-y-4">
      {/* Banner / Cabeçalho Idêntico ao Slide Vitacon */}
      <div className="rounded-2xl bg-neutral-950 text-white p-5 sm:p-6 shadow-lg border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {nomeEmpreendimento || 'Vitacon Domingos de Morais'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-300 mt-1 font-medium">
            Retorno sobre Investimento{' '}
            <span className="underline font-bold text-white">(SHORT STAY)</span> — Operado por Housi
          </p>
        </div>

        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-neutral-800 pt-3 md:pt-0 md:pl-6">
          <div className="flex flex-col text-right">
            <span className="text-xl font-black tracking-widest text-[#E53935] uppercase">
              VITACON
            </span>
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-semibold">
              A melhor em investimentos imobiliários
            </span>
          </div>
        </div>
      </div>

      {/* Grid com os 4 Blocos do Slide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BLOCO 1: INVESTIMENTO */}
        <Card className="rounded-2xl border border-neutral-300 bg-white overflow-hidden shadow-sm">
          <div className="bg-neutral-400 text-neutral-900 text-center py-2 px-3 font-bold text-xs uppercase tracking-wider border-b border-neutral-300">
            Investimento
          </div>
          <CardContent className="p-0 text-xs">
            <div className="divide-y divide-neutral-200">
              <div className="flex justify-between items-center py-2.5 px-4 font-semibold text-neutral-800">
                <span>INVESTIMENTO STUDIO</span>
                <span className="font-bold tabular-nums text-neutral-950">
                  {formatCurrency(valorImovelSemDecoracao)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 px-4 text-neutral-700">
                <span className="flex items-center gap-2">
                  <span>ENTRADA / ATO</span>
                  <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                    {percentualAteChaves}%
                  </span>
                </span>
                <span className="font-semibold tabular-nums text-neutral-900">
                  {formatCurrency(montanteAteChaves)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 px-4 text-neutral-700">
                <span className="flex items-center gap-2">
                  <span>VALOR A FINANCIAR</span>
                  <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                    {percentualFinanc}%
                  </span>
                </span>
                <span className="font-semibold tabular-nums text-neutral-900">
                  {formatCurrency(saldoRestanteFinanciar)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-4 bg-yellow-200/60 font-semibold text-neutral-900">
                <span>TAMANHO M²</span>
                <span className="font-black tabular-nums">{metragem.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 px-4 text-neutral-700">
                <span>DECORAÇÃO STUDIO (HOUSI)</span>
                <span className="font-semibold tabular-nums text-neutral-900">
                  {formatCurrency(valorDecoracao)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 px-4 bg-neutral-50 font-bold text-neutral-900">
                <span>PATRIMÔNIO TOTAL</span>
                <span className="font-extrabold tabular-nums text-[#0F6B4F]">
                  {formatCurrency(patrimonioTotal)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 px-4 bg-[#0F6B4F]/10 font-bold text-[#0F6B4F]">
                <span>TOTAL INVESTIDO (APORTE ATÉ CHAVES)</span>
                <span className="font-black text-sm tabular-nums text-[#0F6B4F]">
                  {formatCurrency(totalInvestidoAporte)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BLOCO 2: RECEITA BRUTA MENSAL + PROJEÇÃO DE RENTABILIDADE */}
        <div className="space-y-4">
          {/* Sub-bloco Receita Bruta */}
          <Card className="rounded-2xl border border-neutral-300 bg-white overflow-hidden shadow-sm">
            <div className="bg-neutral-400 text-neutral-900 text-center py-2 px-3 font-bold text-xs uppercase tracking-wider border-b border-neutral-300">
              Receita Bruta Mensal
            </div>
            <CardContent className="p-0 text-xs">
              <div className="divide-y divide-neutral-200">
                <div className="flex justify-between items-center py-2.5 px-4 text-neutral-800">
                  <span className="font-semibold">VALOR DA DIÁRIA</span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(
                      resultados.diasOcupados > 0 ? faturamentoBrutoMensal / diasOcupados : 0,
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5 px-4 text-neutral-700 bg-neutral-50">
                  <span>OCUPAÇÃO (%)</span>
                  <div className="flex items-center gap-4">
                    <span className="font-bold tabular-nums text-[#0F6B4F]">
                      {Math.round((diasOcupados / 30) * 100)}%
                    </span>
                    <span className="text-neutral-500">
                      OCUPAÇÃO (DIAS):{' '}
                      <strong className="text-neutral-900">{Math.round(diasOcupados)}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2.5 px-4 bg-[#0F6B4F]/10 font-black text-[#0F6B4F]">
                  <span>RECEITA BRUTA MENSAL</span>
                  <span className="text-sm tabular-nums">
                    {formatCurrency(faturamentoBrutoMensal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sub-bloco Projeção de Rentabilidade Antes de Financ */}
          <Card className="rounded-2xl border border-neutral-300 bg-white overflow-hidden shadow-sm">
            <div className="bg-neutral-400 text-neutral-900 text-center py-2 px-3 font-bold text-xs uppercase tracking-wider border-b border-neutral-300">
              Projeção de Rentabilidade (Antes do Financiamento)
            </div>
            <CardContent className="p-0 text-xs">
              <div className="divide-y divide-neutral-200">
                <div className="flex justify-between items-center py-2.5 px-4 font-bold text-neutral-900 bg-emerald-50/70">
                  <span>RECEITA LÍQUIDA (BRUTA − DESPESAS)</span>
                  <span className="text-sm tabular-nums text-[#0F6B4F] font-black">
                    {formatCurrency(receitaLiquidaAntesFinanciamento)}
                  </span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-neutral-200 py-2.5 px-4 bg-white text-center">
                  <div>
                    <span className="block text-[10px] text-neutral-500 font-semibold uppercase">
                      % Sobre Aporte
                    </span>
                    <span className="text-base font-black text-[#0F6B4F] tabular-nums">
                      {formatPercent(percentualSobreAporteAntesFinanc, 1)}
                    </span>
                    <span className="text-[10px] text-neutral-400 block">a.m.</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-neutral-500 font-semibold uppercase">
                      % Sobre Patrimônio
                    </span>
                    <span className="text-base font-black text-[#C9A227] tabular-nums">
                      {formatPercent(percentualSobrePatrimonioAntesFinanc, 1)}
                    </span>
                    <span className="text-[10px] text-neutral-400 block">a.m.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BLOCO 3: CUSTOS MENSAIS */}
        <Card className="rounded-2xl border border-neutral-300 bg-white overflow-hidden shadow-sm">
          <div className="bg-neutral-400 text-neutral-900 text-center py-2 px-3 font-bold text-xs uppercase tracking-wider border-b border-neutral-300">
            Custos Mensais
          </div>
          <CardContent className="p-0 text-xs">
            <div className="divide-y divide-neutral-200">
              <div className="flex justify-between items-center py-2 px-4 text-neutral-700">
                <span>CONDOMÍNIO</span>
                <span className="font-semibold tabular-nums text-neutral-900">
                  {formatCurrency(custosOperacionaisDetalhados.condominio)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-4 text-neutral-700">
                <span>IPTU</span>
                <span className="font-semibold tabular-nums text-neutral-900">
                  {formatCurrency(custosOperacionaisDetalhados.iptu)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-4 text-neutral-700">
                <span>WI-FI + TV A CABO</span>
                <span className="font-semibold tabular-nums text-neutral-900">
                  {formatCurrency(custosOperacionaisDetalhados.wifiTv)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 px-4 text-neutral-700">
                <span>ENERGIA / ÁGUA</span>
                <span className="font-semibold tabular-nums text-neutral-900">
                  {formatCurrency(custosOperacionaisDetalhados.energiaAgua)}
                </span>
              </div>
              {custosOperacionaisDetalhados.outrasDespesas > 0 && (
                <div className="flex justify-between items-center py-2 px-4 text-neutral-700">
                  <span>OUTRAS DESPESAS OPERACIONAIS</span>
                  <span className="font-semibold tabular-nums text-neutral-900">
                    {formatCurrency(custosOperacionaisDetalhados.outrasDespesas)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 px-4 text-neutral-800 bg-neutral-50">
                <span className="flex items-center gap-2">
                  <span>ADMINISTRAÇÃO HOUSI</span>
                  <span className="text-[11px] font-bold text-[#0F6B4F] bg-[#0F6B4F]/10 px-1.5 py-0.5 rounded">
                    {(custosOperacionaisDetalhados.taxaAdminHousiPerc * 100).toFixed(1)}%
                  </span>
                </span>
                <span className="font-semibold tabular-nums text-neutral-900">
                  {formatCurrency(valorTaxaAdminHousi)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 px-4 bg-red-50 text-red-700 font-black">
                <span>TOTAL DESPESAS MENSAIS</span>
                <span className="text-sm tabular-nums">
                  - {formatCurrency(totalDespesasMensais)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BLOCO 4: PARCELAS PARA FINANCIAMENTO DO SALDO */}
        <Card className="rounded-2xl border border-neutral-300 bg-white overflow-hidden shadow-sm">
          <div className="bg-neutral-400 text-neutral-900 text-center py-2 px-3 font-bold text-xs uppercase tracking-wider border-b border-neutral-300">
            Parcelas para Financiamento do Saldo ({financiamento.sistema})
          </div>
          <CardContent className="p-0 text-xs">
            <div className="divide-y divide-neutral-200">
              <div className="py-2.5 px-4 bg-neutral-50 flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                <span className="font-semibold text-neutral-800">
                  {financiamento.sistema} — 1ª E ÚLTIMA PARCELA (
                  {(financiamento.prazoMeses / 12).toFixed(0)} ANOS):
                </span>
                <div className="flex items-center gap-2 font-bold tabular-nums">
                  <span className="text-neutral-900">
                    {formatCurrency(financiamento.primeiraParcela)}
                  </span>
                  <span className="text-neutral-400">/</span>
                  <span className="text-neutral-900">
                    {formatCurrency(financiamento.ultimaParcela)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white text-center border-b border-neutral-200">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Rentabilidade Líquida Mensal Após Parcela de Financiamento
                </span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2 rounded-xl bg-red-50/70 border border-red-100">
                    <span className="block text-[10px] uppercase font-bold text-red-600">
                      Valor Médio da Parcela
                    </span>
                    <span className="text-base font-black text-red-600 tabular-nums">
                      {formatCurrency(financiamento.parcelaEfetiva)}
                    </span>
                    {financiamento.manualOverride && (
                      <span className="text-[9px] text-neutral-400 block font-normal">
                        (valor manual)
                      </span>
                    )}
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="block text-[10px] uppercase font-bold text-[#0F6B4F]">
                      Saldo Líquido no Bolso
                    </span>
                    <span className="text-base font-black text-[#0F6B4F] tabular-nums">
                      {formatCurrency(resultadoLiquidoFinal)}
                    </span>
                    <span className="text-[9px] text-[#0F6B4F] block font-semibold">
                      /mês livre
                    </span>
                  </div>
                </div>
              </div>

              <div className="py-2.5 px-4 bg-neutral-50 flex justify-between items-center text-neutral-700">
                <span className="text-[11px] font-medium">Rentabilidade Final sobre o Aporte:</span>
                <span className="font-bold text-[#0F6B4F] tabular-nums">
                  {formatPercent(resultados.rentabilidadeMensalSobreAporte, 2)} a.m. (
                  {formatPercent(resultados.rentabilidadeAnualSobreAporte, 1)} a.a.)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
