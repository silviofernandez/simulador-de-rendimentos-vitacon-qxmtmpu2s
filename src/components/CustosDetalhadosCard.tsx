import { CustosOperacionaisDetalhados } from '@/types/simulador'
import { formatCurrency, formatPercent } from '@/lib/calculos'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/CurrencyInput'
import { Slider } from '@/components/ui/slider'
import { Receipt, Percent, ShieldCheck } from 'lucide-react'

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
    onChange({
      ...custos,
      taxaAdminHousiPerc: val / 100,
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
                Despesas fixas individuais e taxa de gestão de 15% a 18%
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
        {/* Slider Taxa de Administração Housi (15% a 18%) */}
        <div className="rounded-xl bg-[#F7F5F1] p-3.5 border border-[#E3DFD6] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#0F6B4F]" />
              <Label className="text-xs font-bold text-[#1F2A24]">
                Taxa de Gestão / Administração Housi
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#0F6B4F] bg-white px-2 py-0.5 rounded-md border border-[#E3DFD6] tabular-nums">
                {taxaAdminPercNum.toFixed(1)}% ({formatCurrency(valorAdminCalculado)}/mês)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#5E6E64]">
            Plano Short Stay Housi: <strong>15%</strong> (gestão essencial), <strong>16,5%</strong>{' '}
            (plano intermediário) ou <strong>18%</strong> (gestão completa 360° com precificação
            dinâmica).
          </p>
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
            <span className="text-[#0F6B4F] font-bold">15% (Padrão Slide)</span>
            <span className="text-[#0F6B4F] font-bold">18% (Completa)</span>
            <span>25%</span>
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
