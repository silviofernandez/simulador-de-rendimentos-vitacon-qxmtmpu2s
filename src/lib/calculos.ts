import {
  PlanoPagamentoItem,
  ResultadosSimulacao,
  CustosOperacionaisDetalhados,
  ParametrosFinanciamento,
  ResultadoFinanciamento,
  PontoEquilibrio,
} from '@/types/simulador'

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
 * Calcula a amortização por SAC ou Price
 */
export function calcularFinanciamento(params: ParametrosFinanciamento): ResultadoFinanciamento {
  const { ativo, valorFinanciado, taxaJurosAnualPerc, prazoAnos, sistema, valorParcelaManual } =
    params

  if (!ativo || valorFinanciado <= 0 || prazoAnos <= 0) {
    return {
      sistema,
      valorFinanciado: 0,
      prazoMeses: 0,
      taxaJurosMensalPerc: 0,
      primeiraParcela: 0,
      ultimaParcela: 0,
      parcelaMedia: 0,
      parcelaEfetiva: valorParcelaManual && valorParcelaManual > 0 ? valorParcelaManual : 0,
      totalJuros: 0,
      totalPago: 0,
      manualOverride: !!(valorParcelaManual && valorParcelaManual > 0),
    }
  }

  const prazoMeses = Math.round(prazoAnos * 12)
  // Taxa mensal equivalente a partir da anual: i_m = (1 + i_a)^(1/12) - 1
  // Para taxas de crédito imobiliário bancário, comumente taxa_mensal = taxa_anual / 12 (taxa nominal)
  // Utilizaremos a taxa proporcional/nominal usual de contratos imobiliários (ex: 10% a.a. / 12)
  const iMensal = taxaJurosAnualPerc / 100 / 12
  const taxaJurosMensalPerc = iMensal * 100

  let primeiraParcela = 0
  let ultimaParcela = 0
  let parcelaMedia = 0
  let totalPago = 0

  if (sistema === 'SAC') {
    const amortizacaoConstante = valorFinanciado / prazoMeses
    // Primeira parcela: amortização + juros sobre saldo inicial
    primeiraParcela = amortizacaoConstante + valorFinanciado * iMensal
    // Última parcela: amortização + juros sobre a última amortização
    ultimaParcela = amortizacaoConstante + amortizacaoConstante * iMensal
    // Parcela média no SAC é a média aritmética entre a primeira e a última
    parcelaMedia = (primeiraParcela + ultimaParcela) / 2
    totalPago = parcelaMedia * prazoMeses
  } else {
    // Sistema PRICE: PMT = VP * [ i*(1+i)^n ] / [ (1+i)^n - 1 ]
    if (iMensal > 0) {
      const fator = Math.pow(1 + iMensal, prazoMeses)
      primeiraParcela = (valorFinanciado * (iMensal * fator)) / (fator - 1)
    } else {
      primeiraParcela = valorFinanciado / prazoMeses
    }
    ultimaParcela = primeiraParcela
    parcelaMedia = primeiraParcela
    totalPago = primeiraParcela * prazoMeses
  }

  const totalJuros = Math.max(0, totalPago - valorFinanciado)
  const manualOverride = typeof valorParcelaManual === 'number' && valorParcelaManual > 0
  const parcelaEfetiva = manualOverride ? valorParcelaManual! : parcelaMedia

  return {
    sistema,
    valorFinanciado,
    prazoMeses,
    taxaJurosMensalPerc,
    primeiraParcela,
    ultimaParcela,
    parcelaMedia,
    parcelaEfetiva,
    totalJuros,
    totalPago,
    manualOverride,
  }
}

/**
 * Calcula o ponto de equilíbrio operacional
 * Ocupação mínima e Diária mínima para cobrir todas as despesas e financiamento
 */
