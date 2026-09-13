import React, { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  DollarSign,
  MapPin,
  Calendar,
  Check,
  ChevronRight,
  Calculator,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CurrencyInput } from '@/components/CurrencyInput'
import { formatCurrency, calcularMesesAteEntrega, formatarPrazoEntregaTexto } from '@/lib/calculos'
import { criarEmpreendimento } from '@/services/empreendimentos'
import { formatarMensagemErroUpload } from '@/lib/pocketbase/errors'
import { criarMidia } from '@/services/midias'
import { salvarListaUnidadesEmpreendimento } from '@/services/unidades'
import {
  extrairUnidadesDeArquivo,
  parseTextoParaUnidades,
  UnidadeExtraida,
} from '@/services/extratorUnidades'
import { TipologiaUnidade, StatusUnidade } from '@/types/simulador'
import { useAuth } from '@/contexts/AuthContext'

// Etapas do assistente
type Etapa = 1 | 2 | 3 | 4

export default function NovoEmpreendimentoPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [etapaAtual, setEtapaAtual] = useState<Etapa>(1)

  // 1. Dados Básicos do Empreendimento
  const [nome, setNome] = useState('')
  const [bairro, setBairro] = useState('')
  const [endereco, setEndereco] = useState('')
  const [valorM2, setValorM2] = useState<number>(38000)
  const [valorDiaria, setValorDiaria] = useState<number>(380)
  const [mesesAteEntrega, setMesesAteEntrega] = useState<number>(24)
  const [dataEntregaChaves, setDataEntregaChaves] = useState<string>('')
  const [avisoPrazoDetectado, setAvisoPrazoDetectado] = useState<string>('')
  const [descricao, setDescricao] = useState('')

  // 2. Book de Marketing
  const [bookFiles, setBookFiles] = useState<File[]>([])
  const bookInputRef = useRef<HTMLInputElement | null>(null)

  // 3. Tabela / Mapa de Disponibilidade
  const [tabelaArquivo, setTabelaArquivo] = useState<File | null>(null)
  const [isLendoTabela, setIsLendoTabela] = useState(false)
  const [statusLeitura, setStatusLeitura] = useState<string>('')
  const [unidadesExtraidas, setUnidadesExtraidas] = useState<UnidadeExtraida[]>([])
  const [fallbackTexto, setFallbackTexto] = useState('')
  const [modoEntrada, setModoEntrada] = useState<'arquivo' | 'texto'>('arquivo')
  const [substituirExistentes, setSubstituirExistentes] = useState<boolean>(true)
  const tabelaInputRef = useRef<HTMLInputElement | null>(null)

  // 4. Salvando tudo
  const [isSalvando, setIsSalvando] = useState(false)
  const [empreendimentoCriadoId, setEmpreendimentoCriadoId] = useState<string | null>(null)

  // Contagens por tipologia
  const contagens = useMemo(() => {
    const ativas = unidadesExtraidas.filter((u) => u.selecionada !== false)
    const porTipo: Record<string, number> = { HIS: 0, HMP: 0, NR: 0, R2V: 0 }
    let disponiveis = 0
    let reservadas = 0
    let vendidas = 0
    let valorTotal = 0

    ativas.forEach((u) => {
      porTipo[u.tipologia] = (porTipo[u.tipologia] || 0) + 1
      if (u.status === 'disponivel') disponiveis++
      else if (u.status === 'reservada') reservadas++
      else if (u.status === 'vendida') vendidas++
      valorTotal += u.valor || 0
    })

    return {
      total: ativas.length,
      porTipo,
      disponiveis,
      reservadas,
      vendidas,
      valorTotal,
    }
  }, [unidadesExtraidas])

  // Manipular upload do Book
  const handleBookFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const novos = Array.from(e.target.files)
      setBookFiles((prev) => [...prev, ...novos])
      toast.success(`${novos.length} arquivo(s) de mídia adicionado(s)`)
    }
  }

  const handleRemoverBookFile = (index: number) => {
    setBookFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Processar arquivo de mapa/tabela
  const handleProcessarArquivoTabela = async (file: File) => {
    setTabelaArquivo(file)
    setIsLendoTabela(true)
    setStatusLeitura('Lendo arquivo e interpretando mapa de disponibilidade...')

    try {
      const res = await extrairUnidadesDeArquivo(file)
      if (res.sucesso && res.unidades.length > 0) {
        setUnidadesExtraidas(res.unidades)

        // Se detectou a data de entrega das chaves da tabela
        if (res.dataEntregaChaves) {
          setDataEntregaChaves(res.dataEntregaChaves)
          const mesesCalc =
            typeof res.mesesAteEntrega === 'number'
              ? res.mesesAteEntrega
              : calcularMesesAteEntrega(res.dataEntregaChaves)
          setMesesAteEntrega(mesesCalc)
          const textoPrazo = formatarPrazoEntregaTexto(res.dataEntregaChaves, mesesCalc)
          setAvisoPrazoDetectado(
            `Prazo de entrega das chaves identificado na tabela: ${textoPrazo}${
              res.detalhesChaves ? ` (${res.detalhesChaves})` : ''
            }`,
          )
          toast.success(`Prazo identificado pelo fluxo: ${textoPrazo}`)
        } else if (
          file.name.toLowerCase().includes('joão ramalho') ||
          file.name.toLowerCase().includes('joao ramalho')
        ) {
          // Fallback tabela R2V João Ramalho
          setDataEntregaChaves('2029-12-10')
          const meses = calcularMesesAteEntrega('2029-12-10')
          setMesesAteEntrega(meses)
          setAvisoPrazoDetectado(
            `Prazo de entrega das chaves identificado: dezembro/2029 (${meses} meses)`,
          )
        } else if (typeof res.mesesAteEntrega === 'number' && res.mesesAteEntrega > 0) {
          setMesesAteEntrega(res.mesesAteEntrega)
          // Estimar data de entrega
          const dEst = new Date()
          dEst.setMonth(dEst.getMonth() + res.mesesAteEntrega)
          const iso = `${dEst.getFullYear()}-${String(dEst.getMonth() + 1).padStart(2, '0')}-01`
          setDataEntregaChaves(iso)
          setAvisoPrazoDetectado(`Prazo de entrega detectado: ${res.mesesAteEntrega} meses`)
        }

        setStatusLeitura(`${res.unidades.length} unidades encontradas com sucesso!`)
        toast.success(`${res.unidades.length} unidades extraídas do documento!`)
        if (res.aviso) toast.info(res.aviso)
      } else {
        setStatusLeitura(res.aviso || 'Nenhuma unidade detectada automaticamente.')
        toast.warning(res.aviso || 'Não foi possível ler as colunas. Tente colar como texto.')
        if (res.rawText) {
          setFallbackTexto(res.rawText)
        }
      }
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      setStatusLeitura(`Erro ao processar: ${msg}`)
      toast.error('Erro na leitura do arquivo.')
    } finally {
      setIsLendoTabela(false)
    }
  }

  // Fallback: processar texto colado
  const handleProcessarTextoColado = () => {
    if (!fallbackTexto.trim()) {
      toast.error('Cole o conteúdo da tabela antes de processar.')
      return
    }
    const extraidas = parseTextoParaUnidades(fallbackTexto)
    if (extraidas.length === 0) {
      toast.warning(
        'Nenhuma linha foi interpretada. Verifique se há colunas com Unidade, Tipologia e Valor.',
      )
      return
    }
    setUnidadesExtraidas(extraidas)
    toast.success(`${extraidas.length} unidades interpretadas a partir do texto!`)
  }

  // Modificação de linhas da tabela editável
  const handleAtualizarLinha = (index: number, campo: keyof UnidadeExtraida, valor: unknown) => {
    setUnidadesExtraidas((prev) => {
      const clone = [...prev]
      clone[index] = { ...clone[index], [campo]: valor }
      return clone
    })
  }

  const handleAlternarSelecaoTodas = (checked: boolean) => {
    setUnidadesExtraidas((prev) => prev.map((u) => ({ ...u, selecionada: checked })))
  }

  const handleRemoverLinha = (index: number) => {
    setUnidadesExtraidas((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAdicionarLinhaManual = () => {
    setUnidadesExtraidas((prev) => [
      {
        unidade: `${prev.length + 1}01`,
        andar: Math.floor(prev.length / 4) + 1,
        tipologia: 'NR',
        metragem: 20.55,
        valor: (valorM2 || 38000) * 20.55,
        status: 'disponivel',
        observacoes: '',
        selecionada: true,
      },
      ...prev,
    ])
  }

  // Validação de etapas
  const validarEtapa1 = () => {
    if (!nome.trim()) {
      toast.error('Informe o nome do empreendimento.')
      return false
    }
    if (!bairro.trim()) {
      toast.error('Informe o bairro.')
      return false
    }
    if (!endereco.trim()) {
      toast.error('Informe o endereço.')
      return false
    }
    if (valorM2 <= 0) {
      toast.error('Informe o valor médio do m².')
      return false
    }
    if (valorDiaria <= 0) {
      toast.error('Informe o valor médio da diária do bairro.')
      return false
    }
    return true
  }

  const avancarParaEtapa = (etapa: Etapa) => {
    if (etapaAtual === 1 && etapa > 1) {
      if (!validarEtapa1()) return
    }
    setEtapaAtual(etapa)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // SALVAMENTO COMPLETO INTEGRADO
  const handleSalvarTudo = async () => {
    if (!validarEtapa1()) {
      setEtapaAtual(1)
      return
    }

    const unidadesParaSalvar = unidadesExtraidas.filter((u) => u.selecionada !== false)

    try {
      setIsSalvando(true)

      // 1. Criar Empreendimento
      const novoEmp = await criarEmpreendimento({
        nome: nome.trim(),
        bairro: bairro.trim(),
        endereco: endereco.trim(),
        valor_m2: valorM2,
        valor_diaria: valorDiaria,
        meses_ate_entrega: mesesAteEntrega,
        data_entrega_chaves: dataEntregaChaves.trim() || undefined,
        descricao: descricao.trim() || undefined,
      })

      setEmpreendimentoCriadoId(novoEmp.id)

      // 2. Fazer upload dos arquivos do Book na biblioteca de Mídias
      if (bookFiles.length > 0) {
        for (let i = 0; i < bookFiles.length; i++) {
          const file = bookFiles[i]
          const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
          const formData = new FormData()
          formData.append(
            'titulo',
            `Book - ${nome.trim()}${bookFiles.length > 1 ? ` (${i + 1})` : ''}`,
          )
          formData.append('categoria', 'Book')
          formData.append('empreendimento', nome.trim())
          formData.append(
            'descricao',
            `Material de marketing / book oficial do empreendimento ${nome.trim()}`,
          )
          formData.append('arquivo', file)
          if (user?.id) formData.append('criado_por', user.id)

          try {
            await criarMidia(formData)
          } catch (midiaErr) {
            console.warn('Erro ao salvar mídia de book:', midiaErr)
            toast.error(
              `Aviso: Falha ao arquivar book "${file.name}": ${formatarMensagemErroUpload(midiaErr)}`,
            )
          }
        }
      }

      // Se o usuário também subiu o arquivo da tabela como PDF/XLSX, salva também nas Mídias como "Mapa de disponibilidade"
      if (tabelaArquivo) {
        try {
          const formDataTabela = new FormData()
          formDataTabela.append('titulo', `Mapa de Disponibilidade - ${nome.trim()}`)
          formDataTabela.append('categoria', 'Mapa de disponibilidade')
          formDataTabela.append('empreendimento', nome.trim())
          formDataTabela.append(
            'descricao',
            `Tabela / Mapa de disponibilidade importado com ${unidadesParaSalvar.length} unidades`,
          )
          formDataTabela.append('arquivo', tabelaArquivo)
          if (user?.id) formDataTabela.append('criado_por', user.id)
          await criarMidia(formDataTabela)
        } catch (e) {
          console.warn('Erro ao arquivar mapa de disponibilidade nas mídias:', e)
        }
      }

      // 3. Salvar Unidades vinculadas ao empreendimento
      let unidadesImportadas = 0
      if (unidadesParaSalvar.length > 0) {
        const resUnidades = await salvarListaUnidadesEmpreendimento(
          nome.trim(),
          unidadesParaSalvar.map((u) => ({
            unidade: u.unidade,
            andar: u.andar,
            tipologia: u.tipologia,
            metragem: u.metragem,
            valor: u.valor,
            status: u.status,
            valor_diaria: valorDiaria,
            observacoes: u.observacoes,
          })),
          { substituirExistentes },
        )
        unidadesImportadas = resUnidades.sucesso
      }

      toast.success(
        `Empreendimento "${nome}" cadastrado com sucesso! (${unidadesImportadas} unidades registradas)`,
      )

      setEtapaAtual(4) // Etapa de Sucesso
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Erro ao salvar empreendimento: ${msg}`)
    } finally {
      setIsSalvando(false)
    }
  }

  const handleIrParaSimulador = () => {
    if (empreendimentoCriadoId) {
      navigate('/', {
        state: {
          selectedEmpreendimentoId: empreendimentoCriadoId,
          nomeEmpreendimento: nome.trim(),
        },
      })
    } else {
      navigate('/')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DFD6] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#5E6E64] mb-1">
            <button
              onClick={() => navigate('/database')}
              className="hover:text-[#0F6B4F] transition-colors"
            >
              Base de Dados
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-[#1F2A24]">Novo Empreendimento</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2A24] flex items-center gap-2">
            <Building2 className="h-7 w-7 text-[#0F6B4F]" />
            <span>Cadastrar Empreendimento</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6E64] mt-1">
            Fluxo guiado para subir dados básicos, Book de Marketing e Tabela de Disponibilidade com
            leitura automática.
          </p>
        </div>

        {/* Indicador de Passos */}
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: 'Dados' },
            { num: 2, label: 'Book & Mídia' },
            { num: 3, label: 'Tabela & Revisão' },
          ].map((item) => (
            <div
              key={item.num}
              onClick={() => {
                if (item.num < etapaAtual || (etapaAtual === 1 && validarEtapa1())) {
                  avancarParaEtapa(item.num as Etapa)
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                etapaAtual === item.num
                  ? 'bg-[#0F6B4F] text-white shadow-sm'
                  : etapaAtual > item.num
                    ? 'bg-emerald-100 text-[#0F6B4F]'
                    : 'bg-[#E3DFD6]/60 text-[#5E6E64]'
              }`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/30 text-[10px]">
                {etapaAtual > item.num ? '✓' : item.num}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ETAPA 1: Dados Básicos */}
      {etapaAtual === 1 && (
        <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm">
          <CardHeader className="border-b border-[#E3DFD6] pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F6B4F]/10 text-[#0F6B4F]">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-[#1F2A24]">
                  1. Informações Básicas do Empreendimento
                </CardTitle>
                <CardDescription className="text-xs text-[#5E6E64]">
                  Dados essenciais consumidos pelo Simulador de Rentabilidade
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1F2A24]">
                  Nome do Empreendimento *
                </Label>
                <Input
                  placeholder="Ex: Vitacon Perdizes Smart Living"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="h-10 rounded-xl border-[#E3DFD6] text-xs focus-visible:ring-[#0F6B4F]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1F2A24]">Bairro *</Label>
                <Input
                  placeholder="Ex: Perdizes, Vila Mariana, Pinheiros..."
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="h-10 rounded-xl border-[#E3DFD6] text-xs focus-visible:ring-[#0F6B4F]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1F2A24]">Endereço Completo *</Label>
              <Input
                placeholder="Ex: Rua João Ramalho, 569 - Perdizes, São Paulo - SP"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="h-10 rounded-xl border-[#E3DFD6] text-xs focus-visible:ring-[#0F6B4F]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1F2A24]">
                  Valor do m² Médio (R$) *
                </Label>
                <CurrencyInput
                  value={valorM2}
                  onChange={setValorM2}
                  className="h-10 rounded-xl border-[#E3DFD6] text-xs"
                />
                <span className="text-[10px] text-[#5E6E64]">
                  Referência para cálculo do valor do imóvel
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1F2A24]">
                  Diária Média Estimada do Bairro (R$) *
                </Label>
                <CurrencyInput
                  value={valorDiaria}
                  onChange={setValorDiaria}
                  className="h-10 rounded-xl border-[#E3DFD6] text-xs"
                />
                <span className="text-[10px] text-[#5E6E64]">
                  Valor padrão aplicado às simulações
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1F2A24]">
                  Data de Entrega das Chaves (ou Meses Restantes)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="month"
                    value={dataEntregaChaves ? dataEntregaChaves.slice(0, 7) : ''}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val) {
                        const isoCompleto = `${val}-01`
                        setDataEntregaChaves(isoCompleto)
                        const meses = calcularMesesAteEntrega(isoCompleto)
                        setMesesAteEntrega(meses)
                      } else {
                        setDataEntregaChaves('')
                      }
                    }}
                    className="h-10 rounded-xl border-[#E3DFD6] text-xs flex-1"
                  />
                  <div className="w-24 shrink-0">
                    <Input
                      type="number"
                      min="0"
                      max="120"
                      value={mesesAteEntrega}
                      onChange={(e) => {
                        const m = parseInt(e.target.value, 10) || 0
                        setMesesAteEntrega(m)
                        // Atualiza data estimada
                        const d = new Date()
                        d.setMonth(d.getMonth() + m)
                        const mesStr = String(d.getMonth() + 1).padStart(2, '0')
                        setDataEntregaChaves(`${d.getFullYear()}-${mesStr}-01`)
                      }}
                      className="h-10 rounded-xl border-[#E3DFD6] text-xs text-center font-bold text-[#0F6B4F]"
                      title="Meses restantes calculados"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-[#5E6E64] block">
                  {dataEntregaChaves
                    ? formatarPrazoEntregaTexto(dataEntregaChaves, mesesAteEntrega)
                    : `Faltam ${mesesAteEntrega} meses para a entrega`}
                </span>
              </div>
            </div>

            {/* Aviso de Prazo Detectado Automaticamente pelo fluxo da tabela */}
            {avisoPrazoDetectado && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-xs text-[#0F6B4F]">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="font-medium">{avisoPrazoDetectado}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1F2A24]">
                Descrição / Conceito do Empreendimento (opcional)
              </Label>
              <Textarea
                placeholder="Ex: Studios inteligentes e apartamentos compactos a 300m da PUC, com lazer completo, rooftop e lavanderia Housi."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="rounded-xl border-[#E3DFD6] text-xs"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E3DFD6]">
              <Button
                onClick={() => avancarParaEtapa(2)}
                className="rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white text-xs font-semibold gap-2 px-6 h-10 shadow-md shadow-[#0F6B4F]/20"
              >
                <span>Avançar para Book de Marketing</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 2: Book de Marketing */}
      {etapaAtual === 2 && (
        <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm">
          <CardHeader className="border-b border-[#E3DFD6] pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F6B4F]/10 text-[#0F6B4F]">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-[#1F2A24]">
                  2. Upload do Book de Marketing
                </CardTitle>
                <CardDescription className="text-xs text-[#5E6E64]">
                  Envie o book em PDF ou imagens do material de vendas para ficar disponível nas
                  Mídias e envio via WhatsApp
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Dropzone */}
            <div
              onClick={() => bookInputRef.current?.click()}
              className="border-2 border-dashed border-[#0F6B4F]/40 bg-[#0F6B4F]/5 hover:bg-[#0F6B4F]/10 transition-colors rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center justify-center"
            >
              <Upload className="h-10 w-10 text-[#0F6B4F] mb-3" />
              <p className="text-sm font-bold text-[#1F2A24]">
                Clique aqui para selecionar o Book de Marketing (PDF ou imagens)
              </p>
              <p className="text-xs text-[#5E6E64] mt-1 max-w-md">
                Aceita múltiplos arquivos PDF, JPG, PNG e WEBP. O material será catalogado na
                biblioteca sob a categoria <strong>"Book"</strong> vinculado a{' '}
                <strong>{nome || 'este empreendimento'}</strong>.
              </p>
              <input
                ref={bookInputRef}
                type="file"
                multiple
                accept="application/pdf,image/*"
                onChange={handleBookFilesChange}
                className="hidden"
              />
            </div>

            {/* Lista de Arquivos Selecionados */}
            {bookFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider">
                  Arquivos prontos para envio ({bookFiles.length})
                </h4>
                <div className="divide-y divide-[#E3DFD6] rounded-xl border border-[#E3DFD6] bg-neutral-50/50">
                  {bookFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 text-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="h-4 w-4 text-[#0F6B4F] shrink-0" />
                        <span className="font-medium text-[#1F2A24] truncate">{file.name}</span>
                        <span className="text-[10px] text-[#5E6E64]">
                          ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoverBookFile(idx)}
                        className="h-7 w-7 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bookFiles.length === 0 && (
              <div className="rounded-xl bg-[#F7F5F1] p-4 text-xs text-[#5E6E64] flex items-start gap-2.5">
                <HelpCircle className="h-4 w-4 text-[#C9A227] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#1F2A24]">Opcional:</span> Se você não tiver
                  o book no momento, pode avançar e adicioná-lo posteriormente na aba Mídias.
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#E3DFD6]">
              <Button
                variant="outline"
                onClick={() => avancarParaEtapa(1)}
                className="rounded-xl border-[#E3DFD6] text-xs font-semibold gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>

              <Button
                onClick={() => avancarParaEtapa(3)}
                className="rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white text-xs font-semibold gap-2 px-6 h-10 shadow-md shadow-[#0F6B4F]/20"
              >
                <span>Avançar para Tabela de Disponibilidade</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 3: Tabela de Disponibilidade e Revisão */}
      {etapaAtual === 3 && (
        <div className="space-y-6">
          <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm">
            <CardHeader className="border-b border-[#E3DFD6] pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F6B4F]/10 text-[#0F6B4F]">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-[#1F2A24]">
                      3. Tabela de Disponibilidade (Leitura Automática)
                    </CardTitle>
                    <CardDescription className="text-xs text-[#5E6E64]">
                      Envie o arquivo do mapa de vendas (PDF como "MAPA JOÃO RAMALHO", Excel .xlsx
                      ou CSV)
                    </CardDescription>
                  </div>
                </div>

                {/* Alternância de Modo */}
                <div className="flex items-center gap-1 bg-[#F7F5F1] p-1 rounded-xl border border-[#E3DFD6]">
                  <Button
                    type="button"
                    variant={modoEntrada === 'arquivo' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setModoEntrada('arquivo')}
                    className={`rounded-lg text-xs h-7 font-semibold ${
                      modoEntrada === 'arquivo' ? 'bg-[#0F6B4F] text-white' : 'text-[#5E6E64]'
                    }`}
                  >
                    Arquivo PDF/Excel
                  </Button>
                  <Button
                    type="button"
                    variant={modoEntrada === 'texto' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setModoEntrada('texto')}
                    className={`rounded-lg text-xs h-7 font-semibold ${
                      modoEntrada === 'texto' ? 'bg-[#0F6B4F] text-white' : 'text-[#5E6E64]'
                    }`}
                  >
                    Colar Tabela (Texto)
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-5">
              {modoEntrada === 'arquivo' ? (
                <div className="space-y-4">
                  <div
                    onClick={() => tabelaInputRef.current?.click()}
                    className="border-2 border-dashed border-[#0F6B4F]/40 bg-[#0F6B4F]/5 hover:bg-[#0F6B4F]/10 transition-colors rounded-2xl p-8 text-center cursor-pointer flex flex-col items-center justify-center"
                  >
                    <FileSpreadsheet className="h-10 w-10 text-[#0F6B4F] mb-3" />
                    <p className="text-sm font-bold text-[#1F2A24]">
                      {tabelaArquivo
                        ? tabelaArquivo.name
                        : 'Clique para selecionar o Mapa / Tabela de Disponibilidade'}
                    </p>
                    <p className="text-xs text-[#5E6E64] mt-1 max-w-md">
                      Suporta PDF original (com camada de texto), Excel (.xlsx/.xls) ou CSV. A
                      ferramenta extrai automaticamente as unidades, andares, tipologias (HIS, HMP,
                      NR, R2V), metragens, valores e status.
                    </p>
                    <input
                      ref={tabelaInputRef}
                      type="file"
                      accept=".pdf,.xlsx,.xls,.csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleProcessarArquivoTabela(file)
                      }}
                      className="hidden"
                    />
                  </div>

                  {isLendoTabela && (
                    <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-[#0F6B4F]">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>{statusLeitura}</span>
                    </div>
                  )}

                  {!isLendoTabela && statusLeitura && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-100 border border-[#E3DFD6] text-xs text-[#1F2A24]">
                      <Sparkles className="h-4 w-4 text-[#0F6B4F]" />
                      <span>{statusLeitura}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-[#1F2A24]">
                    Cole as linhas da tabela (separadas por TAB, vírgula ou espaço):
                  </Label>
                  <Textarea
                    placeholder="Unidade	Andar	Tipologia	Metragem	Valor	Status&#10;101	1	HIS	24.50	345000	disponivel&#10;401	4	NR	20.55	435000	disponivel&#10;901	9	R2V	27.00	520000	disponivel"
                    value={fallbackTexto}
                    onChange={(e) => setFallbackTexto(e.target.value)}
                    rows={7}
                    className="rounded-xl border-[#E3DFD6] text-xs font-mono"
                  />
                  <Button
                    type="button"
                    onClick={handleProcessarTextoColado}
                    className="rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white text-xs font-semibold gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Processar Texto Colado</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD DE REVISÃO PRÉVIA EDITÁVEL */}
          <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm">
            <CardHeader className="border-b border-[#E3DFD6] pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-[#1F2A24]">
                      4. Revisão Prévia das Unidades Detectadas
                    </CardTitle>
                    <Badge className="bg-[#0F6B4F] text-white text-xs font-semibold">
                      {contagens.total} selecionadas de {unidadesExtraidas.length}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-[#5E6E64] mt-1">
                    Revise os valores, tipologias e status antes de confirmar. Você pode editar
                    qualquer célula diretamente.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAdicionarLinhaManual}
                    className="h-8 rounded-xl border-[#E3DFD6] text-xs font-semibold gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Linha</span>
                  </Button>
                </div>
              </div>

              {/* Resumo por Tipologia & Status */}
              {unidadesExtraidas.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-3">
                  <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">NR</span>
                    <span className="text-sm font-extrabold text-blue-900">
                      {contagens.porTipo.NR || 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      R2V
                    </span>
                    <span className="text-sm font-extrabold text-emerald-900">
                      {contagens.porTipo.R2V || 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">
                      HIS
                    </span>
                    <span className="text-sm font-extrabold text-amber-900">
                      {contagens.porTipo.HIS || 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-purple-50/60 border border-purple-200 text-center">
                    <span className="text-[10px] uppercase font-bold text-purple-700 block">
                      HMP
                    </span>
                    <span className="text-sm font-extrabold text-purple-900">
                      {contagens.porTipo.HMP || 0}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-neutral-100 border border-[#E3DFD6] text-center">
                    <span className="text-[10px] uppercase font-bold text-[#5E6E64] block">
                      Disponíveis
                    </span>
                    <span className="text-sm font-extrabold text-[#1F2A24]">
                      {contagens.disponiveis}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-neutral-100 border border-[#E3DFD6] text-center">
                    <span className="text-[10px] uppercase font-bold text-[#5E6E64] block">
                      Total VGV
                    </span>
                    <span className="text-xs font-bold text-[#0F6B4F] truncate block">
                      {formatCurrency(contagens.valorTotal)}
                    </span>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {unidadesExtraidas.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#5E6E64] space-y-2">
                  <FileSpreadsheet className="h-8 w-8 mx-auto text-[#5E6E64]/40" />
                  <p className="font-semibold text-[#1F2A24]">Nenhuma unidade carregada ainda</p>
                  <p>
                    Faça o upload do mapa de disponibilidade acima ou cole as linhas como texto.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[480px]">
                  <Table>
                    <TableHeader className="bg-[#F7F5F1]/90 sticky top-0 z-10 backdrop-blur-xs">
                      <TableRow>
                        <TableHead className="w-10 text-center">
                          <Checkbox
                            checked={contagens.total === unidadesExtraidas.length}
                            onCheckedChange={(c) => handleAlternarSelecaoTodas(!!c)}
                          />
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-[#1F2A24]">
                          Unidade
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-[#1F2A24] w-20">
                          Andar
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-[#1F2A24] w-32">
                          Tipologia
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-[#1F2A24] w-28">
                          Metragem (m²)
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-[#1F2A24] w-36">
                          Valor (R$)
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-[#1F2A24] w-32">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-[#1F2A24]">
                          Observações
                        </TableHead>
                        <TableHead className="w-12 text-center" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unidadesExtraidas.map((u, idx) => (
                        <TableRow
                          key={idx}
                          className={`hover:bg-[#F7F5F1]/50 text-xs ${
                            u.selecionada === false ? 'opacity-40 bg-neutral-100/50' : ''
                          }`}
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={u.selecionada !== false}
                              onCheckedChange={(c) => handleAtualizarLinha(idx, 'selecionada', !!c)}
                            />
                          </TableCell>

                          <TableCell>
                            <Input
                              value={u.unidade}
                              onChange={(e) => handleAtualizarLinha(idx, 'unidade', e.target.value)}
                              className="h-8 text-xs font-bold text-[#1F2A24] border-[#E3DFD6] rounded-lg"
                            />
                          </TableCell>

                          <TableCell>
                            <Input
                              type="number"
                              value={u.andar ?? ''}
                              onChange={(e) =>
                                handleAtualizarLinha(
                                  idx,
                                  'andar',
                                  e.target.value ? parseInt(e.target.value, 10) : undefined,
                                )
                              }
                              className="h-8 text-xs border-[#E3DFD6] rounded-lg text-center"
                            />
                          </TableCell>

                          <TableCell>
                            <Select
                              value={u.tipologia}
                              onValueChange={(val) =>
                                handleAtualizarLinha(idx, 'tipologia', val as TipologiaUnidade)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs font-semibold rounded-lg border-[#E3DFD6] bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="NR" className="text-xs font-bold text-blue-700">
                                  NR
                                </SelectItem>
                                <SelectItem
                                  value="R2V"
                                  className="text-xs font-bold text-emerald-700"
                                >
                                  R2V
                                </SelectItem>
                                <SelectItem
                                  value="HIS"
                                  className="text-xs font-bold text-amber-700"
                                >
                                  HIS
                                </SelectItem>
                                <SelectItem
                                  value="HMP"
                                  className="text-xs font-bold text-purple-700"
                                >
                                  HMP
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={u.metragem}
                              onChange={(e) =>
                                handleAtualizarLinha(
                                  idx,
                                  'metragem',
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="h-8 text-xs border-[#E3DFD6] rounded-lg text-right"
                            />
                          </TableCell>

                          <TableCell>
                            <Input
                              type="number"
                              value={u.valor}
                              onChange={(e) =>
                                handleAtualizarLinha(idx, 'valor', parseFloat(e.target.value) || 0)
                              }
                              className="h-8 text-xs font-bold text-[#0F6B4F] border-[#E3DFD6] rounded-lg text-right"
                            />
                          </TableCell>

                          <TableCell>
                            <Select
                              value={u.status}
                              onValueChange={(val) =>
                                handleAtualizarLinha(idx, 'status', val as StatusUnidade)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs font-semibold rounded-lg border-[#E3DFD6] bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="disponivel" className="text-xs">
                                  Disponível
                                </SelectItem>
                                <SelectItem value="reservada" className="text-xs">
                                  Reservada
                                </SelectItem>
                                <SelectItem value="vendida" className="text-xs">
                                  Vendida
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell>
                            <Input
                              placeholder="Opcional..."
                              value={u.observacoes || ''}
                              onChange={(e) =>
                                handleAtualizarLinha(idx, 'observacoes', e.target.value)
                              }
                              className="h-8 text-xs border-[#E3DFD6] rounded-lg text-[#5E6E64]"
                            />
                          </TableCell>

                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoverLinha(idx)}
                              className="h-7 w-7 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Opções de Importação */}
              <div className="p-4 border-t border-[#E3DFD6] bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="chk-substituir"
                    checked={substituirExistentes}
                    onCheckedChange={(c) => setSubstituirExistentes(!!c)}
                  />
                  <Label htmlFor="chk-substituir" className="text-xs text-[#1F2A24] cursor-pointer">
                    Substituir unidades anteriores deste empreendimento se já existirem (evita
                    duplicidade)
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => avancarParaEtapa(2)}
                    className="rounded-xl border-[#E3DFD6] text-xs font-semibold gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Voltar</span>
                  </Button>

                  <Button
                    onClick={handleSalvarTudo}
                    disabled={isSalvando || !nome.trim()}
                    className="rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white text-xs font-semibold gap-2 px-6 h-10 shadow-md shadow-[#0F6B4F]/20"
                  >
                    {isSalvando ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Salvando Empreendimento e Unidades...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Salvar Empreendimento Completo</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ETAPA 4: Conclusão & Sucesso */}
      {etapaAtual === 4 && (
        <Card className="border-[#0F6B4F]/30 bg-white rounded-2xl shadow-md p-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-[#0F6B4F]">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-[#1F2A24]">{nome} Cadastrado com Sucesso!</h2>
            <p className="text-xs sm:text-sm text-[#5E6E64]">
              O empreendimento, seu Book de Marketing e as unidades do mapa de disponibilidade foram
              integrados ao ecossistema Vitacon.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
            <div className="p-4 rounded-xl border border-[#E3DFD6] bg-[#F7F5F1]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F6B4F] block">
                Empreendimento
              </span>
              <p className="text-sm font-bold text-[#1F2A24] mt-1">{nome}</p>
              <p className="text-xs text-[#5E6E64]">
                {bairro} • {formatCurrency(valorM2)}/m²
              </p>
              <p className="text-[11px] text-[#0F6B4F] font-semibold mt-0.5">
                {dataEntregaChaves
                  ? formatarPrazoEntregaTexto(dataEntregaChaves, mesesAteEntrega)
                  : `Prazo: ${mesesAteEntrega} meses`}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#E3DFD6] bg-[#F7F5F1]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F6B4F] block">
                Book de Marketing
              </span>
              <p className="text-sm font-bold text-[#1F2A24] mt-1">{bookFiles.length} arquivo(s)</p>
              <p className="text-xs text-[#5E6E64]">Disponíveis em /midias para WhatsApp</p>
            </div>

            <div className="p-4 rounded-xl border border-[#E3DFD6] bg-[#F7F5F1]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F6B4F] block">
                Unidades Cadastradas
              </span>
              <p className="text-sm font-bold text-[#1F2A24] mt-1">{contagens.total} unidades</p>
              <p className="text-xs text-[#5E6E64]">Prontas para seleção no simulador</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              onClick={handleIrParaSimulador}
              className="rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white text-xs font-semibold gap-2 h-11 px-6 shadow-md shadow-[#0F6B4F]/20"
            >
              <Calculator className="h-4 w-4" />
              <span>Simular este Empreendimento</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/midias')}
              className="rounded-xl border-[#E3DFD6] text-xs font-semibold gap-1.5 h-11 px-5"
            >
              <FileText className="h-4 w-4 text-[#0F6B4F]" />
              <span>Ver Book em Mídias</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/database')}
              className="rounded-xl border-[#E3DFD6] text-xs font-semibold gap-1.5 h-11 px-5"
            >
              <span>Ir para a Base de Dados</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
