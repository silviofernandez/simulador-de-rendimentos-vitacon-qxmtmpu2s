export interface EmpreendimentoRecord {
  id: string
  nome: string
  endereco: string
  bairro: string
  valor_diaria: number
  valor_m2: number
  meses_ate_entrega?: number
  data_entrega_chaves?: string // YYYY-MM-DD ou YYYY-MM
  descricao?: string
  created?: string
  updated?: string
}

export interface PlanoPagamentoItem {
  id?: string
  serie: string
  inicio: string // Formato exibição: ex. "Abr/2025"
  mesesOffset?: number // meses a partir do mês atual/início (0 = ato, 1 = sinal, etc.)
  quantidade: number
  valorParcela: number
  total: number
  percentual: number
  percentualParcela: number
  fase: 'Em Obras' | 'Financiamento'
}

export interface BalaoConfig {
  id: string
  mesOffset: number // Em qual mês da obra cai (ex: 12, 24, 36)
  percentual?: number // % do valor do imóvel (ou recalcula proporcional)
  valorManual?: number
}

export interface DatasEspecificasPlano {
  dataAto?: string // ex: "10/09/2026"
  dataSinal?: string // ex: "10/10/2026"
  dataMensal?: string // ex: "10/01/2027"
  dataAnual?: string // ex: "10/09/2027"
  dataUnica?: string // ex: "10/12/2029"
  dataFinanciamento?: string // ex: "30/01/2030"
  dataPeriodicidade?: string // ex: "28/02/2030"
}

export interface ConfigPlanoPagamento {
  // Prazos mestres
  mesesAteEntrega: number // ex: 22 (parâmetro mestre)
  dataEntregaChaves?: string // YYYY-MM-DD (fonte de verdade para prazo dinâmico)
  prazoTotalObraMeses: number // prazo original/total da obra do lançamento (ex: 24, 36)

  // Quantidades de parcelas
  qtdMensais: number // ex: 22 ou 35
  qtdSinais: number // ex: 3
  qtdBaloes: number // ex: 2 ou 3

  // Percentuais de cada linha (% do valor do imóvel)
  percAto?: number // ex: 10
  percSinais?: number // ex: 5
  percMensais?: number // ex: 5
  percBaloesTotal?: number // ex: 5
  percUnica?: number // ex: 5

  // Configuração detalhada de cada balão
  baloes: BalaoConfig[]

  // Overrides manuais opcionais de valores
  valorAtoManual?: number
  valorUnicaManual?: number
  valorParcelaMensalManual?: number

  // Datas fixadas / específicas vindas de tabela oficial
  datasEspecificas?: DatasEspecificasPlano
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
  configPlanoPagamento?: ConfigPlanoPagamento
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
  meses_ate_entrega?: number
  config_plano_pagamento?: ConfigPlanoPagamento
  resultados: ResultadosSimulacao
  created?: string
  updated?: string
}

export type TipologiaUnidade = 'R2V' | 'NR' | 'HIS' | 'HMP'
export type StatusUnidade = 'disponivel' | 'reservada' | 'vendida'

export interface UnidadeRecord {
  id: string
  collectionId?: string
  collectionName?: string
  empreendimento: string
  unidade: string
  andar?: number
  tipologia: TipologiaUnidade
  metragem: number
  valor: number
  status?: StatusUnidade
  valor_diaria?: number
  observacoes?: string
  created?: string
  updated?: string
}

export type CategoriaMidia =
  | 'Mapa de disponibilidade'
  | 'Planta'
  | 'Foto'
  | 'Tabela'
  | 'Book'
  | 'Outros'

export interface MidiaRecord {
  id: string
  collectionId?: string
  collectionName?: string
  titulo: string
  categoria?: CategoriaMidia
  empreendimento?: string
  arquivo: string
  descricao?: string
  criado_por?: string
  created?: string
  updated?: string
}

export interface UserRecord {
  id: string
  collectionId?: string
  collectionName?: string
  name: string
  email: string
  role?: 'admin' | 'corretor' | 'investidor'
  is_active?: boolean
  avatar?: string
  created?: string
  updated?: string
}
