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
  Share2,
  Check,
} from 'lucide-react'
import {
  formatarMensagemWhatsApp,
  extrairDadosDeSimulacaoRecord,
  abrirWhatsAppComTexto,
  copiarTextoParaClipboard,
} from '@/lib/whatsapp'

export default function SimulacoesPage() {
  const [simulacoes, setSimulacoes] = useState<SimulacaoRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [itemParaExcluir, setItemParaExcluir] = useState<SimulacaoRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copiadoId, setCopiadoId] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleCompartilharWhatsApp = (sim: SimulacaoRecord) => {
    try {
      const dados = extrairDadosDeSimulacaoRecord(sim)
      const mensagem = formatarMensagemWhatsApp(dados)
      abrirWhatsAppComTexto(mensagem)
      toast.success('Abrindo WhatsApp com o resumo da simulação...')
    } catch (err) {
      console.error(err)
      toast.error('Não foi possível formatar a simulação para o WhatsApp.')
    }
  }

  const handleCopiarResumo = async (sim: SimulacaoRecord) => {
    try {
      const dados = extrairDadosDeSimulacaoRecord(sim)
      const mensagem = formatarMensagemWhatsApp(dados)
      const ok = await copiarTextoParaClipboard(mensagem)
      if (ok) {
        setCopiadoId(sim.id)
        toast.success('Resumo copiado para a área de transferência!')
        setTimeout(() => setCopiadoId(null), 2500)
      } else {
        toast.error('Erro ao copiar resumo.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao copiar resumo.')
    }
  }

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
                      <span className="text-[#5E6E64]">Patrimônio Total:</span>
                      <span className="font-semibold text-[#1F2A24] tabular-nums">
                        {formatCurrency(
                          res?.patrimonioTotal ||
                            res?.valorTotalImovel ||
                            sim.valor_m2 * sim.metragem,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#5E6E64]">Aporte Total (c/ Decoração):</span>
                      <span className="font-semibold text-neutral-800 tabular-nums">
                        {formatCurrency(res?.totalInvestidoAporte || res?.aporteEmObras || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#5E6E64]">Sobra Líquida no Bolso:</span>
                      <span className="font-bold text-[#0F6B4F] tabular-nums">
                        {formatCurrency(res?.resultadoLiquidoFinal ?? res?.lucroLiquidoMensal ?? 0)}
                        /mês
                      </span>
                    </div>
                    {res?.financiamento?.valorFinanciado ? (
                      <div className="flex justify-between items-center text-[11px] text-[#5E6E64]">
                        <span>Parcela Financiamento:</span>
                        <span className="font-medium text-red-600 tabular-nums">
                          - {formatCurrency(res.financiamento.parcelaEfetiva)} (
                          {res.financiamento.sistema})
                        </span>
                      </div>
                    ) : null}
                    <div className="border-t border-[#E3DFD6] pt-1.5 flex justify-between items-center text-xs">
                      <span className="text-[#5E6E64]">Rentab. s/ Aporte:</span>
                      <span className="font-bold text-[#0F6B4F] tabular-nums">
                        {formatPercent(res?.rentabilidadeMensalSobreAporte || 0, 2)} a.m. (
                        {formatPercent(res?.rentabilidadeAnualSobreAporte || 0, 1)} a.a.)
                      </span>
                    </div>
                  </div>
                </CardContent>

                {/* Footer Actions */}
                <div className="p-4 pt-0 border-t border-[#E3DFD6]/60 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    {/* Botão Compartilhar no WhatsApp */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCompartilharWhatsApp(sim)}
                      className="h-8 w-8 text-[#25D366] hover:text-[#1EBE5D] hover:bg-[#25D366]/10 rounded-lg transition-colors"
                      title="Compartilhar no WhatsApp"
                      aria-label="Compartilhar no WhatsApp"
                    >
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                    </Button>

                    {/* Botão Copiar Resumo */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopiarResumo(sim)}
                      className="h-8 w-8 text-[#5E6E64] hover:text-[#0F6B4F] hover:bg-[#0F6B4F]/10 rounded-lg transition-colors"
                      title="Copiar resumo em texto"
                      aria-label="Copiar resumo"
                    >
                      {copiadoId === sim.id ? (
                        <Check className="h-4 w-4 text-[#0F6B4F]" />
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Botão Duplicar */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicar(sim)}
                      className="h-8 w-8 text-[#5E6E64] hover:text-[#0F6B4F] hover:bg-[#0F6B4F]/10 rounded-lg transition-colors"
                      title="Duplicar Simulação"
                      aria-label="Duplicar Simulação"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>

                    {/* Botão Excluir */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setItemParaExcluir(sim)}
                      className="h-8 w-8 text-[#5E6E64] hover:text-[#C62828] hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir Simulação"
                      aria-label="Excluir Simulação"
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