export function calcularPontoEquilibrio(params: {
  valorDiaria: number
  taxaOcupacaoPerc: number
  despesasFixas: number // condomínio, iptu, wifi, energia/água, outras
  taxaAdminHousiPerc: number // decimal 0.15 a 0.18
  parcelaFinanciamento: number
}): PontoEquilibrio {
  const { valorDiaria, taxaOcupacaoPerc, despesasFixas, taxaAdminHousiPerc, parcelaFinanciamento } =
    params

  const despesaTotalFixa = despesasFixas + parcelaFinanciamento
  // Fórmula: Faturamento Bruto - (Faturamento Bruto * taxaAdmin) - despesaTotalFixa = 0
  // Faturamento Bruto * (1 - taxaAdmin) = despesaTotalFixa
  // Receita Bruta Mínima = despesaTotalFixa / (1 - taxaAdmin)
  const divisor = Math.max(0.01, 1 - taxaAdminHousiPerc)
  const receitaBrutaMinima = despesaTotalFixa / divisor

  // 1. Ocupação mínima com a diária atual (30 dias no mês)
  // receita = valorDiaria * 30 * (ocupacao / 100) => ocupacao = (receita / (valorDiaria * 30)) * 100
  const faturamentoMaximoMes = valorDiaria * 30
  const ocupacaoMinimaPerc =
    faturamentoMaximoMes > 0 ? (receitaBrutaMinima / faturamentoMaximoMes) * 100 : 0
  const diasMinimosOcupados = (ocupacaoMinimaPerc / 100) * 30

  // 2. Diária mínima com a taxa de ocupação atual
  const diasAtuais = 30 * (taxaOcupacaoPerc / 100)
  const diariaMinima = diasAtuais > 0 ? receitaBrutaMinima / diasAtuais : 0

  return {
    ocupacaoMinimaPerc,
    diasMinimosOcupados,
    diariaMinima,
    receitaBrutaMinima,
    custoTotalComFinanciamento: despesaTotalFixa,
    equilibrioAtingivel: ocupacaoMinimaPerc <= 100,
  }
}

export interface InputSimulacaoAvancada {
  // Imóvel
  valorImovel: number // R$
  percentualAteChavesPerc: number // % ex: 30
  valorDecoracao: number // R$ ex: 59000

  // Receita
  valorDiaria: number // R$ ex: 270
  taxaOcupacaoPerc: number // % ex: 70

  // Custos Detalhados
  custosDetalhados: CustosOperacionaisDetalhados

  // Financiamento
  financiamento: ParametrosFinanciamento

  // Cronograma / Valorização
  valorizacaoObraPerc?: number // decimal 0..1 (default 0.32)
  dataInicioObra?: Date
}

/**
 * Calcula todos os indicadores do simulador avançado Vitacon + Housi
 */
