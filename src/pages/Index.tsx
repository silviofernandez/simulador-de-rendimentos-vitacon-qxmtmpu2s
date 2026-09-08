import React, { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  EmpreendimentoRecord,
  SimulacaoRecord,
  CustosOperacionaisDetalhados,
  ParametrosFinanciamento,
  CenarioComparativo,
} from '@/types/simulador'
import { listarEmpreendimentos } from '@/services/empreendimentos'
import { criarSimulacao } from '@/services/simulacoes'
import {
  calcularSimulacaoCompleta,
  formatCurrency,
  formatPercent,
  mesesNomesAbrev,
} from '@/lib/calculos'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/CurrencyInput'
import { PercentInput } from '@/components/PercentInput'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { AppreciationChart } from '@/components/AppreciationChart'
import { PlanoPagamentoTable } from '@/components/PlanoPagamentoTable'
import { MemoriaCalculo } from '@/components/MemoriaCalculo'
import { SlideVitaconView } from '@/components/SlideVitaconView'
import { FinancingCard } from '@/components/FinancingCard'
import { CustosDetalhadosCard } from '@/components/CustosDetalhadosCard'
import { BreakEvenCard } from '@/components/BreakEvenCard'
import { ScenarioCompare } from '@/components/ScenarioCompare'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import {
  Building2,
  Calendar,
  Save,
  Sparkles,
  SlidersHorizontal,
  Home,
  RotateCcw,
  LayoutTemplate,
  Layers,
  ArrowRight,
  TrendingUp,
  Percent,
} from 'lucide-react'

// Padrões do Slide Vitacon Domingos de Morais
const PRESET_DOMINGOS_MORAIS = {
  nome: 'Vitacon Domingos de Morais',
  endereco: 'Rua Domingos de Morais, 3093',
  bairro: 'Vila Mariana',
  metragem: 18.0,
  valorImovel: 382835.5, // Slide exato
  percentualAteChaves: 30, // 30% = R$ 114.850,50
  valorDecoracao: 59000.0,
  valorDiaria: 270.0,
  taxaOcupacaoPerc: 70, // 21 dias -> Faturamento Bruto = R$ 5.670,00
  custos: {
    condominio: 420.0,
    iptu: 130.0,
    wifiTv: 150.0,
    energiaAgua: 100.0,
    taxaAdminHousiPerc: 0.15, // 15% de 5.670 = 850,50 -> Total despesas = 1.650,50
    outrasDespesas: 0.0,
  },
  financiamento: {
    ativo: true,
    valorFinanciado: 267984.5, // 70% saldo
    taxaJurosAnualPerc: 10.0, // Implied SAC do slide: 1ª 2.977,61 / Última 744,40 / Média 1.861,00
    prazoAnos: 30,
    sistema: 'SAC' as const,
  },
}

