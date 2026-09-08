export interface EmpreendimentoRecord {
  id: string
  nome: string
  endereco: string
  bairro: string
  valor_diaria: number
  valor_m2: number
  created?: string
  updated?: string
}

export interface PlanoPagamentoItem {
  serie: string
  inicio: string // Formato exibição: ex. "Abr/2025"
  quantidade: number
  valorParcela: number
  total: number
  percentual: number
  percentualParcela: number
  fase: 'Em Obras' | 'Financiamento'
}

export interface CustosOperacionaisDetalhados {
  condominio: number
  iptu: number
  wifiTv: number
  energiaAgua: number
  taxaAdminHousiPerc: number // decimal ex: 0.15
  outrasDespesas: number
}

export type SistemaFinanciamento = 'SAC' | 'PRICE'

export interface ParametrosFinanciamento {
  ativo: boolean
  valorFinanciado: number
  taxaJurosAnualPerc: number // % a.a. ex: 10.5
  prazoAnos: number // ex: 30
  sistema: SistemaFinanciamento
  valorParcelaManual?: number // override manual caso informado
}

export interface ResultadoFinanciamento {
  sistema: SistemaFinanciamento
  valorFinanciado: number
  prazoMeses: number
  taxaJurosMensalPerc: number
  primeiraParcela: number
  ultimaParcela: number
  parcelaMedia: number
  parcelaEfetiva: number // A que é deduzida mensalmente (média no SAC ou constante no Price ou override)
  totalJuros: number
  totalPago: number
  manualOverride: boolean
}

export interface PontoEquilibrio {
  ocupacaoMinimaPerc: number // % ex: 45.2%
  diasMinimosOcupados: number // ex: 13.5 dias
  diariaMinima: number // R$ mantendo ocupação atual
  receitaBrutaMinima: number // R$ receita necessária para zerar sobra
  custoTotalComFinanciamento: number // custos operacionais fixos + parcela financiamento / (1 - taxaAdmin)
  equilibrioAtingivel: boolean
}

export interface CenarioComparativo {
  id: 'conservador' | 'provavel' | 'otimista' | 'personalizado'
  nome: string
  descricao?: string
  diaria: number
  taxaOcupacaoPerc: number
  taxaAdminHousiPerc: number // % ex 15, 16.5, 18
  faturamentoBruto: number
  totalDespesas: number
  sobraLiquida: number
  rentabilidadeMensalSobreAporte: number
  rentabilidadeAnualSobreAporte: number
  rentabilidadeMensalSobrePatrimonio: number
  rentabilidadeAnualSobrePatrimonio: number
  paybackAnos: number
}

export interface ResultadosSimulacao {
  // Investimento
  valorImovelSemDecoracao: number
  valorDecoracao: number
  patrimonioTotal: number // Imóvel + Decoração
  percentualAteChaves: number // % ex: 30
  montanteAteChaves: number // % s/ imóvel
  totalInvestidoAporte: number // Entrada + Decoração
  saldoRestanteFinanciar: number // Imóvel - montanteAteChaves

  // Receita
  diasOcupados: number
  faturamentoBrutoMensal: number

  // Despesas Operacionais
  valorTaxaAdminHousi: number
  custosOperacionaisDetalhados: CustosOperacionaisDetalhados
  totalDespesasMensais: number

  // Resultados Operacionais
  receitaLiquidaAntesFinanciamento: number // faturamentoBrutoMensal - totalDespesasMensais
  percentualSobreAporteAntesFinanc: number // % a.m.
  percentualSobrePatrimonioAntesFinanc: number // % a.m.

  // Financiamento
  financiamento: ResultadoFinanciamento

  // Resultado Líquido Final
  resultadoLiquidoFinal: number // receitaLiquidaAntesFinanciamento - parcelaEfetiva
  rentabilidadeMensalSobreAporte: number // % a.m. s/ totalInvestidoAporte
  rentabilidadeAnualSobreAporte: number // % a.a.
  rentabilidadeMensalSobrePatrimonio: number // % a.m. s/ patrimonioTotal
  rentabilidadeAnualSobrePatrimonio: number // % a.a.
  paybackMeses: number
  paybackAnos: number

  // Ponto de Equilíbrio
  pontoEquilibrio: PontoEquilibrio

  // Valorização e legado
  valorizacaoObraPercent: number
  mediaValorAtivoEntrega: number
  planoPagamento: PlanoPagamentoItem[]

  // Legado de compatibilidade
  valorTotalImovel: number // igual a valorImovelSemDecoracao
  custosOperacionais: number // igual a totalDespesasMensais
  lucroLiquidoMensal: number // igual a resultadoLiquidoFinal (ou receita líquida se sem financ)
  rentabilidadeMensalPatrimonio: number
  rentabilidadeAnualPatrimonio: number
  aporteEmObras: number
  rentabilidadeSobreAporte: number
}

export interface SimulacaoRecord {
  id: string
  collectionId?: string
  collectionName?: string
  user: string
  titulo?: string
  empreendimento?: string
  bairro?: string
  endereco?: string
  valor_m2: number
  metragem: number
  valor_diaria: number
  taxa_ocupacao: number // decimal 0 - 1
  custos_operacionais: number // decimal 0 - 1
  valorizacao_obra: number // decimal 0 - 1
  resultados: ResultadosSimulacao
  created?: string
  updated?: string
}
