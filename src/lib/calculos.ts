import {
  PlanoPagamentoItem,
  ResultadosSimulacao,
  CustosOperacionaisDetalhados,
  ParametrosFinanciamento,
  ResultadoFinanciamento,
  PontoEquilibrio,
  ConfigPlanoPagamento,
  BalaoConfig,
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

  // Configuração avançada de prazos e parcelas do Plano de Pagamento
  configPlano?: Partial<ConfigPlanoPagamento>
}

/**
 * Gera a lista de parcelas de balões com seus prazos e valores
 */
export function gerarBaloesPadrao(
  qtdBaloes: number,
  mesesAteEntrega: number,
  percAnoTotal: number,
): BalaoConfig[] {
  const baloes: BalaoConfig[] = []
  const qtd = Math.max(0, qtdBaloes)
  if (qtd === 0) return []

  const percPorBalao = percAnoTotal / qtd

  // Distribui os balões ao longo dos meses de obra (ex: se 3 balões e entrega em 36 meses -> 12, 24, 36)
  // Se entrega for menor (ex: 22 meses e 2 balões -> mês 10 e mês 20)
  for (let i = 1; i <= qtd; i++) {
    // Intervalo uniforme baseado no tempo restante ou anual padrão (12, 24, 36)
    let mesOffset = Math.round((mesesAteEntrega / (qtd + 1)) * i)
    // Se o prazo for múltiplo ou próximo de ano (ex: 24, 36), alinha em 12, 24...
    if (i * 12 <= mesesAteEntrega) {
      mesOffset = i * 12
    }
    // Garante que não ultrapasse a entrega
    mesOffset = Math.min(mesesAteEntrega, Math.max(1, mesOffset))

    baloes.push({
      id: `balao_${i}`,
      mesOffset,
      percentual: percPorBalao,
    })
  }

  return baloes
}

/**
 * Calcula todos os indicadores do simulador avançado Vitacon + Housi
 */