export function calcularSimulacaoCompleta(params: InputSimulacaoAvancada): ResultadosSimulacao {
  const {
    valorImovel,
    percentualAteChavesPerc,
    valorDecoracao,
    valorDiaria,
    taxaOcupacaoPerc,
    custosDetalhados,
    financiamento: paramFinanc,
    valorizacaoObraPerc = 0.32,
    dataInicioObra = new Date(2025, 3, 1),
  } = params

  // 1. INVESTIMENTO
  const valorImovelSemDecoracao = Math.max(0, valorImovel)
  const patrimonioTotal = valorImovelSemDecoracao + valorDecoracao
  const montanteAteChaves = valorImovelSemDecoracao * (percentualAteChavesPerc / 100)
  const totalInvestidoAporte = montanteAteChaves + valorDecoracao
  const saldoRestanteFinanciar = Math.max(0, valorImovelSemDecoracao - montanteAteChaves)

  // 2. RECEITA BRUTA MENSAL
  const diasOcupados = 30 * (taxaOcupacaoPerc / 100)
  const faturamentoBrutoMensal = valorDiaria * diasOcupados

  // 3. CUSTOS MENSAIS
  const valorTaxaAdminHousi = faturamentoBrutoMensal * custosDetalhados.taxaAdminHousiPerc
  const despesasFixas =
    custosDetalhados.condominio +
    custosDetalhados.iptu +
    custosDetalhados.wifiTv +
    custosDetalhados.energiaAgua +
    custosDetalhados.outrasDespesas
  const totalDespesasMensais = despesasFixas + valorTaxaAdminHousi

  // 4. PROJEÇÃO DE RENTABILIDADE (ANTES DO FINANCIAMENTO)
  const receitaLiquidaAntesFinanciamento = faturamentoBrutoMensal - totalDespesasMensais
  const percentualSobreAporteAntesFinanc =
    totalInvestidoAporte > 0 ? (receitaLiquidaAntesFinanciamento / totalInvestidoAporte) * 100 : 0
  const percentualSobrePatrimonioAntesFinanc =
    patrimonioTotal > 0 ? (receitaLiquidaAntesFinanciamento / patrimonioTotal) * 100 : 0

  // 5. FINANCIAMENTO
  // Se o valor financiado não foi alterado manualmente ou estiver desatualizado, utiliza saldoRestanteFinanciar
  const valorFinancReal =
    paramFinanc.valorFinanciado > 0 ? paramFinanc.valorFinanciado : saldoRestanteFinanciar
  const resFinanc = calcularFinanciamento({
    ...paramFinanc,
    valorFinanciado: valorFinancReal,
  })

  // 6. RESULTADO LÍQUIDO FINAL (APÓS A PARCELA DE FINANCIAMENTO)
  const parcelaADeduzir = paramFinanc.ativo ? resFinanc.parcelaEfetiva : 0
  const resultadoLiquidoFinal = receitaLiquidaAntesFinanciamento - parcelaADeduzir

  const rentabilidadeMensalSobreAporte =
    totalInvestidoAporte > 0 ? (resultadoLiquidoFinal / totalInvestidoAporte) * 100 : 0
  const rentabilidadeAnualSobreAporte = rentabilidadeMensalSobreAporte * 12

  const rentabilidadeMensalSobrePatrimonio =
    patrimonioTotal > 0 ? (resultadoLiquidoFinal / patrimonioTotal) * 100 : 0
  const rentabilidadeAnualSobrePatrimonio = rentabilidadeMensalSobrePatrimonio * 12

  // Payback estimado (anos e meses para recuperar o aporte total com a sobra líquida mensal)
  const paybackMeses =
    resultadoLiquidoFinal > 0 ? totalInvestidoAporte / resultadoLiquidoFinal : 999
  const paybackAnos = paybackMeses / 12

  // 7. PONTO DE EQUILÍBRIO
  const pontoEquilibrio = calcularPontoEquilibrio({
    valorDiaria,
    taxaOcupacaoPerc,
    despesasFixas,
    taxaAdminHousiPerc: custosDetalhados.taxaAdminHousiPerc,
    parcelaFinanciamento: parcelaADeduzir,
  })

  // 8. PLANO DE PAGAMENTO EM OBRAS (30% e 70%)
  const dataAto = new Date(dataInicioObra)
  const dataSinal = somarMeses(dataAto, 1)
  const dataMensais = somarMeses(dataAto, 4)
  const dataAnuais = somarMeses(dataAto, 12)
  const dataUnica = somarMeses(dataAto, 34)
  const dataFinanciamento = somarMeses(dataAto, 35)
  const dataPeriodicidade = somarMeses(dataAto, 36)

  // Adapta proporção em obras conforme percentualAteChavesPerc
  const percObrasDecimal = percentualAteChavesPerc / 100
  const percFinancDecimal = Math.max(0, 1 - percObrasDecimal)

  const seriesDef: Array<{
    serie: string
    data: Date
    qtd: number
    percentual: number
    fase: 'Em Obras' | 'Financiamento'
  }> = [
    {
      serie: 'ATO',
      data: dataAto,
      qtd: 1,
      percentual: percObrasDecimal * (10 / 30),
      fase: 'Em Obras',
    },
    {
      serie: 'SINAL',
      data: dataSinal,
      qtd: 3,
      percentual: percObrasDecimal * (5 / 30),
      fase: 'Em Obras',
    },
    {
      serie: 'MENSAIS',
      data: dataMensais,
      qtd: 23,
      percentual: percObrasDecimal * (5 / 30),
      fase: 'Em Obras',
    },
    {
      serie: 'ANUAIS',
      data: dataAnuais,
      qtd: 2,
      percentual: percObrasDecimal * (5 / 30),
      fase: 'Em Obras',
    },
    {
      serie: 'ÚNICA',
      data: dataUnica,
      qtd: 1,
      percentual: percObrasDecimal * (5 / 30),
      fase: 'Em Obras',
    },
    {
      serie: 'FINANCIAMENTO',
      data: dataFinanciamento,
      qtd: 1,
      percentual: percFinancDecimal * 0.9985,
      fase: 'Financiamento',
    },
    {
      serie: 'PERIODICIDADE',
      data: dataPeriodicidade,
      qtd: 1,
      percentual: percFinancDecimal * 0.0015,
      fase: 'Financiamento',
    },
  ]

  const planoPagamento: PlanoPagamentoItem[] = seriesDef.map((s) => {
    const totalSerie = valorImovelSemDecoracao * s.percentual
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

  const mediaValorAtivoEntrega = valorImovelSemDecoracao * (1 + valorizacaoObraPerc)

  return {
    // Investimento
    valorImovelSemDecoracao,
    valorDecoracao,
    patrimonioTotal,
    percentualAteChaves: percentualAteChavesPerc,
    montanteAteChaves,
    totalInvestidoAporte,
    saldoRestanteFinanciar,

    // Receita
    diasOcupados,
    faturamentoBrutoMensal,

    // Despesas
    valorTaxaAdminHousi,
    custosOperacionaisDetalhados: custosDetalhados,
    totalDespesasMensais,

    // Resultados Antes Financiamento
    receitaLiquidaAntesFinanciamento,
    percentualSobreAporteAntesFinanc,
    percentualSobrePatrimonioAntesFinanc,

    // Financiamento
    financiamento: resFinanc,

    // Resultados Finais
    resultadoLiquidoFinal,
    rentabilidadeMensalSobreAporte,
    rentabilidadeAnualSobreAporte,
    rentabilidadeMensalSobrePatrimonio,
    rentabilidadeAnualSobrePatrimonio,
    paybackMeses,
    paybackAnos,

    // Ponto de Equilíbrio
    pontoEquilibrio,

    // Valorização
    valorizacaoObraPercent: valorizacaoObraPerc * 100,
    mediaValorAtivoEntrega,
    planoPagamento,

    // Legado de compatibilidade
    valorTotalImovel: valorImovelSemDecoracao,
    custosOperacionais: totalDespesasMensais,
    lucroLiquidoMensal: resultadoLiquidoFinal,
    rentabilidadeMensalPatrimonio: rentabilidadeMensalSobrePatrimonio,
    rentabilidadeAnualPatrimonio: rentabilidadeAnualSobrePatrimonio,
    aporteEmObras: montanteAteChaves,
    rentabilidadeSobreAporte: rentabilidadeMensalSobreAporte,
  }
}

/**
 * Função de retrocompatibilidade com a versão anterior
 */
export function calcularSimulacao(params: {
  valorM2: number
  metragem: number
  valorDiaria: number
  taxaOcupacao: number
  custosOperacionaisPerc: number
  valorizacaoObraPerc: number
  dataInicioObra?: Date
}): ResultadosSimulacao {
  const valorImovel = params.valorM2 * params.metragem
  const taxaOcupacaoPerc = params.taxaOcupacao * 100

  // Distribui custos operacionais aproximados
  const fatBruto = params.valorDiaria * 30 * params.taxaOcupacao
  const totalCustos = fatBruto * params.custosOperacionaisPerc

  const taxaAdminPerc = 0.15
  const adminHousi = fatBruto * taxaAdminPerc
  const sobraDespesasFixas = Math.max(0, totalCustos - adminHousi)

  const custosDetalhados: CustosOperacionaisDetalhados = {
    condominio: sobraDespesasFixas * 0.5,
    iptu: sobraDespesasFixas * 0.15,
    wifiTv: sobraDespesasFixas * 0.18,
    energiaAgua: sobraDespesasFixas * 0.17,
    taxaAdminHousiPerc: taxaAdminPerc,
    outrasDespesas: 0,
  }

  return calcularSimulacaoCompleta({
    valorImovel,
    percentualAteChavesPerc: 30,
    valorDecoracao: 59000,
    valorDiaria: params.valorDiaria,
    taxaOcupacaoPerc,
    custosDetalhados,
    financiamento: {
      ativo: false,
      valorFinanciado: valorImovel * 0.7,
      taxaJurosAnualPerc: 10.0,
      prazoAnos: 30,
      sistema: 'SAC',
    },
    valorizacaoObraPerc: params.valorizacaoObraPerc,
    dataInicioObra: params.dataInicioObra,
  })
}
