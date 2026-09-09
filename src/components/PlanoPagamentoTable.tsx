import { useState } from 'react'
import { PlanoPagamentoItem, ConfigPlanoPagamento, BalaoConfig } from '@/types/simulador'
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
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/CurrencyInput'
import { PercentInput } from '@/components/PercentInput'
import { Label } from '@/components/ui/label'
import {
  Check,
  Copy,
  Sliders,
  RotateCcw,
  Calendar,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface PlanoPagamentoTableProps {
  plano: PlanoPagamentoItem[]
  valorTotalImovel: number
  percentualAteChaves?: number
  configPlano: ConfigPlanoPagamento
  onChangeConfigPlano?: (novaConfig: ConfigPlanoPagamento) => void
  onRestaurarConfigPadrao?: () => void
  onCompartilharWhatsApp?: () => void
  onCopiarPlano?: () => Promise<boolean> | void
}

export function PlanoPagamentoTable({
  plano,
  valorTotalImovel,
  percentualAteChaves = 30,
  configPlano,
  onChangeConfigPlano,
  onRestaurarConfigPadrao,
  onCompartilharWhatsApp,
  onCopiarPlano,
}: PlanoPagamentoTableProps) {
  const [copiado, setCopiado] = useState(false)
  const [mostrarDetalhesBaloes, setMostrarDetalhesBaloes] = useState(false)

  const somaTotal = plano.reduce((acc, curr) => acc + curr.total, 0)
  const somaPercentual = plano.reduce((acc, curr) => acc + curr.percentual, 0)
  const percFinanc = Math.max(0, 100 - percentualAteChaves)

  const handleCopiar = async () => {
    if (!onCopiarPlano) return
    const res = await onCopiarPlano()
    if (res !== false) {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    }
  }

  // Atualização direta de campos da configuração
  const handleUpdate = (campo: keyof ConfigPlanoPagamento, valor: any) => {
    if (!onChangeConfigPlano) return
    onChangeConfigPlano({
      ...configPlano,
      [campo]: valor,
    })
  }

  // Atualização de balão específico
  const handleUpdateBalao = (index: number, campo: keyof BalaoConfig, valor: any) => {
    if (!onChangeConfigPlano) return
    const novosBaloes = [...(configPlano.baloes || [])]
    if (novosBaloes[index]) {
      novosBaloes[index] = {
        ...novosBaloes[index],
        [campo]: valor,
      }
      onChangeConfigPlano({
        ...configPlano,
        baloes: novosBaloes,
      })
    }
  }

  // Ajuste quando a quantidade de balões muda
  const handleMudarQtdBaloes = (novaQtd: number) => {
    if (!onChangeConfigPlano) return
    const qtd = Math.max(0, Math.min(10, novaQtd))
    const baloesAtuais = [...(configPlano.baloes || [])]
    const percTotal = configPlano.percBaloesTotal ?? 5
    const percUnitario = qtd > 0 ? percTotal / qtd : 0

    const novosBaloes: BalaoConfig[] = []
    for (let i = 1; i <= qtd; i++) {
      const existente = baloesAtuais[i - 1]
      // Calcula mês padrão anual: 12, 24, 36... ou proporcional aos meses de entrega
      let mesPadrao = i * 12
      if (mesPadrao > configPlano.mesesAteEntrega) {
        mesPadrao = Math.max(1, Math.round((configPlano.mesesAteEntrega / (qtd + 1)) * i))
      }

      novosBaloes.push({
        id: existente?.id || `balao_${i}`,
        mesOffset: existente?.mesOffset ?? mesPadrao,
        percentual: percUnitario,
      })
    }

    onChangeConfigPlano({
      ...configPlano,
      qtdBaloes: qtd,
      baloes: novosBaloes,
    })
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho do Bloco */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1F2A24] flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[#0F6B4F]" />
            Plano de Pagamento & Prazos
          </span>
          <div className="flex items-center gap-1.5">
            <Badge className="bg-[#0F6B4F]/10 text-[#0F6B4F] border-[#0F6B4F]/20 text-[11px] font-semibold">
              Em Obras: {formatPercent(percentualAteChaves, 1)}
            </Badge>
            <Badge className="bg-[#5E6E64]/10 text-[#5E6E64] border-[#5E6E64]/20 text-[11px] font-semibold">
              Financiamento: {formatPercent(percFinanc, 1)}
            </Badge>
          </div>
        </div>

        {/* Botões de Ação para o Plano de Pagamento */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onRestaurarConfigPadrao && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRestaurarConfigPadrao}
              className="h-8 rounded-lg border-[#E3DFD6] hover:bg-neutral-100 text-xs font-semibold gap-1 text-[#5E6E64] hover:text-[#1F2A24]"
              title="Restaurar prazos e parcelas padrão"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Padrão</span>
            </Button>
          )}

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

      {/* PAINEL DE CONTROLE DE PRAZOS E PARCELAS (Destaque Editável) */}
      <div className="rounded-2xl border-2 border-[#0F6B4F]/30 bg-[#F7F5F1] p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1F2A24]">
            <Calendar className="h-4 w-4 text-[#0F6B4F]" />
            <span>Prazos & Quantidades Editáveis</span>
          </div>
          <span className="text-[11px] text-[#5E6E64]">
            Recalcula parcelas e datas instantaneamente
          </span>
        </div>

        {/* Linha dos 3 Controles Mestres: Meses até entrega, Parcelas mensais, Balões anuais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Meses restantes até a entrega (Parâmetro Mestre) */}
          <div className="rounded-xl bg-white p-2.5 border border-[#E3DFD6] shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="input-meses-entrega"
                className="text-xs font-bold text-[#1F2A24] cursor-pointer"
              >
                Meses até a entrega
              </Label>
              <Badge className="bg-[#0F6B4F]/10 text-[#0F6B4F] text-[10px] px-1.5 py-0 border-0">
                Mestre
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="input-meses-entrega"
                type="number"
                min={1}
                max={120}
                value={configPlano.mesesAteEntrega === 0 ? '' : configPlano.mesesAteEntrega}
                onFocus={(e) => {
                  if (configPlano.mesesAteEntrega === 0) e.target.value = ''
                }}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                  handleUpdate('mesesAteEntrega', isNaN(val) ? 1 : val)
                }}
                className="h-9 rounded-lg border-[#E3DFD6] text-xs font-bold text-[#0F6B4F] focus-visible:ring-[#0F6B4F]"
              />
              <span className="text-xs text-[#5E6E64] font-medium shrink-0">meses</span>
            </div>
            <p className="text-[10px] text-[#5E6E64] leading-tight">
              Ex: Domingos faltavam 24, agora faltam 22m
            </p>
          </div>

          {/* 2. Quantidade de Parcelas Mensais */}
          <div className="rounded-xl bg-white p-2.5 border border-[#E3DFD6] shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="input-qtd-mensais"
                className="text-xs font-bold text-[#1F2A24] cursor-pointer"
              >
                Parcelas mensais
              </Label>
              <span className="text-[10px] text-[#5E6E64]">Saldo ÷ Qtd</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="input-qtd-mensais"
                type="number"
                min={1}
                max={120}
                value={configPlano.qtdMensais === 0 ? '' : configPlano.qtdMensais}
                onFocus={(e) => {
                  if (configPlano.qtdMensais === 0) e.target.value = ''
                }}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                  handleUpdate('qtdMensais', isNaN(val) ? 1 : val)
                }}
                className="h-9 rounded-lg border-[#E3DFD6] text-xs font-bold text-[#1F2A24] focus-visible:ring-[#0F6B4F]"
              />
              <span className="text-xs text-[#5E6E64] font-medium shrink-0">vezes</span>
            </div>
            <p className="text-[10px] text-[#5E6E64] leading-tight">
              Ex: 22x p/ restantes ou 36x p/ lançamento
            </p>
          </div>

          {/* 3. Quantidade de Balões Anuais */}
          <div className="rounded-xl bg-white p-2.5 border border-[#E3DFD6] shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="input-qtd-baloes"
                className="text-xs font-bold text-[#1F2A24] cursor-pointer"
              >
                Balões anuais
              </Label>
              <button
                type="button"
                onClick={() => setMostrarDetalhesBaloes(!mostrarDetalhesBaloes)}
                className="text-[10px] text-[#0F6B4F] font-semibold hover:underline flex items-center gap-0.5"
              >
                {mostrarDetalhesBaloes ? 'Ocultar datas' : 'Configurar datas'}
                {mostrarDetalhesBaloes ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="input-qtd-baloes"
                type="number"
                min={0}
                max={10}
                value={configPlano.qtdBaloes}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                  handleMudarQtdBaloes(isNaN(val) ? 0 : val)
                }}
                className="h-9 rounded-lg border-[#E3DFD6] text-xs font-bold text-[#1F2A24] focus-visible:ring-[#0F6B4F]"
              />
              <span className="text-xs text-[#5E6E64] font-medium shrink-0">balões</span>
            </div>
            <p className="text-[10px] text-[#5E6E64] leading-tight">
              Ex: 2x padrão ou 3x para 36 meses
            </p>
          </div>
        </div>

        {/* Sub-painel expansível: Configuração detalhada de cada balão anual (datas e meses de vencimento) */}
        {mostrarDetalhesBaloes && configPlano.baloes && configPlano.baloes.length > 0 && (
          <div className="rounded-xl bg-white p-3 border border-[#E3DFD6] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1F2A24]">
                Vencimento de cada Balão Anual (mês da obra)
              </span>
              <span className="text-[10px] text-[#5E6E64]">Ajuste em que mês cai cada balão</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {configPlano.baloes.map((balao, idx) => (
                <div
                  key={balao.id || idx}
                  className="rounded-lg border border-[#E3DFD6] p-2 bg-[#F7F5F1]/50 space-y-1 text-xs"
                >
                  <div className="flex justify-between items-center font-semibold text-[#1F2A24]">
                    <span>Balão {idx + 1}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-white">
                      Mês {balao.mesOffset}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#5E6E64] shrink-0">Cai no mês:</span>
                    <Input
                      type="number"
                      min={1}
                      max={configPlano.mesesAteEntrega}
                      value={balao.mesOffset}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        handleUpdateBalao(idx, 'mesOffset', isNaN(val) ? 1 : val)
                      }}
                      className="h-7 text-xs font-bold text-[#1F2A24] bg-white rounded-md"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TABELA DE PLANO DE PAGAMENTO COMPLETA COM CAMPOS EDITÁVEIS AO VIVO */}
      <div className="overflow-x-auto rounded-xl border border-[#E3DFD6] bg-white shadow-2xs">
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
                % Imóvel
              </TableHead>
              <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                Fase
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plano.map((item) => {
              const serieKey = item.serie.toUpperCase()
              const isAto = serieKey.includes('ATO')
              const isSinal = serieKey.includes('SINAL')
              const isMensal = serieKey.includes('MENS')
              const isAnual = serieKey.includes('ANUA')
              const isUnica = serieKey.includes('ÚNIC') || serieKey.includes('UNIC')
              const isFinanc = item.fase === 'Financiamento'

              return (
                <TableRow key={item.serie} className="hover:bg-neutral-50/80 text-xs">
                  {/* Série */}
                  <TableCell className="sticky left-0 bg-white font-bold text-[#1F2A24] z-10">
                    <div className="flex items-center gap-1.5">
                      <span>{item.serie}</span>
                      {isMensal && (
                        <span className="text-[10px] text-[#0F6B4F] font-semibold bg-[#0F6B4F]/10 px-1 py-0.2 rounded">
                          fluxo
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Início (Mês/Ano calculado) */}
                  <TableCell className="text-[#5E6E64] font-medium whitespace-nowrap">
                    {item.inicio}
                  </TableCell>

                  {/* Quantidade (Editável diretamente na linha para Sinais, Mensais, Balões) */}
                  <TableCell className="text-center font-medium">
                    {isSinal && onChangeConfigPlano ? (
                      <div className="inline-flex items-center justify-center">
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          value={configPlano.qtdSinais}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10)
                            handleUpdate('qtdSinais', isNaN(val) ? 1 : val)
                          }}
                          className="h-7 w-14 text-center text-xs font-semibold p-1 bg-neutral-50 rounded"
                        />
                      </div>
                    ) : isMensal && onChangeConfigPlano ? (
                      <div className="inline-flex items-center justify-center">
                        <Input
                          type="number"
                          min={1}
                          max={120}
                          value={configPlano.qtdMensais}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10)
                            handleUpdate('qtdMensais', isNaN(val) ? 1 : val)
                          }}
                          className="h-7 w-16 text-center text-xs font-bold text-[#0F6B4F] p-1 bg-emerald-50/50 rounded border border-[#0F6B4F]/30"
                        />
                      </div>
                    ) : isAnual && onChangeConfigPlano ? (
                      <div className="inline-flex items-center justify-center">
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          value={configPlano.qtdBaloes}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10)
                            handleMudarQtdBaloes(isNaN(val) ? 0 : val)
                          }}
                          className="h-7 w-14 text-center text-xs font-semibold p-1 bg-neutral-50 rounded"
                        />
                      </div>
                    ) : (
                      <span>{item.quantidade}x</span>
                    )}
                  </TableCell>

                  {/* Valor Parcela */}
                  <TableCell className="text-right tabular-nums font-semibold text-[#1F2A24] whitespace-nowrap">
                    {formatCurrencyDetailed(item.valorParcela)}
                  </TableCell>

                  {/* Total */}
                  <TableCell className="text-right tabular-nums font-bold text-[#0F6B4F] whitespace-nowrap">
                    {formatCurrency(item.total)}
                  </TableCell>

                  {/* Percentual Editável (%) */}
                  <TableCell className="text-right tabular-nums text-[#1F2A24] whitespace-nowrap">
                    {onChangeConfigPlano && isAto ? (
                      <div className="inline-flex items-center justify-end w-20">
                        <PercentInput
                          value={configPlano.percAto ?? item.percentual}
                          onChange={(val) => handleUpdate('percAto', val)}
                          decimals={1}
                          min={0}
                          max={50}
                          className="h-7 text-right text-xs font-medium bg-neutral-50 p-1"
                        />
                      </div>
                    ) : onChangeConfigPlano && isSinal ? (
                      <div className="inline-flex items-center justify-end w-20">
                        <PercentInput
                          value={configPlano.percSinais ?? item.percentual}
                          onChange={(val) => handleUpdate('percSinais', val)}
                          decimals={1}
                          min={0}
                          max={50}
                          className="h-7 text-right text-xs font-medium bg-neutral-50 p-1"
                        />
                      </div>
                    ) : onChangeConfigPlano && isMensal ? (
                      <div className="inline-flex items-center justify-end w-20">
                        <PercentInput
                          value={configPlano.percMensais ?? item.percentual}
                          onChange={(val) => handleUpdate('percMensais', val)}
                          decimals={1}
                          min={0}
                          max={50}
                          className="h-7 text-right text-xs font-bold text-[#0F6B4F] bg-emerald-50/50 p-1 border border-[#0F6B4F]/30"
                        />
                      </div>
                    ) : onChangeConfigPlano && isAnual ? (
                      <div className="inline-flex items-center justify-end w-20">
                        <PercentInput
                          value={configPlano.percBaloesTotal ?? item.percentual}
                          onChange={(val) => {
                            // Atualiza percentual total e redistribui pelos balões
                            const qtd = configPlano.qtdBaloes || 1
                            const unit = val / qtd
                            const novosBaloes = (configPlano.baloes || []).map((b) => ({
                              ...b,
                              percentual: unit,
                            }))
                            if (onChangeConfigPlano) {
                              onChangeConfigPlano({
                                ...configPlano,
                                percBaloesTotal: val,
                                baloes: novosBaloes,
                              })
                            }
                          }}
                          decimals={1}
                          min={0}
                          max={50}
                          className="h-7 text-right text-xs font-medium bg-neutral-50 p-1"
                        />
                      </div>
                    ) : onChangeConfigPlano && isUnica ? (
                      <div className="inline-flex items-center justify-end w-20">
                        <PercentInput
                          value={configPlano.percUnica ?? item.percentual}
                          onChange={(val) => handleUpdate('percUnica', val)}
                          decimals={1}
                          min={0}
                          max={50}
                          className="h-7 text-right text-xs font-medium bg-neutral-50 p-1"
                        />
                      </div>
                    ) : (
                      <span className="font-medium text-[#5E6E64]">
                        {formatPercent(item.percentual, 1)}
                      </span>
                    )}
                  </TableCell>

                  {/* Fase */}
                  <TableCell className="text-center whitespace-nowrap">
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
              )
            })}

            {/* Linha Totalizadora */}
            <TableRow className="bg-[#F7F5F1] font-bold text-xs border-t-2 border-[#E3DFD6]">
              <TableCell className="sticky left-0 bg-[#F7F5F1] z-10 text-[#1F2A24]">
                TOTAL
              </TableCell>
              <TableCell colSpan={2} className="text-[#5E6E64]">
                100% do Imóvel
              </TableCell>
              <TableCell className="text-right text-[#5E6E64]">-</TableCell>
              <TableCell className="text-right tabular-nums text-[#0F6B4F] font-extrabold text-sm whitespace-nowrap">
                {formatCurrency(somaTotal || valorTotalImovel)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-[#1F2A24] whitespace-nowrap font-extrabold">
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