export function calcularSimulacaoCompleta(params: InputSimulacaoAvancada): ResultadosSimulacao {
  const {
    valorImovel,
    percentualAteChavesPerc: percentualAteChavesProp,
    valorDecoracao,
    valorDiaria,
    taxaOcupacaoPerc,
    custosDetalhados,
    financiamento: paramFinanc,
    valorizacaoObraPerc = 0.32,
    dataInicioObra = new Date(),
    configPlano,
  } = params

  const valorImovelSemDecoracao = Math.max(0, valorImovel)

  // 0. DEFINIÇÃO DA CONFIGURAÇÃO DO PLANO DE PAGAMENTO
  // Defaults alinhados ao slide Vitacon:
  // Base total: 10% Ato + 5% Sinal + 5% Mensais + 5% Balões + 5% Única = 30% até as chaves
  // 70% Financiamento (sendo 69.895% financiamento e 0.105% periodicidade, ou proporcional)
  const mesesAteEntrega =
    configPlano?.mesesAteEntrega !== undefined ? Math.max(1, configPlano.mesesAteEntrega) : 24
  const prazoTotalObraMeses = configPlano?.prazoTotalObraMeses ?? 24

  // Quantidade de mensais: se não informada explicitamente, assume os meses restantes até entrega (ex: 22)
  const qtdMensais =
    configPlano?.qtdMensais !== undefined
      ? Math.max(1, configPlano.qtdMensais)
      : Math.min(mesesAteEntrega, 23)

  const qtdSinais = configPlano?.qtdSinais !== undefined ? Math.max(0, configPlano.qtdSinais) : 3
  const qtdBaloes = configPlano?.qtdBaloes !== undefined ? Math.max(0, configPlano.qtdBaloes) : 2

  // Percentuais base (se informados usam o customizado, senão calculam proporcional ao percentualAteChaves)
  // Se o usuário passou percentuais customizados explícitos no configPlano, eles têm prioridade
  const percAtoFinal =
    configPlano?.percAto !== undefined ? configPlano.percAto : (percentualAteChavesProp * 10) / 30

  const percSinaisFinal =
    configPlano?.percSinais !== undefined
      ? configPlano.percSinais
      : (percentualAteChavesProp * 5) / 30

  const percMensaisFinal =
    configPlano?.percMensais !== undefined
      ? configPlano.percMensais
      : (percentualAteChavesProp * 5) / 30

  const percBaloesFinal =
    configPlano?.percBaloesTotal !== undefined
      ? configPlano.percBaloesTotal
      : (percentualAteChavesProp * 5) / 30

  const percUnicaFinal =
    configPlano?.percUnica !== undefined
      ? configPlano.percUnica
      : (percentualAteChavesProp * 5) / 30

  // Total efetivo pago até as chaves derivado da soma das fases em obras
  const percentualAteChavesCalculado =
    percAtoFinal + percSinaisFinal + percMensaisFinal + percBaloesFinal + percUnicaFinal

  // Usa o percentual calculado se houver configuração de plano, senão percentualAteChavesProp
  const percentualAteChavesPerc =
    configPlano !== undefined ? percentualAteChavesCalculado : percentualAteChavesProp

  // Balões
  let baloesConfig: BalaoConfig[] = []
  if (configPlano?.baloes && configPlano.baloes.length === qtdBaloes) {
    baloesConfig = configPlano.baloes
  } else {
    baloesConfig = gerarBaloesPadrao(qtdBaloes, mesesAteEntrega, percBaloesFinal)
  }

  // 1. INVESTIMENTO
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

  // 8. PLANO DE PAGAMENTO EM OBRAS E FINANCIAMENTO
  // O mês atual de referência para vencimentos futuros
  const dataBase = new Date(dataInicioObra)

  // Datas baseadas nos meses restantes até a entrega
  const dataAto = dataBase
  const dataSinal = somarMeses(dataBase, 1)
  // Mensais começam após os sinais se houver, ou no mês subsequente
  const offsetMensais = qtdSinais > 0 ? 1 : 1
  const dataMensais = somarMeses(dataBase, offsetMensais)

  // Única: na entrega das chaves ou 1 mês antes
  const dataUnica = somarMeses(dataBase, Math.max(1, mesesAteEntrega - 1))
  // Financiamento: no mês da entrega das chaves
  const dataFinanciamento = somarMeses(dataBase, mesesAteEntrega)
  // Periodicidade: mês subsequente à entrega
  const dataPeriodicidade = somarMeses(dataBase, mesesAteEntrega + 1)

  // Percentual restante a financiar
  const percFinancDecimal = Math.max(0, 1 - percentualAteChavesPerc / 100)

  // Montagem dinâmica dos itens do Plano de Pagamento
  const planoPagamento: PlanoPagamentoItem[] = []

  // 1. ATO
  if (percAtoFinal > 0) {
    const totalAto = configPlano?.valorAtoManual ?? (valorImovelSemDecoracao * percAtoFinal) / 100
    const percRealAto =
      valorImovelSemDecoracao > 0 ? (totalAto / valorImovelSemDecoracao) * 100 : percAtoFinal
    planoPagamento.push({
      id: 'ato',
      serie: 'ATO',
      inicio: formatarMesAno(dataAto),
      mesesOffset: 0,
      quantidade: 1,
      valorParcela: totalAto,
      total: totalAto,
      percentual: percRealAto,
      percentualParcela: percRealAto,
      fase: 'Em Obras',
    })
  }

  // 2. SINAIS
  if (qtdSinais > 0 && percSinaisFinal > 0) {
    const totalSinais = (valorImovelSemDecoracao * percSinaisFinal) / 100
    const valorParcelaSinal = totalSinais / qtdSinais
    planoPagamento.push({
      id: 'sinais',
      serie: qtdSinais > 1 ? 'SINAIS' : 'SINAL',
      inicio: formatarMesAno(dataSinal),
      mesesOffset: 1,
      quantidade: qtdSinais,
      valorParcela: valorParcelaSinal,
      total: totalSinais,
      percentual: percSinaisFinal,
      percentualParcela: percSinaisFinal / qtdSinais,
      fase: 'Em Obras',
    })
  }

  // 3. MENSAIS
  // O saldo de mensais é distribuído pelas parcelas mensais restantes
  // Exemplo do usuário: Se o saldo a pagar é dividido por menos vezes (ex: 22 parcelas em vez de 24),
  // cada parcela aumenta pois o saldo é dividido por menos meses.
  if (qtdMensais > 0 && percMensaisFinal > 0) {
    const totalMensais = (valorImovelSemDecoracao * percMensaisFinal) / 100
    const valorParcelaMensal = configPlano?.valorParcelaMensalManual ?? totalMensais / qtdMensais
    const totalEfetivoMensais =
      configPlano?.valorParcelaMensalManual !== undefined
        ? valorParcelaMensal * qtdMensais
        : totalMensais
    const percEfetivoMensais =
      valorImovelSemDecoracao > 0
        ? (totalEfetivoMensais / valorImovelSemDecoracao) * 100
        : percMensaisFinal

    planoPagamento.push({
      id: 'mensais',
      serie: 'MENSAIS',
      inicio: formatarMesAno(dataMensais),
      mesesOffset: offsetMensais,
      quantidade: qtdMensais,
      valorParcela: valorParcelaMensal,
      total: totalEfetivoMensais,
      percentual: percEfetivoMensais,
      percentualParcela: percEfetivoMensais / qtdMensais,
      fase: 'Em Obras',
    })
  }

  // 4. BALÕES (ANUAIS)
  // Cada balão pode ser configurado individualmente (mês em que cai e seu valor/percentual)
  if (qtdBaloes > 0 && baloesConfig.length > 0) {
    if (qtdBaloes === 1) {
      const b = baloesConfig[0]
      const percBalao = b.percentual ?? percBaloesFinal
      const totalBalao = b.valorManual ?? (valorImovelSemDecoracao * percBalao) / 100
      const dataBalao = somarMeses(dataBase, b.mesOffset)
      planoPagamento.push({
        id: b.id,
        serie: `ANUAL (${b.mesOffset}º MÊS)`,
        inicio: formatarMesAno(dataBalao),
        mesesOffset: b.mesOffset,
        quantidade: 1,
        valorParcela: totalBalao,
        total: totalBalao,
        percentual: percBalao,
        percentualParcela: percBalao,
        fase: 'Em Obras',
      })
    } else {
      // Se múltiplos balões, agrupa como ANUAIS (ou linhas de balões individuais)
      // Para manter fidelidade à tabela onde tem ANUAIS com Qtd Nx, somamos:
      const totalBaloes = (valorImovelSemDecoracao * percBaloesFinal) / 100
      const valorParcelaBalao = totalBaloes / qtdBaloes
      const primeiroMesBalao = baloesConfig[0]?.mesOffset ?? 12
      const dataPrimeiroBalao = somarMeses(dataBase, primeiroMesBalao)

      planoPagamento.push({
        id: 'anuais',
        serie: 'ANUAIS',
        inicio: formatarMesAno(dataPrimeiroBalao),
        mesesOffset: primeiroMesBalao,
        quantidade: qtdBaloes,
        valorParcela: valorParcelaBalao,
        total: totalBaloes,
        percentual: percBaloesFinal,
        percentualParcela: percBaloesFinal / qtdBaloes,
        fase: 'Em Obras',
      })
    }
  }

  // 5. ÚNICA
  if (percUnicaFinal > 0) {
    const totalUnica =
      configPlano?.valorUnicaManual ?? (valorImovelSemDecoracao * percUnicaFinal) / 100
    const percRealUnica =
      valorImovelSemDecoracao > 0 ? (totalUnica / valorImovelSemDecoracao) * 100 : percUnicaFinal
    planoPagamento.push({
      id: 'unica',
      serie: 'ÚNICA',
      inicio: formatarMesAno(dataUnica),
      mesesOffset: Math.max(1, mesesAteEntrega - 1),
      quantidade: 1,
      valorParcela: totalUnica,
      total: totalUnica,
      percentual: percRealUnica,
      percentualParcela: percRealUnica,
      fase: 'Em Obras',
    })
  }

  // 6. FINANCIAMENTO
  const totalFinanciamento = saldoRestanteFinanciar * 0.9985
  const percFinancTotal = percFinancDecimal * 99.85
  planoPagamento.push({
    id: 'financiamento',
    serie: 'FINANCIAMENTO',
    inicio: formatarMesAno(dataFinanciamento),
    mesesOffset: mesesAteEntrega,
    quantidade: 1,
    valorParcela: totalFinanciamento,
    total: totalFinanciamento,
    percentual: percFinancTotal,
    percentualParcela: percFinancTotal,
    fase: 'Financiamento',
  })

  // 7. PERIODICIDADE
  const totalPeriodicidade = saldoRestanteFinanciar * 0.0015
  const percPeriodicidade = percFinancDecimal * 0.15
  planoPagamento.push({
    id: 'periodicidade',
    serie: 'PERIODICIDADE',
    inicio: formatarMesAno(dataPeriodicidade),
    mesesOffset: mesesAteEntrega + 1,
    quantidade: 1,
    valorParcela: totalPeriodicidade,
    total: totalPeriodicidade,
    percentual: percPeriodicidade,
    percentualParcela: percPeriodicidade,
    fase: 'Financiamento',
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

    // Valorização e Configuração do Plano
    valorizacaoObraPercent: valorizacaoObraPerc * 100,
    mediaValorAtivoEntrega,
    configPlanoPagamento: {
      mesesAteEntrega,
      prazoTotalObraMeses,
      qtdMensais,
      qtdSinais,
      qtdBaloes,
      percAto: percAtoFinal,
      percSinais: percSinaisFinal,
      percMensais: percMensaisFinal,
      percBaloesTotal: percBaloesFinal,
      percUnica: percUnicaFinal,
      baloes: baloesConfig,
      valorAtoManual: configPlano?.valorAtoManual,
      valorUnicaManual: configPlano?.valorUnicaManual,
      valorParcelaMensalManual: configPlano?.valorParcelaMensalManual,
    },
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
