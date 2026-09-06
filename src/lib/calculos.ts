import { PlanoPagamentoItem, ResultadosSimulacao } from '@/types/simulador'

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val || 0)
}

export const formatCurrencyDetailed = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0)
}

export const formatPercent = (val: number, decimals: number = 2): string => {
  return (
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val || 0) + '%'
  )
}

export const mesesNomesAbrev = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

export const formatarMesAno = (date: Date): string => {
  return `${mesesNomesAbrev[date.getMonth()]}/${date.getFullYear()}`
}

export const somarMeses = (date: Date, meses: number): Date => {
  const d = new Date(date.getTime())
  d.setMonth(d.getMonth() + meses)
  return d
}

/**
 * Calcula os resultados financeiros e a tabela do plano de pagamento
 * estritamente baseados na planilha do Vitacon
 */
export function calcularSimulacao(params: {
  valorM2: number
  metragem: number
  valorDiaria: number
  taxaOcupacao: number // decimal 0..1 (ex: 0.75)
  custosOperacionaisPerc: number // decimal 0..1 (ex: 0.24)
  valorizacaoObraPerc: number // decimal 0..1 (ex: 0.32)
  dataInicioObra?: Date // default Abr/2025
}): ResultadosSimulacao {
  const {
    valorM2,
    metragem,
    valorDiaria,
    taxaOcupacao,
    custosOperacionaisPerc,
    valorizacaoObraPerc,
    dataInicioObra = new Date(2025, 3, 1), // 1 de Abril de 2025
  } = params

  // 1. Valor total do imóvel
  const valorTotalImovel = valorM2 * metragem

  // 2. Faturamento bruto mensal: diária * 30 * ocupação
  // (exemplo na planilha: 300 * 30 * 0.75 = 6.750)
  const faturamentoBrutoMensal = valorDiaria * 30 * taxaOcupacao

  // 3. Custos operacionais: faturamento bruto * custos%
  // (exemplo: 6.750 * 0.24 = 1.620)
  const custosOperacionais = faturamentoBrutoMensal * custosOperacionaisPerc

  // 4. Lucro líquido mensal: faturamento bruto - custos
  // (exemplo: 6.750 - 1.620 = 5.130)
  const lucroLiquidoMensal = faturamentoBrutoMensal - custosOperacionais

  // 5. Rentabilidade mensal sobre patrimônio: lucro / valorTotalImovel
  // (exemplo: 5.130 / 410.000 = 0.012512195... -> ~1.2512%)
  const rentabilidadeMensalPatrimonio =
    valorTotalImovel > 0 ? (lucroLiquidoMensal / valorTotalImovel) * 100 : 0

  // 6. Rentabilidade anual sobre patrimônio:
  // na planilha linha 19: = 0.16 (ou ~16%)
  const rentabilidadeAnualPatrimonio = rentabilidadeMensalPatrimonio * 12

  // 7. Plano de Pagamento
  // Séries da planilha:
  // ATO: 10% (1 parcela) -> Data de Início da Obra (Abr/2025)
  // SINAL: 5% (3 parcelas) -> Início no mês seguinte (Mai/2025)
  // MENSAIS: 5% (23 parcelas) -> 3 meses após SINAL (Ago/2025)
  // ANUAIS: 5% (2 parcelas) -> 12 meses após início da obra (Abr/2026)
  // ÚNICA: 5% (1 parcela) -> Final da obra (~Fev/2028, 34 meses)
  // FINANCIAMENTO: 69.9% (1 parcela) -> Entrega (~Mar/2028, 35 meses)
  // PERIODICIDADE: 0.1% (1 parcela) -> Pós-entrega (~Abr/2028, 36 meses)
  // Soma das séries em obras = 10% + 5% + 5% + 5% + 5% = 30%
  // FINANCIAMENTO + PERIODICIDADE = 69.9% + 0.1% = 70%

  const dataAto = new Date(dataInicioObra)
  const dataSinal = somarMeses(dataAto, 1)
  const dataMensais = somarMeses(dataAto, 4)
  const dataAnuais = somarMeses(dataAto, 12)
  const dataUnica = somarMeses(dataAto, 34)
  const dataFinanciamento = somarMeses(dataAto, 35)
  const dataPeriodicidade = somarMeses(dataAto, 36)

  const seriesDef: Array<{
    serie: string
    data: Date
    qtd: number
    percentual: number
    fase: 'Em Obras' | 'Financiamento'
  }> = [
    { serie: 'ATO', data: dataAto, qtd: 1, percentual: 0.1, fase: 'Em Obras' },
    { serie: 'SINAL', data: dataSinal, qtd: 3, percentual: 0.05, fase: 'Em Obras' },
    { serie: 'MENSAIS', data: dataMensais, qtd: 23, percentual: 0.05, fase: 'Em Obras' },
    { serie: 'ANUAIS', data: dataAnuais, qtd: 2, percentual: 0.05, fase: 'Em Obras' },
    { serie: 'ÚNICA', data: dataUnica, qtd: 1, percentual: 0.05, fase: 'Em Obras' },
    {
      serie: 'FINANCIAMENTO',
      data: dataFinanciamento,
      qtd: 1,
      percentual: 0.699,
      fase: 'Financiamento',
    },
    {
      serie: 'PERIODICIDADE',
      data: dataPeriodicidade,
      qtd: 1,
      percentual: 0.001,
      fase: 'Financiamento',
    },
  ]

  const planoPagamento: PlanoPagamentoItem[] = seriesDef.map((s) => {
    const totalSerie = valorTotalImovel * s.percentual
    const valorParcela = s.qtd > 0 ? totalSerie / s.qtd : 0
    const percentualParcela = (s.percentual / s.qtd) * 100
    return {
      serie: s.serie,
      inicio: formatarMesAno(s.data),
      quantidade: s.qtd,
      valorParcela,
      total: totalSerie,
      percentual: s.percentual * 100,
      percentualParcela,
      fase: s.fase,
    }
  })

  // Aporte "Em Obras" = soma das parcelas de Em Obras (ex: 30% do imóvel = 123.000 ou 123.410 com ajuste)
  const aporteEmObras = planoPagamento
    .filter((p) => p.fase === 'Em Obras')
    .reduce((acc, curr) => acc + curr.total, 0)

  // 8. Rentabilidade sobre aporte (%)
  // lucro / aporte (ex: 5.130 / 123.410 ou 123.000 = ~4.157%)
  const rentabilidadeSobreAporte =
    aporteEmObras > 0 ? (lucroLiquidoMensal / aporteEmObras) * 100 : 0
  const rentabilidadeAnualSobreAporte = rentabilidadeSobreAporte * 12

  // 9. Média valor do ativo na entrega: valorTotalImovel * (1 + valorizacaoObraPerc)
  const mediaValorAtivoEntrega = valorTotalImovel * (1 + valorizacaoObraPerc)

  return {
    valorTotalImovel,
    faturamentoBrutoMensal,
    custosOperacionais,
    lucroLiquidoMensal,
    rentabilidadeMensalPatrimonio,
    rentabilidadeAnualPatrimonio,
    aporteEmObras,
    rentabilidadeSobreAporte,
    rentabilidadeAnualSobreAporte,
    valorizacaoObraPercent: valorizacaoObraPerc * 100,
    mediaValorAtivoEntrega,
    planoPagamento,
  }
}
