import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SimulacaoRecord } from '@/types/simulador'
import { listarSimulacoes, excluirSimulacao, duplicarSimulacao } from '@/services/simulacoes'
import { formatCurrency, formatPercent } from '@/lib/calculos'
import { useRealtime } from '@/hooks/use-realtime'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  Calculator,
  Copy,
  Trash2,
  ArrowUpRight,
  Calendar,
  Building,
  Sparkles,
  Loader2,
} from 'lucide-react'

export default function SimulacoesPage() {
  const [simulacoes, setSimulacoes] = useState<SimulacaoRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [itemParaExcluir, setItemParaExcluir] = useState<SimulacaoRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  const carregarSimulacoes = async () => {
    try {
      const data = await listarSimulacoes()
      setSimulacoes(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarSimulacoes()
  }, [])

  // Subscrição em tempo real na coleção `simulacoes`
  useRealtime('simulacoes', (e) => {
    const record = e.record as unknown as SimulacaoRecord
    if (e.action === 'create') {
      setSimulacoes((prev) => [record, ...prev.filter((item) => item.id !== record.id)])
    } else if (e.action === 'update') {
      setSimulacoes((prev) => prev.map((item) => (item.id === record.id ? record : item)))
    } else if (e.action === 'delete') {
      setSimulacoes((prev) => prev.filter((item) => item.id !== record.id))
    }
  })

  const handleCarregar = (sim: SimulacaoRecord) => {
    navigate('/', { state: { simulacaoCarregada: sim } })
  }

  const handleDuplicar = async (sim: SimulacaoRecord) => {
    try {
      const nova = await duplicarSimulacao(sim)
      toast.success('Simulação duplicada com sucesso!')
      setSimulacoes((prev) => [nova, ...prev])
    } catch (error) {
      console.error(error)
      toast.error('Erro ao duplicar simulação.')
    }
  }

  const handleConfirmarExclusao = async () => {
    if (!itemParaExcluir) return
    try {
      setIsDeleting(true)
      const ok = await excluirSimulacao(itemParaExcluir.id)
      if (ok) {
        toast.success('Simulação excluída.')
        setSimulacoes((prev) => prev.filter((item) => item.id !== itemParaExcluir.id))
      } else {
        toast.error('Erro ao excluir simulação.')
      }
    } finally {
      setIsDeleting(false)
      setItemParaExcluir(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1F2A24]">
            Minhas Simulações Salvas
          </h1>
          <p className="text-sm text-[#5E6E64]">
            Gerencie, compare e reabra seus cenários de investimento simulados com cálculo em tempo
            real.
          </p>
        </div>
        <Button
          onClick={() => navigate('/')}
          className="bg-[#0F6B4F] hover:bg-[#0B5740] text-white rounded-xl gap-2 font-medium shadow-md shadow-[#0F6B4F]/20"
        >
          <Calculator className="h-4 w-4" />
          Nova Simulação
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#0F6B4F]" />
        </div>
      ) : simulacoes.length === 0 ? (
        <Card className="border-[#E3DFD6] bg-white rounded-2xl p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F6B4F]/10 text-[#0F6B4F] mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-[#1F2A24]">Nenhuma simulação salva ainda</h3>
          <p className="mt-1 text-sm text-[#5E6E64] max-w-md mx-auto">
            Ajuste os parâmetros no Simulador e clique em "Salvar Simulação" para guardar seus
            estudos financeiros.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="mt-6 bg-[#0F6B4F] hover:bg-[#0B5740] text-white rounded-xl gap-2 font-medium"
          >
            <Calculator className="h-4 w-4" />
            Criar primeira simulação
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {simulacoes.map((sim) => {
            const res = sim.resultados
            return (
              <Card
                key={sim.id}
                className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Top decorative stripe */}
                <div className="h-1.5 w-full bg-[#0F6B4F]" />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold text-[#1F2A24] line-clamp-1">
                        {sim.titulo || sim.empreendimento || 'Simulação sem título'}
                      </CardTitle>
                      <CardDescription className="text-xs text-[#5E6E64] flex items-center gap-1 mt-1">
                        <Building className="h-3 w-3 text-[#0F6B4F]" />
                        <span>{sim.empreendimento || 'Personalizado'}</span>
                        {sim.bairro && <span>• {sim.bairro}</span>}
                      </CardDescription>
                    </div>
                    {sim.created && (
                      <span className="text-[10px] text-[#5E6E64] flex items-center gap-1 whitespace-nowrap bg-neutral-100 px-2 py-0.5 rounded-full">
                        <Calendar className="h-2.5 w-2.5" />
                        {new Date(sim.created).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 flex-1">
                  {/* Badges de Parâmetros */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant="outline"
                      className="border-[#E3DFD6] text-xs font-normal text-[#1F2A24] bg-[#F7F5F1]"
                    >
                      {sim.metragem} m²
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-[#E3DFD6] text-xs font-normal text-[#1F2A24] bg-[#F7F5F1]"
                    >
                      Diária: {formatCurrency(sim.valor_diaria)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-[#E3DFD6] text-xs font-normal text-[#1F2A24] bg-[#F7F5F1]"
                    >
                      Ocup: {formatPercent(sim.taxa_ocupacao * 100, 0)}
                    </Badge>
                  </div>

                  {/* Resumo Financeiro */}
                  <div className="rounded-xl border border-[#E3DFD6] bg-[#F7F5F1]/60 p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#5E6E64]">Valor do Imóvel:</span>
                      <span className="font-semibold text-[#1F2A24] tabular-nums">
                        {formatCurrency(res?.valorTotalImovel || sim.valor_m2 * sim.metragem)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#5E6E64]">Lucro Líquido Mensal:</span>
                      <span className="font-bold text-[#0F6B4F] tabular-nums">
                        {formatCurrency(res?.lucroLiquidoMensal || 0)}/mês
                      </span>
                    </div>
                    <div className="border-t border-[#E3DFD6] pt-1.5 flex justify-between items-center text-xs">
                      <span className="text-[#5E6E64]">Rentab. Anual s/ Patrimônio:</span>
                      <span className="font-bold text-[#C9A227] tabular-nums">
                        {formatPercent(res?.rentabilidadeAnualPatrimonio || 0)} a.a.
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#5E6E64]">Rentab. Anual s/ Aporte:</span>
                      <span className="font-bold text-[#0F6B4F] tabular-nums">
                        {formatPercent(res?.rentabilidadeAnualSobreAporte || 0)} a.a.
                      </span>
                    </div>
                  </div>
                </CardContent>

                {/* Footer Actions */}
                <div className="p-4 pt-0 border-t border-[#E3DFD6]/60 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicar(sim)}
                      className="h-8 w-8 text-[#5E6E64] hover:text-[#0F6B4F] hover:bg-[#0F6B4F]/10 rounded-lg"
                      title="Duplicar Simulação"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setItemParaExcluir(sim)}
                      className="h-8 w-8 text-[#5E6E64] hover:text-[#C62828] hover:bg-red-50 rounded-lg"
                      title="Excluir Simulação"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleCarregar(sim)}
                    className="h-8 px-3 rounded-lg bg-[#0F6B4F] hover:bg-[#0B5740] text-white text-xs font-semibold gap-1.5 shadow-sm"
                  >
                    <span>Carregar</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog
        open={!!itemParaExcluir}
        onOpenChange={(open) => !open && setItemParaExcluir(null)}
      >
        <AlertDialogContent className="rounded-2xl border-[#E3DFD6] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1F2A24]">Excluir Simulação?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[#5E6E64]">
              Tem certeza que deseja excluir a simulação{' '}
              <strong>
                "{itemParaExcluir?.titulo || itemParaExcluir?.empreendimento || 'Selecionada'}"
              </strong>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-[#E3DFD6]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarExclusao}
              disabled={isDeleting}
              className="rounded-xl bg-[#C62828] hover:bg-[#9B2020] text-white"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
