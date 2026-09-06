import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmpreendimentoRecord } from '@/types/simulador'
import { formatCurrency, formatCurrencyDetailed, formatPercent } from '@/lib/calculos'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Building2, MapPin, Calculator, DollarSign, Layers } from 'lucide-react'

interface DatabaseProps {
  empreendimentos: EmpreendimentoRecord[]
  isLoading: boolean
}

export default function DatabasePage({ empreendimentos, isLoading }: DatabaseProps) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

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
