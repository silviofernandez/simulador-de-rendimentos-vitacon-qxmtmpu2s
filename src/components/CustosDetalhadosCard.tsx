import { CustosOperacionaisDetalhados } from '@/types/simulador'
import { formatCurrency, formatPercent } from '@/lib/calculos'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/CurrencyInput'
import { Slider } from '@/components/ui/slider'
import { PercentInput } from '@/components/PercentInput'
import { Receipt, Percent, ShieldCheck, Check } from 'lucide-react'

interface CustosDetalhadosCardProps {
  custos: CustosOperacionaisDetalhados
  faturamentoBruto: number
  onChange: (novos: CustosOperacionaisDetalhados) => void
}

export function CustosDetalhadosCard({
  custos,
  faturamentoBruto,
  onChange,
}: CustosDetalhadosCardProps) {
  const taxaAdminPercNum = Math.round(custos.taxaAdminHousiPerc * 1000) / 10 // ex: 15.0

  const handleFieldChange = (campo: keyof CustosOperacionaisDetalhados, valor: number) => {
    onChange({
      ...custos,
      [campo]: Math.max(0, valor),
    })
  }

  const handleAdminPercChange = (val: number) => {
    const clamped = Math.min(30, Math.max(5, val))
    onChange({
      ...custos,
      taxaAdminHousiPerc: clamped / 100,
    })
  }

  const valorAdminCalculado = faturamentoBruto * custos.taxaAdminHousiPerc
  const despesasFixas =
    custos.condominio + custos.iptu + custos.wifiTv + custos.energiaAgua + custos.outrasDespesas
  const totalDespesas = despesasFixas + valorAdminCalculado

  return (
    <Card className="rounded-2xl border border-[#E3DFD6] bg-white shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-[#E3DFD6]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-[#1F2A24]">
                Custos Operacionais & Administração Housi
              </CardTitle>
              <CardDescription className="text-xs text-[#5E6E64]">
                Despesas fixas individuais e taxa de administração Housi (15% a 18%)
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#5E6E64] font-medium block">Total Mensal</span>
            <span className="text-sm font-extrabold text-red-600 tabular-nums">
              - {formatCurrency(totalDespesas)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Controle Destacado: Taxa de Administração Housi (%) */}
        <div className="rounded-xl bg-gradient-to-br from-[#F7F5F1] to-emerald-50/40 p-3.5 border-2 border-[#0F6B4F]/30 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#0F6B4F]" />
              <Label htmlFor="taxa-admin-housi-input" className="text-xs font-bold text-[#1F2A24]">
                Taxa de administração Housi (%)
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#5E6E64]">
                = {formatCurrency(valorAdminCalculado)}/mês
              </span>
              <div className="w-24">
                <PercentInput
                  id="taxa-admin-housi-input"
                  value={taxaAdminPercNum}
                  onChange={handleAdminPercChange}
                  decimals={1}
                  min={5}
                  max={30}
                  className="h-8 rounded-lg border-[#0F6B4F]/40 bg-white text-xs font-bold text-[#0F6B4F] text-center focus-visible:ring-[#0F6B4F]"
                />
              </div>
            </div>
          </div>

          {/* Botões de Seleção Rápida: 15% | 16,5% | 18% */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[#5E6E64]">
              <span>Planos Housi:</span>
              <span className="text-[10px] text-[#5E6E64]">Alterne com 1 clique:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleAdminPercChange(15)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all ${
                  Math.abs(taxaAdminPercNum - 15) < 0.1
                    ? 'bg-[#0F6B4F] text-white border-[#0F6B4F] shadow-sm'
                    : 'bg-white text-[#1F2A24] border-[#E3DFD6] hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-1 font-bold">
                  <span>15,0%</span>
                  {Math.abs(taxaAdminPercNum - 15) < 0.1 && <Check className="h-3 w-3" />}
                </div>
                <span
                  className={`text-[10px] font-normal ${
                    Math.abs(taxaAdminPercNum - 15) < 0.1 ? 'text-white/80' : 'text-[#5E6E64]'
                  }`}
                >
                  Padrão Slide
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAdminPercChange(16.5)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all ${
                  Math.abs(taxaAdminPercNum - 16.5) < 0.1
                    ? 'bg-[#0F6B4F] text-white border-[#0F6B4F] shadow-sm'
                    : 'bg-white text-[#1F2A24] border-[#E3DFD6] hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-1 font-bold">
                  <span>16,5%</span>
                  {Math.abs(taxaAdminPercNum - 16.5) < 0.1 && <Check className="h-3 w-3" />}
                </div>
                <span
                  className={`text-[10px] font-normal ${
                    Math.abs(taxaAdminPercNum - 16.5) < 0.1 ? 'text-white/80' : 'text-[#5E6E64]'
                  }`}
                >
                  Intermediário
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAdminPercChange(18)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all ${
                  Math.abs(taxaAdminPercNum - 18) < 0.1
                    ? 'bg-[#0F6B4F] text-white border-[#0F6B4F] shadow-sm'
                    : 'bg-white text-[#1F2A24] border-[#E3DFD6] hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-1 font-bold">
                  <span>18,0%</span>
                  {Math.abs(taxaAdminPercNum - 18) < 0.1 && <Check className="h-3 w-3" />}
                </div>
                <span
                  className={`text-[10px] font-normal ${
                    Math.abs(taxaAdminPercNum - 18) < 0.1 ? 'text-white/80' : 'text-[#5E6E64]'
                  }`}
                >
                  Gestão 360°
                </span>
              </button>
            </div>
          </div>

          {/* Slider Contínuo */}
          <div className="pt-1 space-y-1.5">
            <Slider
              value={[taxaAdminPercNum]}
              onValueChange={(vals) => handleAdminPercChange(vals[0])}
              min={10}
              max={25}
              step={0.5}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#5E6E64] font-medium">
              <span>10%</span>
              <span className="text-[#0F6B4F] font-bold">15% (Essencial)</span>
              <span className="text-[#0F6B4F] font-bold">18% (Completa)</span>
              <span>25%</span>
            </div>
          </div>
        </div>

        {/* Linhas de Custo Individual: Condomínio, IPTU, Wi-Fi, Energia/Água, Outras */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="custo-condominio" className="text-xs font-semibold text-[#1F2A24]">
              Condomínio (R$)
            </Label>
            <CurrencyInput
              id="custo-condominio"
              value={custos.condominio}
              onChange={(val) => handleFieldChange('condominio', val)}
              className="h-10 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="custo-iptu" className="text-xs font-semibold text-[#1F2A24]">
              IPTU Mensal (R$)
            </Label>
            <CurrencyInput
              id="custo-iptu"
              value={custos.iptu}
              onChange={(val) => handleFieldChange('iptu', val)}
              className="h-10 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="custo-wifi" className="text-xs font-semibold text-[#1F2A24]">
              Wi-Fi + TV Cabo (R$)
            </Label>
            <CurrencyInput
              id="custo-wifi"
              value={custos.wifiTv}
              onChange={(val) => handleFieldChange('wifiTv', val)}
              className="h-10 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="custo-energia" className="text-xs font-semibold text-[#1F2A24]">
              Energia & Água (R$)
            </Label>
            <CurrencyInput
              id="custo-energia"
              value={custos.energiaAgua}
              onChange={(val) => handleFieldChange('energiaAgua', val)}
              className="h-10 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="custo-outras" className="text-xs font-semibold text-[#1F2A24]">
              Outras Despesas Operacionais (R$)
            </Label>
            <CurrencyInput
              id="custo-outras"
              value={custos.outrasDespesas}
              onChange={(val) => handleFieldChange('outrasDespesas', val)}
              className="h-10 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
              placeholder="0,00 (lavanderia, manutenção, etc.)"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
