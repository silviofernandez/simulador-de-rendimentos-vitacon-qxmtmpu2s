import {
  ParametrosFinanciamento,
  ResultadoFinanciamento,
  SistemaFinanciamento,
} from '@/types/simulador'
import { formatCurrency, formatPercent } from '@/lib/calculos'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/CurrencyInput'
import { PercentInput } from '@/components/PercentInput'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Landmark, Info, Calculator, Percent } from 'lucide-react'

interface FinancingCardProps {
  saldoSugerido: number
  parametros: ParametrosFinanciamento
  resultado: ResultadoFinanciamento
  onChange: (novo: ParametrosFinanciamento) => void
}

export function FinancingCard({
  saldoSugerido,
  parametros,
  resultado,
  onChange,
}: FinancingCardProps) {
  const handleToggleAtivo = (checked: boolean) => {
    onChange({
      ...parametros,
      ativo: checked,
      valorFinanciado: parametros.valorFinanciado > 0 ? parametros.valorFinanciado : saldoSugerido,
    })
  }

  const handleSistemaChange = (sistema: SistemaFinanciamento) => {
    onChange({
      ...parametros,
      sistema,
    })
  }

  const handleValorFinanciadoChange = (val: number) => {
    onChange({
      ...parametros,
      valorFinanciado: val,
    })
  }

  const handleTaxaChange = (taxa: number) => {
    onChange({
      ...parametros,
      taxaJurosAnualPerc: taxa,
    })
  }

  const handlePrazoChange = (prazo: number) => {
    onChange({
      ...parametros,
      prazoAnos: prazo,
    })
  }

  const handleParcelaManualChange = (val: number) => {
    onChange({
      ...parametros,
      valorParcelaManual: val > 0 ? val : undefined,
    })
  }

  return (
    <Card className="rounded-2xl border border-[#E3DFD6] bg-white shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-[#E3DFD6]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F6B4F]/10 text-[#0F6B4F]">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-[#1F2A24]">
                Financiamento Imobiliário do Saldo
              </CardTitle>
              <CardDescription className="text-xs text-[#5E6E64]">
                SAC vs Price, prazo, taxas bancárias e simulação de parcelas
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="switch-financ" className="text-xs font-semibold text-[#5E6E64]">
              {parametros.ativo ? 'Ativado' : 'Sem Financiamento'}
            </Label>
            <Switch
              id="switch-financ"
              checked={parametros.ativo}
              onCheckedChange={handleToggleAtivo}
              className="data-[state=checked]:bg-[#0F6B4F]"
            />
          </div>
        </div>
      </CardHeader>

      {parametros.ativo && (
        <CardContent className="pt-4 space-y-4">
          {/* Seletor do Sistema: SAC vs PRICE */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#1F2A24]">Sistema de Amortização</Label>
            <RadioGroup
              value={parametros.sistema}
              onValueChange={(val) => handleSistemaChange(val as SistemaFinanciamento)}
              className="grid grid-cols-2 gap-3"
            >
              <div
                className={`flex items-center space-x-2 border rounded-xl p-3 cursor-pointer transition-all ${
                  parametros.sistema === 'SAC'
                    ? 'border-[#0F6B4F] bg-[#0F6B4F]/5 text-[#0F6B4F]'
                    : 'border-[#E3DFD6] hover:bg-neutral-50'
                }`}
                onClick={() => handleSistemaChange('SAC')}
              >
                <RadioGroupItem value="SAC" id="sys-sac" />
                <Label htmlFor="sys-sac" className="cursor-pointer text-xs font-bold">
                  SAC (Parcelas Decrescentes)
                </Label>
              </div>

              <div
                className={`flex items-center space-x-2 border rounded-xl p-3 cursor-pointer transition-all ${
                  parametros.sistema === 'PRICE'
                    ? 'border-[#0F6B4F] bg-[#0F6B4F]/5 text-[#0F6B4F]'
                    : 'border-[#E3DFD6] hover:bg-neutral-50'
                }`}
                onClick={() => handleSistemaChange('PRICE')}
              >
                <RadioGroupItem value="PRICE" id="sys-price" />
                <Label htmlFor="sys-price" className="cursor-pointer text-xs font-bold">
                  PRICE (Parcelas Constantes)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Grid de Inputs: Saldo Financiado, Taxa Anual, Prazo em Anos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="val-financ" className="text-xs font-semibold text-[#1F2A24]">
                  Valor a Financiar (R$)
                </Label>
                {parametros.valorFinanciado !== saldoSugerido && (
                  <button
                    type="button"
                    onClick={() => handleValorFinanciadoChange(saldoSugerido)}
                    className="text-[10px] text-[#0F6B4F] hover:underline font-medium"
                    title="Usar saldo calculado do imóvel (70%)"
                  >
                    Usar Saldo (70%)
                  </button>
                )}
              </div>
              <CurrencyInput
                id="val-financ"
                value={parametros.valorFinanciado}
                onChange={handleValorFinanciadoChange}
                className="h-10 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="taxa-financ" className="text-xs font-semibold text-[#1F2A24]">
                Taxa de Juros (% a.a.)
              </Label>
              <PercentInput
                id="taxa-financ"
                value={parametros.taxaJurosAnualPerc}
                onChange={handleTaxaChange}
                decimals={1}
                min={0.1}
                max={50}
                className="h-10 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prazo-financ" className="text-xs font-semibold text-[#1F2A24]">
                Prazo (em Anos)
              </Label>
              <Input
                id="prazo-financ"
                type="number"
                value={parametros.prazoAnos === 0 ? '' : parametros.prazoAnos}
                onFocus={(e) => {
                  if (parametros.prazoAnos === 0) e.target.value = ''
                }}
                onChange={(e) => {
                  const val = e.target.value
                  handlePrazoChange(val === '' ? 0 : Number(val))
                }}
                className="h-10 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
                step={1}
                min={1}
                max={40}
              />
            </div>
          </div>

          {/* Campo Opcional: Sobrescrever Manualmente o Valor da Parcela */}
          <div className="rounded-xl bg-[#F7F5F1] p-3 border border-[#E3DFD6] space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label htmlFor="override-parcela" className="text-xs font-bold text-[#1F2A24]">
                  Ajustar Parcela Manualmente (Opcional)
                </Label>
                <p className="text-[11px] text-[#5E6E64]">
                  Caso você tenha uma proposta bancária real com seguro, taxa de administração ou
                  valor específico
                </p>
              </div>
              <div className="w-full sm:w-44">
                <CurrencyInput
                  id="override-parcela"
                  placeholder={formatCurrency(resultado.parcelaMedia)}
                  value={parametros.valorParcelaManual ?? 0}
                  allowZero={false}
                  onChange={handleParcelaManualChange}
                  className="h-9 rounded-lg border-[#E3DFD6] bg-white text-xs font-medium focus-visible:ring-[#0F6B4F]"
                />
              </div>
            </div>
          </div>

          {/* Resumo Dinâmico das Parcelas */}
          <div className="rounded-xl border border-neutral-200 bg-white p-3 space-y-2 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
                <span className="block text-[10px] text-neutral-500 font-semibold uppercase">
                  1ª Parcela
                </span>
                <span className="font-bold tabular-nums text-neutral-900 text-sm">
                  {formatCurrency(resultado.primeiraParcela)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
                <span className="block text-[10px] text-neutral-500 font-semibold uppercase">
                  Última Parcela
                </span>
                <span className="font-bold tabular-nums text-neutral-900 text-sm">
                  {formatCurrency(resultado.ultimaParcela)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-red-50/80 border border-red-200">
                <span className="block text-[10px] text-red-700 font-bold uppercase">
                  Parcela Efetiva / Média
                </span>
                <span className="font-extrabold tabular-nums text-red-700 text-sm">
                  {formatCurrency(resultado.parcelaEfetiva)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
                <span className="block text-[10px] text-neutral-500 font-semibold uppercase">
                  Total de Parcelas
                </span>
                <span className="font-bold tabular-nums text-neutral-900 text-sm">
                  {resultado.prazoMeses} meses
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
