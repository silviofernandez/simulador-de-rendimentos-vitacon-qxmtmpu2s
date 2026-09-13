import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EmpreendimentoRecord,
  UnidadeRecord,
  TipologiaUnidade,
  StatusUnidade,
} from '@/types/simulador'
import { formatCurrency, formatCurrencyDetailed } from '@/lib/calculos'
import {
  listarUnidades,
  criarUnidade,
  atualizarUnidade,
  excluirUnidade,
  importarUnidadesEmLote,
} from '@/services/unidades'
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Building2,
  MapPin,
  Calculator,
  DollarSign,
  Layers,
  Home,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

interface DatabaseProps {
  empreendimentos: EmpreendimentoRecord[]
  isLoading: boolean
}

export default function DatabasePage({ empreendimentos, isLoading }: DatabaseProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  // Estados de Unidades
  const [unidades, setUnidades] = useState<UnidadeRecord[]>([])
  const [loadingUnidades, setLoadingUnidades] = useState(true)
  const [unidadeFiltroEmp, setUnidadeFiltroEmp] = useState<string>('Vitacon João Ramalho')
  const [searchUnidades, setSearchUnidades] = useState('')

  // Modal nova unidade
  const [novaUnidadeModal, setNovaUnidadeModal] = useState(false)
  const [formEmp, setFormEmp] = useState('Vitacon João Ramalho')
  const [formNumero, setFormNumero] = useState('')
  const [formAndar, setFormAndar] = useState<number | undefined>(undefined)
  const [formTipologia, setFormTipologia] = useState<TipologiaUnidade>('NR')
  const [formMetragem, setFormMetragem] = useState<number>(20.55)
  const [formValor, setFormValor] = useState<number>(435000)
  const [formStatus, setFormStatus] = useState<StatusUnidade>('disponivel')
  const [formValorDiaria, setFormValorDiaria] = useState<number>(380)
  const [formObs, setFormObs] = useState('')
  const [salvandoUnidade, setSalvandoUnidade] = useState(false)

  // Modal importação em lote
  const [importModal, setImportModal] = useState(false)
  const [importEmp, setImportEmp] = useState('Vitacon João Ramalho')
  const [importTexto, setImportTexto] = useState('')
  const [importando, setImportando] = useState(false)

  const carregarUnidades = async () => {
    try {
      setLoadingUnidades(true)
      const data = await listarUnidades()
      setUnidades(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar unidades.')
    } finally {
      setLoadingUnidades(false)
    }
  }

  useEffect(() => {
    carregarUnidades()
  }, [])

  const handleSalvarNovaUnidade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNumero.trim()) {
      toast.error('Informe o número da unidade.')
      return
    }

    try {
      setSalvandoUnidade(true)
      await criarUnidade({
        empreendimento: formEmp,
        unidade: formNumero.trim(),
        andar: formAndar,
        tipologia: formTipologia,
        metragem: formMetragem,
        valor: formValor,
        status: formStatus,
        valor_diaria: formValorDiaria,
        observacoes: formObs.trim(),
      })
      toast.success(`Unidade ${formNumero} cadastrada!`)
      setNovaUnidadeModal(false)
      setFormNumero('')
      carregarUnidades()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar unidade.')
    } finally {
      setSalvandoUnidade(false)
    }
  }

  const handleImportarLote = async () => {
    if (!importTexto.trim()) {
      toast.error('Cole o texto com as linhas da tabela.')
      return
    }
    try {
      setImportando(true)
      const res = await importarUnidadesEmLote(importEmp, importTexto)
      if (res.sucesso > 0) {
        toast.success(`${res.sucesso} unidades importadas/atualizadas com sucesso!`)
      }
      if (res.falhas > 0) {
        toast.warning(`${res.falhas} linhas não puderam ser importadas.`)
      }
      setImportModal(false)
      setImportTexto('')
      carregarUnidades()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao processar importação em lote.')
    } finally {
      setImportando(false)
    }
  }

  const handleExcluirUnidade = async (id: string, num: string) => {
    if (!confirm(`Deseja excluir a unidade ${num}?`)) return
    try {
      await excluirUnidade(id)
      setUnidades((prev) => prev.filter((u) => u.id !== id))
      toast.success(`Unidade ${num} removida.`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir unidade.')
    }
  }

  const handleSimularUnidade = (u: UnidadeRecord) => {
    navigate('/', {
      state: {
        unidadeSelecionada: u,
        nomeEmpreendimento: u.empreendimento,
      },
    })
  }

  // Filtragem de empreendimentos
  const empreendimentosFiltrados = useMemo(() => {
    if (!search.trim()) return empreendimentos
    const q = search.toLowerCase()
    return empreendimentos.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        e.bairro.toLowerCase().includes(q) ||
        e.endereco.toLowerCase().includes(q),
    )
  }, [empreendimentos, search])

  // Agrupamento de diárias por bairro
  const bairrosAgrupados = useMemo(() => {
    const map = new Map<string, { valor_diaria: number; count: number; valor_m2_medio: number }>()

    empreendimentos.forEach((e) => {
      if (!map.has(e.bairro)) {
        map.set(e.bairro, { valor_diaria: e.valor_diaria, count: 1, valor_m2_medio: e.valor_m2 })
      } else {
        const item = map.get(e.bairro)!
        item.count += 1
        item.valor_m2_medio = (item.valor_m2_medio + e.valor_m2) / 2
      }
    })

    return Array.from(map.entries())
      .map(([bairro, info]) => ({
        bairro,
        valor_diaria: info.valor_diaria,
        total_empreendimentos: info.count,
        valor_m2_medio: Math.round(info.valor_m2_medio),
      }))
      .sort((a, b) => a.bairro.localeCompare(b.bairro))
  }, [empreendimentos])

  const handleCarregarNoSimulador = (emp: EmpreendimentoRecord) => {
    // Redireciona para o simulador com o empreendimento selecionado
    navigate('/', { state: { selectedEmpreendimentoId: emp.id } })
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1F2A24]">Base de Dados Vitacon</h1>
        <p className="text-sm text-[#5E6E64]">
          Portfólio de empreendimentos e dados de referência de diárias por bairro carregados em
          tempo real do PocketBase.
        </p>
      </div>

      <Tabs defaultValue="empreendimentos" className="w-full">
        <TabsList className="bg-white border border-[#E3DFD6] p-1 rounded-xl">
          <TabsTrigger
            value="unidades"
            className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#0F6B4F] data-[state=active]:text-white transition-all gap-2"
          >
            <Home className="h-4 w-4" />
            Unidades Vitacon ({unidades.length})
          </TabsTrigger>
          <TabsTrigger
            value="empreendimentos"
            className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#0F6B4F] data-[state=active]:text-white transition-all gap-2"
          >
            <Building2 className="h-4 w-4" />
            Empreendimentos ({empreendimentos.length})
          </TabsTrigger>
          <TabsTrigger
            value="diarias"
            className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#0F6B4F] data-[state=active]:text-white transition-all gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Diárias por Bairro ({bairrosAgrupados.length})
          </TabsTrigger>
          <TabsTrigger
            value="sobre"
            className="rounded-lg text-xs font-semibold data-[state=active]:bg-[#0F6B4F] data-[state=active]:text-white transition-all gap-2"
          >
            <Layers className="h-4 w-4" />
            Sobre a Vitacon
          </TabsTrigger>
        </TabsList>

        {/* Tab: Unidades (Nova Gestão por Unidade, Andar e Tipologia) */}
        <TabsContent value="unidades" className="mt-4 space-y-4">
          <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-[#E3DFD6]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-[#1F2A24] flex items-center gap-2">
                    <Home className="h-5 w-5 text-[#0F6B4F]" />
                    <span>Disponibilidade e Mapa de Unidades</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5E6E64]">
                    Controle por unidade, andar e tipologia (R2V, NR, HIS, HMP) com simulação direta
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Seletor Empreendimento */}
                  <Select value={unidadeFiltroEmp} onValueChange={setUnidadeFiltroEmp}>
                    <SelectTrigger className="h-9 w-52 rounded-xl border-[#E3DFD6] text-xs bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="Todos" className="text-xs">
                        Todos os Empreendimentos
                      </SelectItem>
                      <SelectItem value="Vitacon João Ramalho" className="text-xs font-semibold">
                        Vitacon João Ramalho
                      </SelectItem>
                      {empreendimentos
                        .filter((e) => e.nome !== 'Vitacon João Ramalho')
                        .map((e) => (
                          <SelectItem key={e.id} value={e.nome} className="text-xs">
                            {e.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {/* Busca */}
                  <div className="relative w-40 sm:w-48">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#5E6E64]" />
                    <Input
                      placeholder="Buscar unidade..."
                      value={searchUnidades}
                      onChange={(e) => setSearchUnidades(e.target.value)}
                      className="pl-8 h-9 rounded-xl border-[#E3DFD6] text-xs focus-visible:ring-[#0F6B4F]"
                    />
                  </div>

                  {/* Botão Importar em Lote */}
                  {user && (
                    <Dialog open={importModal} onOpenChange={setImportModal}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-xl border-[#E3DFD6] text-xs font-semibold gap-1 text-[#5E6E64] hover:text-[#1F2A24]"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span>Importar Lote</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl border-[#E3DFD6] bg-white sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="text-[#1F2A24]">
                            Importar Unidades em Lote
                          </DialogTitle>
                          <DialogDescription className="text-xs text-[#5E6E64]">
                            Cole as linhas do mapa de disponibilidade (copiado do Excel ou PDF)
                            separadas por TAB, vírgula ou ponto-e-vírgula.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-[#1F2A24]">
                              Empreendimento
                            </Label>
                            <Input
                              value={importEmp}
                              onChange={(e) => setImportEmp(e.target.value)}
                              className="h-9 rounded-xl border-[#E3DFD6] text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-[#1F2A24]">
                              Formato esperado por linha:
                            </Label>
                            <div className="rounded-lg bg-[#F7F5F1] p-2 text-[11px] font-mono text-[#5E6E64]">
                              Unidade [TAB] Andar [TAB] Tipologia [TAB] Metragem [TAB] Valor [TAB]
                              Status
                              <br />
                              Exemplo: 401 4 NR 20.55 435000 disponivel
                            </div>
                            <Textarea
                              placeholder="Cole aqui as linhas copiadas..."
                              value={importTexto}
                              onChange={(e) => setImportTexto(e.target.value)}
                              rows={8}
                              className="rounded-xl border-[#E3DFD6] text-xs font-mono"
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setImportModal(false)}
                            className="rounded-xl border-[#E3DFD6] text-xs"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={handleImportarLote}
                            disabled={importando}
                            className="rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white text-xs font-semibold"
                          >
                            {importando ? 'Importando...' : 'Processar e Salvar'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Botão Nova Unidade */}
                  {user && (
                    <Dialog open={novaUnidadeModal} onOpenChange={setNovaUnidadeModal}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="h-9 rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white text-xs font-semibold gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Nova Unidade</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl border-[#E3DFD6] bg-white sm:max-w-md">
                        <form onSubmit={handleSalvarNovaUnidade}>
                          <DialogHeader>
                            <DialogTitle className="text-[#1F2A24]">Cadastrar Unidade</DialogTitle>
                            <DialogDescription className="text-xs text-[#5E6E64]">
                              Adicione uma unidade ao mapa de disponibilidade
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-3 py-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold text-[#1F2A24]">
                                  Empreendimento
                                </Label>
                                <Input
                                  value={formEmp}
                                  onChange={(e) => setFormEmp(e.target.value)}
                                  className="h-9 rounded-xl border-[#E3DFD6] text-xs"
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold text-[#1F2A24]">
                                  Unidade / Número *
                                </Label>
                                <Input
                                  placeholder="Ex: 401"
                                  value={formNumero}
                                  onChange={(e) => setFormNumero(e.target.value)}
                                  className="h-9 rounded-xl border-[#E3DFD6] text-xs"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold text-[#1F2A24]">
                                  Andar
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="Ex: 4"
                                  value={formAndar ?? ''}
                                  onChange={(e) =>
                                    setFormAndar(
                                      e.target.value ? parseInt(e.target.value, 10) : undefined,
                                    )
                                  }
                                  className="h-9 rounded-xl border-[#E3DFD6] text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold text-[#1F2A24]">
                                  Tipologia *
                                </Label>
                                <Select
                                  value={formTipologia}
                                  onValueChange={(v) => setFormTipologia(v as TipologiaUnidade)}
                                >
                                  <SelectTrigger className="h-9 rounded-xl border-[#E3DFD6] text-xs bg-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    <SelectItem
                                      value="NR"
                                      className="text-xs font-bold text-blue-700"
                                    >
                                      NR (Não Residencial)
                                    </SelectItem>
                                    <SelectItem
                                      value="R2V"
                                      className="text-xs font-bold text-emerald-700"
                                    >
                                      R2V (Residencial)
                                    </SelectItem>
                                    <SelectItem
                                      value="HIS"
                                      className="text-xs font-bold text-amber-700"
                                    >
                                      HIS (Interesse Social)
                                    </SelectItem>
                                    <SelectItem
                                      value="HMP"
                                      className="text-xs font-bold text-purple-700"
                                    >
                                      HMP (Médio Porte)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold text-[#1F2A24]">
                                  Status
                                </Label>
                                <Select
                                  value={formStatus}
                                  onValueChange={(v) => setFormStatus(v as StatusUnidade)}
                                >
                                  <SelectTrigger className="h-9 rounded-xl border-[#E3DFD6] text-xs bg-white">
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
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold text-[#1F2A24]">
                                  Metragem (m²) *
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={formMetragem}
                                  onChange={(e) => setFormMetragem(parseFloat(e.target.value) || 0)}
                                  className="h-9 rounded-xl border-[#E3DFD6] text-xs"
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-semibold text-[#1F2A24]">
                                  Valor Imóvel (R$) *
                                </Label>
                                <Input
                                  type="number"
                                  value={formValor}
                                  onChange={(e) => setFormValor(parseFloat(e.target.value) || 0)}
                                  className="h-9 rounded-xl border-[#E3DFD6] text-xs"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs font-semibold text-[#1F2A24]">
                                Observações
                              </Label>
                              <Input
                                placeholder="Ex: Vista João Ramalho, sacada ampla"
                                value={formObs}
                                onChange={(e) => setFormObs(e.target.value)}
                                className="h-9 rounded-xl border-[#E3DFD6] text-xs"
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setNovaUnidadeModal(false)}
                              className="rounded-xl border-[#E3DFD6] text-xs"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="submit"
                              disabled={salvandoUnidade}
                              className="rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white text-xs font-semibold"
                            >
                              {salvandoUnidade ? 'Salvando...' : 'Salvar Unidade'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-[#F7F5F1]/80">
                    <TableRow>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Unidade / Andar
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Empreendimento
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Tipologia
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Metragem
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Valor Total
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Status
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingUnidades ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-xs text-[#5E6E64]">
                          Carregando unidades...
                        </TableCell>
                      </TableRow>
                    ) : unidades.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-xs text-[#5E6E64]">
                          Nenhuma unidade cadastrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      unidades
                        .filter((u) => {
                          if (
                            unidadeFiltroEmp !== 'Todos' &&
                            u.empreendimento !== unidadeFiltroEmp
                          ) {
                            return false
                          }
                          if (searchUnidades.trim()) {
                            const q = searchUnidades.toLowerCase()
                            return (
                              u.unidade.toLowerCase().includes(q) ||
                              u.tipologia.toLowerCase().includes(q) ||
                              u.empreendimento.toLowerCase().includes(q)
                            )
                          }
                          return true
                        })
                        .map((u) => {
                          const indisponivel = u.status === 'vendida'
                          return (
                            <TableRow
                              key={u.id}
                              className={`hover:bg-[#F7F5F1]/60 transition-colors text-xs ${
                                indisponivel ? 'opacity-60 bg-neutral-50/50' : ''
                              }`}
                            >
                              <TableCell className="font-bold text-[#1F2A24]">
                                <div className="flex items-center gap-1.5">
                                  <span>Unidade {u.unidade}</span>
                                  {u.andar && (
                                    <span className="text-[10px] text-[#5E6E64] font-normal">
                                      ({u.andar}º andar)
                                    </span>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell className="text-[#5E6E64]">{u.empreendimento}</TableCell>

                              <TableCell className="text-center">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold ${
                                    u.tipologia === 'R2V'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : u.tipologia === 'NR'
                                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                                        : u.tipologia === 'HIS'
                                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                                          : 'bg-purple-50 text-purple-700 border-purple-300'
                                  }`}
                                >
                                  {u.tipologia}
                                </Badge>
                              </TableCell>

                              <TableCell className="text-right font-medium text-[#1F2A24] tabular-nums">
                                {u.metragem} m²
                              </TableCell>

                              <TableCell className="text-right font-bold text-[#0F6B4F] tabular-nums">
                                {formatCurrency(u.valor)}
                              </TableCell>

                              <TableCell className="text-center">
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] font-semibold ${
                                    u.status === 'disponivel'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : u.status === 'reservada'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {u.status === 'disponivel'
                                    ? 'Disponível'
                                    : u.status === 'reservada'
                                      ? 'Reservada'
                                      : 'Vendida'}
                                </Badge>
                              </TableCell>

                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSimularUnidade(u)}
                                    disabled={indisponivel}
                                    className="h-7 text-xs font-semibold text-[#0F6B4F] hover:bg-[#0F6B4F]/10 gap-1 disabled:opacity-40"
                                    title={
                                      indisponivel
                                        ? 'Unidade vendida'
                                        : 'Carregar no Simulador de Rentabilidade'
                                    }
                                  >
                                    <Calculator className="h-3.5 w-3.5" />
                                    <span>Simular</span>
                                  </Button>

                                  {user && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleExcluirUnidade(u.id, u.unidade)}
                                      className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-700"
                                      title="Excluir unidade"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 1: Empreendimentos */}
        <TabsContent value="empreendimentos" className="mt-4 space-y-4">
          <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-[#E3DFD6]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-[#1F2A24]">
                    Carteira de Studios e Empreendimentos
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5E6E64]">
                    Clique em qualquer empreendimento para carregar seus parâmetros no Simulador
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5E6E64]" />
                  <Input
                    placeholder="Buscar por nome, bairro ou endereço..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 rounded-xl border-[#E3DFD6] text-xs focus-visible:ring-[#0F6B4F]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-[#F7F5F1]/80">
                    <TableRow>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Empreendimento
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Endereço
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Bairro
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Diária Est.
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Valor m²
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Ação
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-sm text-[#5E6E64]">
                          Carregando base de dados...
                        </TableCell>
                      </TableRow>
                    ) : empreendimentosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-sm text-[#5E6E64]">
                          Nenhum empreendimento encontrado para o filtro digitado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      empreendimentosFiltrados.map((emp) => (
                        <TableRow
                          key={emp.id}
                          className="hover:bg-[#F7F5F1]/60 transition-colors cursor-pointer group"
                          onClick={() => handleCarregarNoSimulador(emp)}
                        >
                          <TableCell className="font-semibold text-xs text-[#1F2A24]">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-[#0F6B4F] shrink-0" />
                              <span>{emp.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-[#5E6E64] max-w-[240px] truncate">
                            {emp.endereco}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-[#0F6B4F]/20 text-[#0F6B4F] bg-[#0F6B4F]/5 text-[11px]"
                            >
                              {emp.bairro}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-xs text-[#0F6B4F] tabular-nums">
                            {formatCurrencyDetailed(emp.valor_diaria)}
                          </TableCell>
                          <TableCell className="text-right text-xs text-[#5E6E64] tabular-nums">
                            {formatCurrency(emp.valor_m2)}/m²
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCarregarNoSimulador(emp)
                              }}
                              className="h-7 text-xs text-[#0F6B4F] hover:bg-[#0F6B4F]/10 hover:text-[#0B5740] font-semibold gap-1"
                            >
                              <Calculator className="h-3.5 w-3.5" />
                              Simular
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Diárias por Bairro */}
        <TabsContent value="diarias" className="mt-4 space-y-4">
          <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-[#E3DFD6]">
              <CardTitle className="text-base font-bold text-[#1F2A24]">
                Tabela de Diárias Médias por Bairro
              </CardTitle>
              <CardDescription className="text-xs text-[#5E6E64]">
                Valores de referência de diárias para locação por temporada (short stay) utilizados
                nas estimativas de receita
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-[#F7F5F1]/80">
                    <TableRow>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Bairro
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Empreendimentos Ativos
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Valor da Diária (R$)
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Valor Estimado m²
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Faturamento 75% (30d)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bairrosAgrupados.map((b) => {
                      const fatExemplo = b.valor_diaria * 30 * 0.75
                      return (
                        <TableRow key={b.bairro} className="hover:bg-[#F7F5F1]/60">
                          <TableCell className="font-semibold text-xs text-[#1F2A24]">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-[#C9A227]" />
                              <span>{b.bairro}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs text-[#5E6E64]">
                            <Badge variant="secondary" className="bg-neutral-100 text-[#1F2A24]">
                              {b.total_empreendimentos}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs text-[#0F6B4F] tabular-nums">
                            {formatCurrencyDetailed(b.valor_diaria)}
                          </TableCell>
                          <TableCell className="text-right text-xs text-[#5E6E64] tabular-nums">
                            {formatCurrency(b.valor_m2_medio)}/m²
                          </TableCell>
                          <TableCell className="text-right font-semibold text-xs text-[#C9A227] tabular-nums">
                            {formatCurrency(fatExemplo)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Sobre a Vitacon */}
        <TabsContent value="sobre" className="mt-4 space-y-4">
          <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1F2A24]">
                Sobre a Metodologia Vitacon Rentabilidade
              </CardTitle>
              <CardDescription className="text-xs text-[#5E6E64]">
                Pioneira em studios inteligentes e soluções de moradia compacta em São Paulo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[#1F2A24]">
              <p className="leading-relaxed">
                A <strong>Vitacon</strong> revolucionou o mercado imobiliário em São Paulo com o
                conceito de studios inteligentes e moradia sob demanda (short stay / long stay).
                Seus empreendimentos estão situados nos bairros mais valorizados da capital paulista
                — como Itaim Bibi, Jardins, Pinheiros, Vila Olímpia e Moema —, com alta densidade de
                serviços, polos corporativos e infraestrutura de transporte.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-[#E3DFD6] bg-[#F7F5F1]">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-[#0F6B4F] mb-1">
                    Alta Demanda
                  </h4>
                  <p className="text-xs text-[#5E6E64]">
                    Taxa média de ocupação sustentada entre 70% e 85% impulsionada por plataformas
                    digitais e público corporativo.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#E3DFD6] bg-[#F7F5F1]">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-[#C9A227] mb-1">
                    Rendimento Superior
                  </h4>
                  <p className="text-xs text-[#5E6E64]">
                    Rentabilidade sobre patrimônio significativamente superior à locação tradicional
                    residencial de longo prazo.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#E3DFD6] bg-[#F7F5F1]">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-[#0F6B4F] mb-1">
                    Aporte Suave em Obras
                  </h4>
                  <p className="text-xs text-[#5E6E64]">
                    Fluxo de pagamento facilitado durante o período construtivo, totalizando apenas
                    30% até a entrega das chaves.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
