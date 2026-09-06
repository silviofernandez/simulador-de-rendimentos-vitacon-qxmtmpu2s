import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { EmpreendimentoRecord, SimulacaoRecord } from '@/types/simulador'
import { listarEmpreendimentos } from '@/services/empreendimentos'
import { criarSimulacao } from '@/services/simulacoes'
import { calcularSimulacao, formatCurrency, formatPercent, mesesNomesAbrev } from '@/lib/calculos'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
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
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import {
  Building2,
  TrendingUp,
  Percent,
  Calendar,
  Save,
  CheckCircle2,
  Sparkles,
  PieChart,
  DollarSign,
  ArrowRight,
  SlidersHorizontal,
  Home,
  Info,
} from 'lucide-react'

export default function IndexPage() {
  const { user } = useAuth()
  const location = useLocation()

  // Base de empreendimentos do PocketBase
  const [empreendimentos, setEmpreendimentos] = useState<EmpreendimentoRecord[]>([])
  const [selectedEmpreendimentoId, setSelectedEmpreendimentoId] = useState<string>('')

  // Parâmetros de Entrada da Simulação
  // Defaults alinhados com o caso de teste da planilha Vitacon:
  // Studio 25 m², m² 32.400, diária 300, ocupação 75%, custos 24%, valorização 32%
  const [valorM2, setValorM2] = useState<number>(32400)
  const [metragem, setMetragem] = useState<number>(25)
  const [valorDiaria, setValorDiaria] = useState<number>(300)
  const [taxaOcupacaoPerc, setTaxaOcupacaoPerc] = useState<number>(75)
  const [custosOperacionaisPerc, setCustosOperacionaisPerc] = useState<number>(24)
  const [valorizacaoObraPerc, setValorizacaoObraPerc] = useState<number>(32)

  // Configurações da Obra (Datas)
  const [mesInicioObra, setMesInicioObra] = useState<number>(3) // Abril (0-indexed)
  const [anoInicioObra, setAnoInicioObra] = useState<number>(2025)

  // Metadados
  const [bairro, setBairro] = useState<string>('Vila Mariana')
  const [endereco, setEndereco] = useState<string>('Rua Domingos de Morais, 3093')
  const [nomeEmpreendimento, setNomeEmpreendimento] = useState<string>('Vitacon Domingos de Morais')

  // Estado para salvar simulação
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [tituloSimulacao, setTituloSimulacao] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Carrega lista de empreendimentos na montagem
  useEffect(() => {
    async function loadData() {
      const data = await listarEmpreendimentos()
      setEmpreendimentos(data)

      // Se houver navegação vinda do banco de dados ou lista
      const state = location.state as {
        selectedEmpreendimentoId?: string
        simulacaoCarregada?: SimulacaoRecord
      } | null

      if (state?.simulacaoCarregada) {
        const s = state.simulacaoCarregada
        setValorM2(s.valor_m2)
        setMetragem(s.metragem)
        setValorDiaria(s.valor_diaria)
        setTaxaOcupacaoPerc(Math.round(s.taxa_ocupacao * 100))
        setCustosOperacionaisPerc(Math.round(s.custos_operacionais * 100))
        setValorizacaoObraPerc(Math.round(s.valorizacao_obra * 100))
        setNomeEmpreendimento(s.empreendimento || '')
        setBairro(s.bairro || '')
        setEndereco(s.endereco || '')
        setTituloSimulacao(s.titulo || '')

        const matching = data.find((e) => e.nome === s.empreendimento)
        if (matching) setSelectedEmpreendimentoId(matching.id)
        toast.info(`Simulação "${s.titulo || s.empreendimento}" carregada!`)
      } else if (state?.selectedEmpreendimentoId) {
        const matching = data.find((e) => e.id === state.selectedEmpreendimentoId)
        if (matching) {
          setSelectedEmpreendimentoId(matching.id)
          aplicarEmpreendimento(matching)
        }
      } else {
        // Default inicial: Vitacon Domingos de Morais (ou primeiro disponível)
        const def = data.find((e) => e.nome.includes('Domingos de Morais')) || data[0]
        if (def) {
          setSelectedEmpreendimentoId(def.id)
          aplicarEmpreendimento(def)
        }
      }
    }
    loadData()
  }, [])

  const aplicarEmpreendimento = (emp: EmpreendimentoRecord) => {
    setNomeEmpreendimento(emp.nome)
    setBairro(emp.bairro)
    setEndereco(emp.endereco)
    setValorDiaria(emp.valor_diaria)
    setValorM2(emp.valor_m2)
  }

  const handleSelectEmpreendimento = (empId: string) => {
    setSelectedEmpreendimentoId(empId)
    const emp = empreendimentos.find((e) => e.id === empId)
    if (emp) {
      aplicarEmpreendimento(emp)
    }
  }

  // Data de início da obra para o cálculo
  const dataInicioObra = useMemo(() => {
    return new Date(anoInicioObra, mesInicioObra, 1)
  }, [anoInicioObra, mesInicioObra])

  // Cálculo financeiro dinâmico e estrito do modelo Vitacon
  const resultados = useMemo(() => {
    return calcularSimulacao({
      valorM2: valorM2 || 0,
      metragem: metragem || 0,
      valorDiaria: valorDiaria || 0,
      taxaOcupacao: (taxaOcupacaoPerc || 0) / 100,
      custosOperacionaisPerc: (custosOperacionaisPerc || 0) / 100,
      valorizacaoObraPerc: (valorizacaoObraPerc || 0) / 100,
      dataInicioObra,
    })
  }, [
    valorM2,
    metragem,
    valorDiaria,
    taxaOcupacaoPerc,
    custosOperacionaisPerc,
    valorizacaoObraPerc,
    dataInicioObra,
  ])

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
        valor_m2: valorM2,
        metragem,
        valor_diaria: valorDiaria,
        taxa_ocupacao: taxaOcupacaoPerc / 100,
        custos_operacionais: custosOperacionaisPerc / 100,
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
      {/* Banner / Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DFD6] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2A24]">
            Simulador de Rentabilidade Vitacon
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6E64] mt-0.5">
            Projeção dinâmica de faturamento mensal, rendimento sobre aporte e valorização
            patrimonial
          </p>
        </div>

        {/* Modal de Salvar */}
        <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0F6B4F] hover:bg-[#0B5740] text-white rounded-xl gap-2 font-semibold shadow-md shadow-[#0F6B4F]/20 active:scale-95 transition-transform">
              <Save className="h-4 w-4" />
              <span>Salvar Simulação</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-[#E3DFD6] bg-white sm:max-w-md">
            <form onSubmit={handleSalvarSimulacao}>
              <DialogHeader>
                <DialogTitle className="text-[#1F2A24]">Salvar Simulação</DialogTitle>
                <DialogDescription className="text-xs text-[#5E6E64]">
                  Dê um nome para identificar este estudo financeiro em "Minhas Simulações".
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

                <div className="rounded-xl bg-[#F7F5F1] p-3 border border-[#E3DFD6] text-xs space-y-1 text-[#5E6E64]">
                  <div className="flex justify-between">
                    <span>Empreendimento:</span>
                    <strong className="text-[#1F2A24]">{nomeEmpreendimento}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Imóvel / Metragem:</span>
                    <strong className="text-[#1F2A24]">
                      {formatCurrency(resultados.valorTotalImovel)} ({metragem} m²)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Lucro Líquido Estimado:</span>
                    <strong className="text-[#0F6B4F]">
                      {formatCurrency(resultados.lucroLiquidoMensal)}/mês
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

      {/* Grid Principal: 2 Colunas Desktop (5 : 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* =======================================================
            PAINEL ESQUERDO: DADOS DE ENTRADA (5 Colunas)
            ======================================================= */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-4 border-b border-[#E3DFD6]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F6B4F]/10 text-[#0F6B4F]">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#1F2A24]">
                    Dados de Entrada
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5E6E64]">
                    Selecione o studio e calibre as premissas de mercado
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-5 space-y-5">
              {/* Seletor de Empreendimento */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-[#1F2A24]">
                  Empreendimento Vitacon
                </Label>
                <Select value={selectedEmpreendimentoId} onValueChange={handleSelectEmpreendimento}>
                  <SelectTrigger className="h-12 rounded-xl border-[#E3DFD6] text-xs font-medium focus:ring-[#0F6B4F] bg-white">
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

                {/* Sub-informações do empreendimento selecionado */}
                <div className="mt-1 rounded-xl bg-[#F7F5F1] p-2.5 border border-[#E3DFD6] text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#5E6E64] truncate">
                    <Home className="h-3.5 w-3.5 text-[#0F6B4F] shrink-0" />
                    <span className="truncate">
                      {endereco} — <strong>{bairro}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Valor do m² e Metragem */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="valor-m2" className="text-xs font-semibold text-[#1F2A24]">
                    Valor do m² (R$)
                  </Label>
                  <div className="relative">
                    <Input
                      id="valor-m2"
                      type="number"
                      value={valorM2}
                      onChange={(e) => setValorM2(Number(e.target.value))}
                      className="h-11 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
                      step={500}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="metragem" className="text-xs font-semibold text-[#1F2A24]">
                    Metragem Studio (m²)
                  </Label>
                  <Input
                    id="metragem"
                    type="number"
                    value={metragem}
                    onChange={(e) => setMetragem(Number(e.target.value))}
                    className="h-11 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
                    min={10}
                    max={150}
                  />
                </div>
              </div>

              {/* Valor da Diária (R$) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="valor-diaria" className="text-xs font-semibold text-[#1F2A24]">
                    Valor da Diária de Locação (R$)
                  </Label>
                  <span className="text-[11px] text-[#5E6E64]">Média Bairro: {bairro}</span>
                </div>
                <Input
                  id="valor-diaria"
                  type="number"
                  value={valorDiaria}
                  onChange={(e) => setValorDiaria(Number(e.target.value))}
                  className="h-11 rounded-xl border-[#E3DFD6] text-xs font-medium focus-visible:ring-[#0F6B4F]"
                  step={10}
                />
              </div>

              {/* Slider 1: Taxa de Ocupação */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#1F2A24]">Taxa de Ocupação</span>
                  <span className="rounded-lg bg-[#0F6B4F]/10 px-2 py-0.5 text-[#0F6B4F] font-bold tabular-nums">
                    {taxaOcupacaoPerc}% ({Math.round(30 * (taxaOcupacaoPerc / 100) * 10) / 10}{' '}
                    dias/mês)
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
                  <span>75% (Referência)</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Slider 2: Custos Operacionais */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#1F2A24]">Custos Operacionais</span>
                  <span className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-amber-700 font-bold tabular-nums">
                    {custosOperacionaisPerc}% ({formatCurrency(resultados.custosOperacionais)})
                  </span>
                </div>
                <Slider
                  value={[custosOperacionaisPerc]}
                  onValueChange={(vals) => setCustosOperacionaisPerc(vals[0])}
                  min={0}
                  max={40}
                  step={1}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#5E6E64]">
                  <span>0%</span>
                  <span>24% (Padrão mercado)</span>
                  <span>40%</span>
                </div>
              </div>

              {/* Slider 3: Valorização na Obra */}
              <div className="space-y-2 pt-1">
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
                <div className="flex justify-between text-[10px] text-[#5E6E64]">
                  <span>0%</span>
                  <span>32% (Média histórica)</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Configuração de início da obra (Data) */}
              <div className="border-t border-[#E3DFD6] pt-4 space-y-2">
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =======================================================
            PAINEL DIREITO: RESULTADOS AO VIVO (7 Colunas)
            ======================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Seção 1: KPIs Principais (Borda Superior Verde Esmeralda) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5E6E64]">
                Métricas Financeiras do Studio
              </span>
              <span className="text-xs text-[#0F6B4F] font-semibold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Recálculo em tempo real
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* KPI 1: Valor Total do Imóvel */}
              <Card className="rounded-2xl border border-[#E3DFD6] bg-white shadow-sm overflow-hidden hover:-translate-y-0.5 transition-all">
                <div className="h-1 bg-[#0F6B4F] w-full" />
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#5E6E64]">
                    Valor do Imóvel
                  </p>
                  <p className="text-lg sm:text-2xl font-extrabold text-[#1F2A24] mt-1 tabular-nums">
                    <AnimatedCounter
                      value={resultados.valorTotalImovel}
                      formatter={formatCurrency}
                    />
                  </p>
                  <p className="text-[11px] text-[#5E6E64] mt-1">
                    {metragem} m² × {formatCurrency(valorM2)}/m²
                  </p>
                </CardContent>
              </Card>

              {/* KPI 2: Faturamento Bruto Mensal */}
              <Card className="rounded-2xl border border-[#E3DFD6] bg-white shadow-sm overflow-hidden hover:-translate-y-0.5 transition-all">
                <div className="h-1 bg-[#0F6B4F] w-full" />
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#5E6E64]">
                    Faturamento Bruto
                  </p>
                  <p className="text-lg sm:text-2xl font-extrabold text-[#0F6B4F] mt-1 tabular-nums">
                    <AnimatedCounter
                      value={resultados.faturamentoBrutoMensal}
                      formatter={formatCurrency}
                    />
                    <span className="text-xs font-normal text-[#5E6E64]">/mês</span>
                  </p>
                  <p className="text-[11px] text-[#5E6E64] mt-1">
                    {formatCurrency(valorDiaria)} × {taxaOcupacaoPerc}% ocupação
                  </p>
                </CardContent>
              </Card>

              {/* KPI 3: Custos Operacionais */}
              <Card className="rounded-2xl border border-[#E3DFD6] bg-white shadow-sm overflow-hidden hover:-translate-y-0.5 transition-all">
                <div className="h-1 bg-[#0F6B4F] w-full" />
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#5E6E64]">
                    Custos Operacionais
                  </p>
                  <p className="text-lg sm:text-2xl font-extrabold text-[#C62828] mt-1 tabular-nums">
                    <AnimatedCounter
                      value={resultados.custosOperacionais}
                      formatter={formatCurrency}
                    />
                    <span className="text-xs font-normal text-[#5E6E64]">/mês</span>
                  </p>
                  <p className="text-[11px] text-[#5E6E64] mt-1">
                    {custosOperacionaisPerc}% da receita bruta
                  </p>
                </CardContent>
              </Card>

              {/* KPI 4: Lucro Líquido Mensal */}
              <Card className="rounded-2xl border border-[#E3DFD6] bg-white shadow-sm overflow-hidden hover:-translate-y-0.5 transition-all">
                <div className="h-1 bg-[#0F6B4F] w-full" />
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#5E6E64]">
                    Lucro Líquido Mensal
                  </p>
                  <p className="text-lg sm:text-2xl font-extrabold text-[#0F6B4F] mt-1 tabular-nums">
                    <AnimatedCounter
                      value={resultados.lucroLiquidoMensal}
                      formatter={formatCurrency}
                    />
                    <span className="text-xs font-normal text-[#5E6E64]">/mês</span>
                  </p>
                  <p className="text-[11px] text-[#5E6E64] mt-1">Livre de custos operacionais</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Seção 2: Rentabilidades (Borda Superior Dourada #C9A227) */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5E6E64]">
              Indicadores de Rentabilidade (Yield)
            </span>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Rentabilidade Mensal sobre Patrimônio */}
              <Card className="rounded-2xl border border-[#E3DFD6] bg-white shadow-sm overflow-hidden hover:-translate-y-0.5 transition-all">
                <div className="h-1 bg-[#C9A227] w-full" />
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#5E6E64]">
                    Rentab. Mensal s/ Patrimônio
                  </p>
                  <p className="text-lg sm:text-2xl font-extrabold text-[#1F2A24] mt-1 tabular-nums">
                    <AnimatedCounter
                      value={resultados.rentabilidadeMensalPatrimonio}
                      formatter={(v) => formatPercent(v, 2)}
                    />
                    <span className="text-xs font-normal text-[#5E6E64]"> a.m.</span>
                  </p>
                  <p className="text-[11px] text-[#5E6E64] mt-1">Lucro Líquido ÷ Valor Total</p>
                </CardContent>
              </Card>

              {/* Rentabilidade Anual sobre Patrimônio */}
              <Card className="rounded-2xl border border-[#E3DFD6] bg-white shadow-sm overflow-hidden hover:-translate-y-0.5 transition-all">
                <div className="h-1 bg-[#C9A227] w-full" />
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#5E6E64]">
                    Rentab. Anual s/ Patrimônio
                  </p>
                  <p className="text-lg sm:text-2xl font-extrabold text-[#C9A227] mt-1 tabular-nums">
                    <AnimatedCounter
                      value={resultados.rentabilidadeAnualPatrimonio}
                      formatter={(v) => formatPercent(v, 2)}
                    />
                    <span className="text-xs font-normal text-[#5E6E64]"> a.a.</span>
                  </p>
                  <p className="text-[11px] text-[#5E6E64] mt-1">Retorno patrimonial anualizado</p>
                </CardContent>
              </Card>

              {/* Rentabilidade Mensal sobre Aporte */}
              <Card className="rounded-2xl border border-[#E3DFD6] bg-white shadow-sm overflow-hidden hover:-translate-y-0.5 transition-all">
                <div className="h-1 bg-[#C9A227] w-full" />
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#5E6E64]">
                    Rentab. Mensal s/ Aporte
                  </p>
                  <p className="text-lg sm:text-2xl font-extrabold text-[#1F2A24] mt-1 tabular-nums">
                    <AnimatedCounter
                      value={resultados.rentabilidadeSobreAporte}
                      formatter={(v) => formatPercent(v, 2)}
                    />
                    <span className="text-xs font-normal text-[#5E6E64]"> a.m.</span>
                  </p>
                  <p className="text-[11px] text-[#5E6E64] mt-1">
                    Sobre aporte em obras ({formatCurrency(resultados.aporteEmObras)})
                  </p>
                </CardContent>
              </Card>

              {/* Rentabilidade Anual sobre Aporte */}
              <Card className="rounded-2xl border border-[#E3DFD6] bg-white shadow-sm overflow-hidden hover:-translate-y-0.5 transition-all">
                <div className="h-1 bg-[#C9A227] w-full" />
                <CardContent className="p-4 sm:p-5">
                  <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#5E6E64]">
                    Rentab. Anual s/ Aporte
                  </p>
                  <p className="text-lg sm:text-2xl font-extrabold text-[#0F6B4F] mt-1 tabular-nums">
                    <AnimatedCounter
                      value={resultados.rentabilidadeAnualSobreAporte}
                      formatter={(v) => formatPercent(v, 2)}
                    />
                    <span className="text-xs font-normal text-[#5E6E64]"> a.a.</span>
                  </p>
                  <p className="text-[11px] text-[#5E6E64] mt-1">
                    Alavancagem do capital desembolsado
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Seção 3: Card Destaque Valor do Ativo na Entrega */}
          <div className="rounded-2xl border border-[#E3DFD6] bg-gradient-to-r from-[#0F6B4F]/10 via-[#C9A227]/10 to-[#F7F5F1] p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F6B4F]">
                  Média Valor do Ativo na Entrega
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#1F2A24] tabular-nums mt-0.5">
                  <AnimatedCounter
                    value={resultados.mediaValorAtivoEntrega}
                    formatter={formatCurrency}
                  />
                </p>
                <p className="text-xs text-[#5E6E64] mt-1">
                  Ganho de capital estimado de{' '}
                  <strong className="text-[#0F6B4F]">
                    {formatCurrency(
                      resultados.mediaValorAtivoEntrega - resultados.valorTotalImovel,
                    )}
                  </strong>{' '}
                  (+{valorizacaoObraPerc}%) durante os 36 meses de obras
                </p>
              </div>

              <div className="shrink-0">
                <div className="rounded-xl bg-white px-4 py-2.5 border border-[#E3DFD6] shadow-sm text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6E64] block">
                    Entrega Prevista
                  </span>
                  <span className="text-sm font-extrabold text-[#1F2A24]">
                    {mesesNomesAbrev[mesInicioObra]}/{anoInicioObra + 3}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 4: Tabela Plano de Pagamento */}
          <PlanoPagamentoTable
            plano={resultados.planoPagamento}
            valorTotalImovel={resultados.valorTotalImovel}
          />

          {/* Seção 5: Gráfico de Valorização no Período de Obra */}
          <Card className="rounded-2xl border border-[#E3DFD6] bg-white p-5 shadow-sm">
            <AppreciationChart
              valorInicial={resultados.valorTotalImovel}
              valorizacaoPercent={valorizacaoObraPerc}
              dataInicioObra={dataInicioObra}
            />
          </Card>

          {/* Seção 6: Memória de Cálculo Expansível */}
          <MemoriaCalculo
            valorDiaria={valorDiaria}
            valorTotalImovel={resultados.valorTotalImovel}
            faturamentoBruto={resultados.faturamentoBrutoMensal}
            custosOperacionais={resultados.custosOperacionais}
            lucroLiquido={resultados.lucroLiquidoMensal}
            dataInicioObra={dataInicioObra}
          />
        </div>
      </div>
    </div>
  )
}