export default function IndexPage() {
  const { user } = useAuth()
  const location = useLocation()

  // Base de empreendimentos do PocketBase
  const [empreendimentos, setEmpreendimentos] = useState<EmpreendimentoRecord[]>([])
  const [selectedEmpreendimentoId, setSelectedEmpreendimentoId] = useState<string>('')

  // 1. INVESTIMENTO (100% editável)
  const [nomeEmpreendimento, setNomeEmpreendimento] = useState<string>(PRESET_DOMINGOS_MORAIS.nome)
  const [bairro, setBairro] = useState<string>(PRESET_DOMINGOS_MORAIS.bairro)
  const [endereco, setEndereco] = useState<string>(PRESET_DOMINGOS_MORAIS.endereco)
  const [metragem, setMetragem] = useState<number>(PRESET_DOMINGOS_MORAIS.metragem)
  const [valorImovel, setValorImovel] = useState<number>(PRESET_DOMINGOS_MORAIS.valorImovel)
  const [percentualAteChaves, setPercentualAteChaves] = useState<number>(
    PRESET_DOMINGOS_MORAIS.percentualAteChaves,
  )
  const [valorDecoracao, setValorDecoracao] = useState<number>(
    PRESET_DOMINGOS_MORAIS.valorDecoracao,
  )

  // 2. RECEITA (100% editável)
  const [valorDiaria, setValorDiaria] = useState<number>(PRESET_DOMINGOS_MORAIS.valorDiaria)
  const [taxaOcupacaoPerc, setTaxaOcupacaoPerc] = useState<number>(
    PRESET_DOMINGOS_MORAIS.taxaOcupacaoPerc,
  )

  // 3. CUSTOS OPERACIONAIS DETALHADOS (100% editável)
  const [custosDetalhados, setCustosDetalhados] = useState<CustosOperacionaisDetalhados>(
    PRESET_DOMINGOS_MORAIS.custos,
  )

  // 4. FINANCIAMENTO (100% editável)
  const [financiamento, setFinanciamento] = useState<ParametrosFinanciamento>(
    PRESET_DOMINGOS_MORAIS.financiamento,
  )

  // 5. CRONOGRAMA & VALORIZAÇÃO
  const [valorizacaoObraPerc, setValorizacaoObraPerc] = useState<number>(32)
  const [mesInicioObra, setMesInicioObra] = useState<number>(3) // Abril (0-indexed)
  const [anoInicioObra, setAnoInicioObra] = useState<number>(2025)

  // CENÁRIOS COMPARATIVOS PRÉ-CONFIGURADOS (100% editáveis pelo usuário)
  const [cenariosState, setCenariosState] = useState<
    Array<{
      id: 'conservador' | 'provavel' | 'otimista'
      nome: string
      diaria: number
      taxaOcupacaoPerc: number
      taxaAdminHousiPerc: number
    }>
  >([
    {
      id: 'conservador',
      nome: 'Conservador',
      diaria: 270,
      taxaOcupacaoPerc: 65,
      taxaAdminHousiPerc: 18.0,
    },
    {
      id: 'provavel',
      nome: 'Provável',
      diaria: 300,
      taxaOcupacaoPerc: 70,
      taxaAdminHousiPerc: 16.5,
    },
    {
      id: 'otimista',
      nome: 'Otimista',
      diaria: 330,
      taxaOcupacaoPerc: 85,
      taxaAdminHousiPerc: 15.0,
    },
  ])

  // Estado para salvar simulação
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [tituloSimulacao, setTituloSimulacao] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Carrega lista de empreendimentos na montagem
  useEffect(() => {
    async function loadData() {
      const data = await listarEmpreendimentos()
      setEmpreendimentos(data)

      const state = location.state as {
        selectedEmpreendimentoId?: string
        simulacaoCarregada?: SimulacaoRecord
      } | null

      if (state?.simulacaoCarregada) {
        carregarSimulacaoDoRegistro(state.simulacaoCarregada, data)
      } else if (state?.selectedEmpreendimentoId) {
        const matching = data.find((e) => e.id === state.selectedEmpreendimentoId)
        if (matching) {
          setSelectedEmpreendimentoId(matching.id)
          aplicarEmpreendimento(matching)
        }
      } else {
        // Encontra o empreendimento Domingos de Morais da base
        const domingos = data.find((e) => e.nome.includes('Domingos de Morais'))
        if (domingos) {
          setSelectedEmpreendimentoId(domingos.id)
        }
      }
    }
    loadData()
  }, [])

  // Aplica dados de um empreendimento selecionado do banco
  const aplicarEmpreendimento = (emp: EmpreendimentoRecord) => {
    setNomeEmpreendimento(emp.nome)
    setBairro(emp.bairro)
    setEndereco(emp.endereco)
    setValorDiaria(emp.valor_diaria)
    // Calcula valor inicial do imóvel com base no m² e metragem atual
    const valTotal = emp.valor_m2 * metragem
    setValorImovel(valTotal)
    // Atualiza saldo financiado (70%)
    setFinanciamento((prev) => ({
      ...prev,
      valorFinanciado: valTotal * (1 - percentualAteChaves / 100),
    }))
  }

  const handleSelectEmpreendimento = (empId: string) => {
    setSelectedEmpreendimentoId(empId)
    const emp = empreendimentos.find((e) => e.id === empId)
    if (emp) {
      aplicarEmpreendimento(emp)
    }
  }

  // Carrega dados de uma simulação salva
  const carregarSimulacaoDoRegistro = (s: SimulacaoRecord, lista: EmpreendimentoRecord[]) => {
    const res = s.resultados
    setNomeEmpreendimento(s.empreendimento || '')
    setBairro(s.bairro || '')
    setEndereco(s.endereco || '')
    setMetragem(s.metragem)
    setValorDiaria(s.valor_diaria)
    setTaxaOcupacaoPerc(Math.round(s.taxa_ocupacao * 100))
    setValorizacaoObraPerc(Math.round(s.valorizacao_obra * 100))
    setTituloSimulacao(s.titulo || '')

    // Carrega campos novos ou valores legados
    if (res?.valorImovelSemDecoracao) {
      setValorImovel(res.valorImovelSemDecoracao)
      setPercentualAteChaves(res.percentualAteChaves ?? 30)
      setValorDecoracao(res.valorDecoracao ?? 59000)
    } else {
      setValorImovel(s.valor_m2 * s.metragem)
    }

    if (res?.custosOperacionaisDetalhados) {
      setCustosDetalhados(res.custosOperacionaisDetalhados)
    }

    if (res?.financiamento) {
      setFinanciamento({
        ativo: res.financiamento.valorFinanciado > 0,
        valorFinanciado: res.financiamento.valorFinanciado,
        taxaJurosAnualPerc: 10.0,
        prazoAnos: Math.round((res.financiamento.prazoMeses || 360) / 12),
        sistema: res.financiamento.sistema || 'SAC',
        valorParcelaManual: res.financiamento.manualOverride
          ? res.financiamento.parcelaEfetiva
          : undefined,
      })
    }

    const matching = lista.find((e) => e.nome === s.empreendimento)
    if (matching) setSelectedEmpreendimentoId(matching.id)
    toast.info(`Simulação "${s.titulo || s.empreendimento}" carregada com sucesso!`)
  }

  // Restaura todos os valores para o Slide Vitacon Domingos de Morais
  const restaurarPresetDomingosDeMorais = () => {
    setNomeEmpreendimento(PRESET_DOMINGOS_MORAIS.nome)
    setBairro(PRESET_DOMINGOS_MORAIS.bairro)
    setEndereco(PRESET_DOMINGOS_MORAIS.endereco)
    setMetragem(PRESET_DOMINGOS_MORAIS.metragem)
    setValorImovel(PRESET_DOMINGOS_MORAIS.valorImovel)
    setPercentualAteChaves(PRESET_DOMINGOS_MORAIS.percentualAteChaves)
    setValorDecoracao(PRESET_DOMINGOS_MORAIS.valorDecoracao)
    setValorDiaria(PRESET_DOMINGOS_MORAIS.valorDiaria)
    setTaxaOcupacaoPerc(PRESET_DOMINGOS_MORAIS.taxaOcupacaoPerc)
    setCustosDetalhados({ ...PRESET_DOMINGOS_MORAIS.custos })
    setFinanciamento({ ...PRESET_DOMINGOS_MORAIS.financiamento })
    toast.success('Valores padrão do slide Vitacon Domingos de Morais restaurados!')
  }

  // Data de início da obra
  const dataInicioObra = useMemo(() => {
    return new Date(anoInicioObra, mesInicioObra, 1)
  }, [anoInicioObra, mesInicioObra])

  // Saldo residual sugerido (70% do imóvel)
  const saldoRestanteSugerido = useMemo(() => {
    return Math.max(0, valorImovel * (1 - percentualAteChaves / 100))
  }, [valorImovel, percentualAteChaves])

  // Cálculo financeiro completo do cenário principal
  const resultados = useMemo(() => {
    return calcularSimulacaoCompleta({
      valorImovel,
      percentualAteChavesPerc: percentualAteChaves,
      valorDecoracao,
      valorDiaria,
      taxaOcupacaoPerc,
      custosDetalhados,
      financiamento: {
        ...financiamento,
        valorFinanciado:
          financiamento.valorFinanciado > 0 ? financiamento.valorFinanciado : saldoRestanteSugerido,
      },
      valorizacaoObraPerc: valorizacaoObraPerc / 100,
      dataInicioObra,
    })
  }, [
    valorImovel,
    percentualAteChaves,
    valorDecoracao,
    valorDiaria,
    taxaOcupacaoPerc,
    custosDetalhados,
    financiamento,
    saldoRestanteSugerido,
    valorizacaoObraPerc,
    dataInicioObra,
  ])

  // Cálculo dos 3 cenários comparativos (Conservador, Provável, Otimista)
  const cenariosComparativos = useMemo<CenarioComparativo[]>(() => {
    return cenariosState.map((cen) => {
      const res = calcularSimulacaoCompleta({
        valorImovel,
        percentualAteChavesPerc: percentualAteChaves,
        valorDecoracao,
        valorDiaria: cen.diaria,
        taxaOcupacaoPerc: cen.taxaOcupacaoPerc,
        custosDetalhados: {
          ...custosDetalhados,
          taxaAdminHousiPerc: cen.taxaAdminHousiPerc / 100,
        },
        financiamento,
        valorizacaoObraPerc: valorizacaoObraPerc / 100,
        dataInicioObra,
      })

      return {
        id: cen.id,
        nome: cen.nome,
        diaria: cen.diaria,
        taxaOcupacaoPerc: cen.taxaOcupacaoPerc,
        taxaAdminHousiPerc: cen.taxaAdminHousiPerc,
        faturamentoBruto: res.faturamentoBrutoMensal,
        totalDespesas: res.totalDespesasMensais,
        sobraLiquida: res.resultadoLiquidoFinal,
        rentabilidadeMensalSobreAporte: res.rentabilidadeMensalSobreAporte,
        rentabilidadeAnualSobreAporte: res.rentabilidadeAnualSobreAporte,
        rentabilidadeMensalSobrePatrimonio: res.rentabilidadeMensalSobrePatrimonio,
        rentabilidadeAnualSobrePatrimonio: res.rentabilidadeAnualSobrePatrimonio,
        paybackAnos: res.paybackAnos,
      }
    })
  }, [
    cenariosState,
    valorImovel,
    percentualAteChaves,
    valorDecoracao,
    custosDetalhados,
    financiamento,
    valorizacaoObraPerc,
    dataInicioObra,
  ])

  // Handlers para Cenários Comparativos
  const handleAtualizarCenario = (
    id: CenarioComparativo['id'],
    campo: 'diaria' | 'taxaOcupacaoPerc' | 'taxaAdminHousiPerc',
    valor: number,
  ) => {
    setCenariosState((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [campo]: Math.max(0, valor) } : c)),
    )
  }

  const handleRestaurarCenariosPadroes = () => {
    setCenariosState([
      {
        id: 'conservador',
        nome: 'Conservador',
        diaria: 270,
        taxaOcupacaoPerc: 65,
        taxaAdminHousiPerc: 18.0,
      },
      {
        id: 'provavel',
        nome: 'Provável',
        diaria: 300,
        taxaOcupacaoPerc: 70,
        taxaAdminHousiPerc: 16.5,
      },
      {
        id: 'otimista',
        nome: 'Otimista',
        diaria: 330,
        taxaOcupacaoPerc: 85,
        taxaAdminHousiPerc: 15.0,
      },
    ])
    toast.info('Cenários comparativos restaurados aos padrões!')
  }

  const handleAplicarCenarioAoSimulador = (cenario: CenarioComparativo) => {
    setValorDiaria(cenario.diaria)
    setTaxaOcupacaoPerc(cenario.taxaOcupacaoPerc)
    setCustosDetalhados((prev) => ({
      ...prev,
      taxaAdminHousiPerc: cenario.taxaAdminHousiPerc / 100,
    }))
    toast.success(`Cenário "${cenario.nome}" aplicado ao simulador!`)
  }

  // Salvar Simulação no PocketBase
  const handleSalvarSimulacao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Você precisa estar logado para salvar.')
      return
    }

    try {
      setIsSaving(true)
      const nomeFinal = tituloSimulacao.trim() || `${nomeEmpreendimento} - ${metragem}m²`

      await criarSimulacao({
        user: user.id,
        titulo: nomeFinal,
        empreendimento: nomeEmpreendimento,
        bairro,
        endereco,
        valor_m2: metragem > 0 ? Math.round(valorImovel / metragem) : 0,
        metragem,
        valor_diaria: valorDiaria,
        taxa_ocupacao: taxaOcupacaoPerc / 100,
        custos_operacionais:
          resultados.faturamentoBrutoMensal > 0
            ? resultados.totalDespesasMensais / resultados.faturamentoBrutoMensal
            : 0.24,
        valorizacao_obra: valorizacaoObraPerc / 100,
        resultados,
      })

      toast.success('Simulação salva com sucesso!')
      setSaveModalOpen(false)
      setTituloSimulacao('')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar simulação.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Título e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DFD6] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2A24]">
              Simulador de Rentabilidade Vitacon
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#0F6B4F]/10 px-2.5 py-0.5 text-xs font-bold text-[#0F6B4F]">
              <Sparkles className="h-3 w-3" />
              Short Stay + Housi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5E6E64] mt-1">
            Simulador financeiro completo, interativo e 100% personalizável para viabilidade de
            investimento
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Restaurar Exemplo do Slide */}
          <Button
            type="button"
            variant="outline"
            onClick={restaurarPresetDomingosDeMorais}
            className="rounded-xl border-[#E3DFD6] hover:bg-neutral-100 text-xs font-semibold gap-1.5 text-[#5E6E64] hover:text-[#1F2A24]"
            title="Carregar números do Slide Vitacon Domingos de Morais"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exemplo Slide</span>
          </Button>

          {/* Modal de Salvar */}
          <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0F6B4F] hover:bg-[#0B5740] text-white rounded-xl gap-2 font-semibold shadow-md shadow-[#0F6B4F]/20 active:scale-95 transition-transform text-xs sm:text-sm">
                <Save className="h-4 w-4" />
                <span>Salvar Simulação</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl border-[#E3DFD6] bg-white sm:max-w-md">
              <form onSubmit={handleSalvarSimulacao}>
                <DialogHeader>
                  <DialogTitle className="text-[#1F2A24]">Salvar Simulação</DialogTitle>
                  <DialogDescription className="text-xs text-[#5E6E64]">
                    Dê um nome para identificar este estudo financeiro completo em "Minhas
                    Simulações".
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="titulo-sim" className="text-xs font-semibold text-[#1F2A24]">
                      Nome ou Identificação
                    </Label>
                    <Input
                      id="titulo-sim"
                      placeholder={`Ex: ${nomeEmpreendimento} Studio ${metragem}m²`}
                      value={tituloSimulacao}
                      onChange={(e) => setTituloSimulacao(e.target.value)}
                      className="rounded-xl border-[#E3DFD6] focus-visible:ring-[#0F6B4F]"
                      autoFocus
                    />
                  </div>

                  <div className="rounded-xl bg-[#F7F5F1] p-3 border border-[#E3DFD6] text-xs space-y-1.5 text-[#5E6E64]">
                    <div className="flex justify-between">
                      <span>Empreendimento:</span>
                      <strong className="text-[#1F2A24]">{nomeEmpreendimento}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Imóvel com Decoração:</span>
                      <strong className="text-[#1F2A24]">
                        {formatCurrency(resultados.patrimonioTotal)} ({metragem} m²)
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Aporte Total Inicial:</span>
                      <strong className="text-[#1F2A24]">
                        {formatCurrency(resultados.totalInvestidoAporte)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Sobra Líquida no Bolso:</span>
                      <strong className="text-[#0F6B4F] font-bold">
                        {formatCurrency(resultados.resultadoLiquidoFinal)}/mês
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Rentabilidade sobre Aporte:</span>
                      <strong className="text-[#0F6B4F] font-bold">
                        {formatPercent(resultados.rentabilidadeMensalSobreAporte, 2)} a.m. (
                        {formatPercent(resultados.rentabilidadeAnualSobreAporte, 1)} a.a.)
                      </strong>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSaveModalOpen(false)}
                    className="rounded-xl border-[#E3DFD6]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white"
                  >
                    {isSaving ? 'Salvando...' : 'Confirmar e Salvar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SEÇÃO SLIDE VITACON ORIGINAL (Réplica Visual Exata do Slide da Apresentação) */}
      <SlideVitaconView
        nomeEmpreendimento={nomeEmpreendimento}
        metragem={metragem}
        resultados={resultados}
      />

      {/* Grid de Edição e Análises Avançadas: 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* =======================================================
            COLUNA ESQUERDA: PARÂMETROS EDITÁVEIS (5 Colunas)
            ======================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Premissas do Imóvel & Investimento */}
          <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-[#E3DFD6]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F6B4F]/10 text-[#0F6B4F]">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-[#1F2A24]">
                    Investimento & Studio
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5E6E64]">
                    Imóvel, decoração Housi e condições até as chaves
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Seletor de Empreendimento */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#1F2A24]">
                  Empreendimento Vitacon
                </Label>
                <Select value={selectedEmpreendimentoId} onValueChange={handleSelectEmpreendimento}>
                  <SelectTrigger className="h-11 rounded-xl border-[#E3DFD6] text-xs font-medium focus:ring-[#0F6B4F] bg-white">
                    <SelectValue placeholder="Selecione um empreendimento..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 rounded-xl border-[#E3DFD6] bg-white">
                    {empreendimentos.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="text-xs py-2">
                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-[#1F2A24]">{emp.nome}</span>
                          <span className="text-[11px] text-[#5E6E64]">
                            {emp.bairro} • {emp.endereco}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sub-informações */}
                <div className="mt-1 rounded-xl bg-[#F7F5F1] p-2.5 border border-[#E3DFD6] text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#5E6E64] truncate">
                    <Home className="h-3.5 w-3.5 text-[#0F6B4F] shrink-0" />
                    <span className="truncate">
                      {endereco} — <strong>{bairro}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Valor do Imóvel e Metragem */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="val-imovel" className="text-xs font-semibold text-[#1F2A24]">
                    Valor do Imóvel (R$)
                  </Label>
                  <CurrencyInput
                    id="val-imovel"
                    value={valorImovel}
                    onChange={setValorImovel}
                    className="h-10 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="metragem-studio" className="text-xs font-semibold text-[#1F2A24]">
                    Metragem (m²)
                  </Label>
                  <Input
                    id="metragem-studio"
                    type="number"
                    value={metragem === 0 ? '' : metragem}
                    onFocus={(e) => {
                      if (metragem === 0) e.target.value = ''
                    }}
                    onChange={(e) => {
                      const v = e.target.value
                      setMetragem(v === '' ? 0 : Number(v))
                    }}
                    className="h-10 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
                    min={1}
                    max={500}
                    step={0.5}
                  />
                </div>
              </div>

              {/* Percentual Pago até as Chaves e Decoração Housi */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="perc-chaves" className="text-xs font-semibold text-[#1F2A24]">
                    Entrada / Chaves (%)
                  </Label>
                  <PercentInput
                    id="perc-chaves"
                    value={percentualAteChaves}
                    onChange={setPercentualAteChaves}
                    decimals={1}
                    min={0}
                    max={100}
                    className="h-10 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="val-decoracao" className="text-xs font-semibold text-[#1F2A24]">
                    Decoração Housi (R$)
                  </Label>
                  <CurrencyInput
                    id="val-decoracao"
                    value={valorDecoracao}
                    onChange={setValorDecoracao}
                    className="h-10 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
                  />
                </div>
              </div>

              {/* Resumo da Estrutura de Investimento */}
              <div className="rounded-xl bg-[#F7F5F1] p-3 border border-[#E3DFD6] space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#5E6E64]">
                    Montante até as Chaves ({percentualAteChaves}%):
                  </span>
                  <strong className="text-[#1F2A24] tabular-nums">
                    {formatCurrency(resultados.montanteAteChaves)}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5E6E64]">Aporte Total c/ Decoração:</span>
                  <strong className="text-[#0F6B4F] tabular-nums">
                    {formatCurrency(resultados.totalInvestidoAporte)}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5E6E64]">Saldo Restante a Financiar:</span>
                  <strong className="text-neutral-900 tabular-nums">
                    {formatCurrency(resultados.saldoRestanteFinanciar)}
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Premissas de Locação (Diária e Ocupação) */}
          <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-[#E3DFD6]">
              <CardTitle className="text-sm sm:text-base font-bold text-[#1F2A24]">
                Premissas de Short Stay (Locação)
              </CardTitle>
              <CardDescription className="text-xs text-[#5E6E64]">
                Valor da diária e taxa de ocupação mensal estimada
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="val-diaria" className="text-xs font-semibold text-[#1F2A24]">
                    Valor Médio da Diária (R$)
                  </Label>
                  <span className="text-[11px] text-[#5E6E64]">Bairro: {bairro}</span>
                </div>
                <CurrencyInput
                  id="val-diaria"
                  value={valorDiaria}
                  onChange={setValorDiaria}
                  className="h-10 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
                />
              </div>

              {/* Slider Ocupação */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#1F2A24]">Taxa de Ocupação</span>
                  <span className="rounded-lg bg-[#0F6B4F]/10 px-2 py-0.5 text-[#0F6B4F] font-bold tabular-nums">
                    {taxaOcupacaoPerc}% ({Math.round(30 * (taxaOcupacaoPerc / 100))} dias/mês)
                  </span>
                </div>
                <Slider
                  value={[taxaOcupacaoPerc]}
                  onValueChange={(vals) => setTaxaOcupacaoPerc(vals[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#5E6E64]">
                  <span>0%</span>
                  <span>50%</span>
                  <span>70% (Slide Domingos)</span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Custos Operacionais Detalhados */}
          <CustosDetalhadosCard
            custos={custosDetalhados}
            faturamentoBruto={resultados.faturamentoBrutoMensal}
            onChange={setCustosDetalhados}
          />

          {/* Card 4: Financiamento Imobiliário */}
          <FinancingCard
            saldoSugerido={resultados.saldoRestanteFinanciar}
            parametros={financiamento}
            resultado={resultados.financiamento}
            onChange={setFinanciamento}
          />

          {/* Card 5: Cronograma de Obra & Valorização */}
          <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <Label className="text-xs font-semibold text-[#5E6E64] flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#0F6B4F]" />
              <span>Cronograma: Início da Obra</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={mesInicioObra.toString()}
                onValueChange={(v) => setMesInicioObra(Number(v))}
              >
                <SelectTrigger className="h-10 rounded-xl border-[#E3DFD6] text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {mesesNomesAbrev.map((m, idx) => (
                    <SelectItem key={m} value={idx.toString()} className="text-xs">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={anoInicioObra.toString()}
                onValueChange={(v) => setAnoInicioObra(Number(v))}
              >
                <SelectTrigger className="h-10 rounded-xl border-[#E3DFD6] text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {[2024, 2025, 2026, 2027].map((ano) => (
                    <SelectItem key={ano} value={ano.toString()} className="text-xs">
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Slider de Valorização no Período de Obra */}
            <div className="space-y-1.5 pt-2 border-t border-[#E3DFD6]">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#1F2A24]">Valorização no Período de Obra</span>
                <span className="rounded-lg bg-[#C9A227]/15 px-2 py-0.5 text-[#B08D1E] font-bold tabular-nums">
                  +{valorizacaoObraPerc}%
                </span>
              </div>
              <Slider
                value={[valorizacaoObraPerc]}
                onValueChange={(vals) => setValorizacaoObraPerc(vals[0])}
                min={0}
                max={100}
                step={1}
                className="cursor-pointer"
              />
            </div>
          </Card>
        </div>

        {/* =======================================================
            COLUNA DIREITA: ANÁLISES & RESULTADOS AO VIVO (7 Colunas)
            ======================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Seção 1: Sobra Efetiva no Bolso (Destaque Principal) */}
          <div className="rounded-2xl border-2 border-[#0F6B4F] bg-gradient-to-br from-emerald-50 via-white to-[#F7F5F1] p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F6B4F] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Sobra Líquida Efetiva no Bolso do Investidor
                </span>
                <p className="text-3xl sm:text-4xl font-black text-[#0F6B4F] tabular-nums mt-1">
                  <AnimatedCounter
                    value={resultados.resultadoLiquidoFinal}
                    formatter={formatCurrency}
                  />
                  <span className="text-xs sm:text-sm font-semibold text-[#5E6E64]">
                    /mês livre
                  </span>
                </p>
                <p className="text-xs text-[#5E6E64] mt-1.5">
                  Receita líquida ({formatCurrency(resultados.receitaLiquidaAntesFinanciamento)}) −
                  Parcela financiamento ({formatCurrency(resultados.financiamento.parcelaEfetiva)})
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <div className="rounded-xl bg-white px-4 py-2 border border-[#E3DFD6] shadow-xs text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6E64] block">
                    Rentabilidade s/ Aporte
                  </span>
                  <span className="text-base font-black text-[#0F6B4F] tabular-nums">
                    {formatPercent(resultados.rentabilidadeMensalSobreAporte, 2)} a.m.
                  </span>
                  <span className="text-[10px] text-[#5E6E64] block">
                    {formatPercent(resultados.rentabilidadeAnualSobreAporte, 1)} a.a.
                  </span>
                </div>

                <div className="rounded-xl bg-white px-4 py-2 border border-[#E3DFD6] shadow-xs text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6E64] block">
                    Payback Estimado
                  </span>
                  <span className="text-sm font-black text-[#1F2A24] tabular-nums">
                    {resultados.paybackAnos < 90
                      ? `${resultados.paybackAnos.toFixed(1)} anos`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Ponto de Equilíbrio (Break-Even) */}
          <BreakEvenCard
            pontoEquilibrio={resultados.pontoEquilibrio}
            diariaAtual={valorDiaria}
            ocupacaoAtualPerc={taxaOcupacaoPerc}
            comFinanciamento={financiamento.ativo}
          />

          {/* Seção 3: Comparação de Cenários (Conservador, Provável, Otimista) */}
          <ScenarioCompare
            cenarios={cenariosComparativos}
            onAtualizarCenario={handleAtualizarCenario}
            onRestaurarPadroes={handleRestaurarCenariosPadroes}
            onAplicarAoSimulador={handleAplicarCenarioAoSimulador}
          />

          {/* Seção 4: Tabela Plano de Pagamento em Obras */}
          <PlanoPagamentoTable
            plano={resultados.planoPagamento}
            valorTotalImovel={resultados.valorImovelSemDecoracao}
          />

          {/* Seção 5: Gráfico de Valorização no Período de Obra */}
          <Card className="rounded-2xl border border-[#E3DFD6] bg-white p-5 shadow-sm">
            <AppreciationChart
              valorInicial={resultados.valorImovelSemDecoracao}
              valorizacaoPercent={valorizacaoObraPerc}
              dataInicioObra={dataInicioObra}
            />
          </Card>

          {/* Seção 6: Memória de Cálculo Expansível */}
          <MemoriaCalculo
            valorDiaria={valorDiaria}
            valorTotalImovel={resultados.valorImovelSemDecoracao}
            faturamentoBruto={resultados.faturamentoBrutoMensal}
            custosOperacionais={resultados.totalDespesasMensais}
            lucroLiquido={resultados.resultadoLiquidoFinal}
            dataInicioObra={dataInicioObra}
            taxaJurosAnual={financiamento.taxaJurosAnualPerc}
            sistemaFinanc={financiamento.sistema}
            parcelaFinanc={financiamento.ativo ? resultados.financiamento.parcelaEfetiva : 0}
          />
        </div>
      </div>
    </div>
  )
}
