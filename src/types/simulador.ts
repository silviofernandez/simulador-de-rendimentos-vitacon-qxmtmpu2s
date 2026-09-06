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

export interface ResultadosSimulacao {
  valorTotalImovel: number
  faturamentoBrutoMensal: number
  custosOperacionais: number
  lucroLiquidoMensal: number
  rentabilidadeMensalPatrimonio: number // %
  rentabilidadeAnualPatrimonio: number // %
  aporteEmObras: number
  rentabilidadeSobreAporte: number // %
  rentabilidadeAnualSobreAporte: number // %
  valorizacaoObraPercent: number // %
  mediaValorAtivoEntrega: number
  planoPagamento: PlanoPagamentoItem[]
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
