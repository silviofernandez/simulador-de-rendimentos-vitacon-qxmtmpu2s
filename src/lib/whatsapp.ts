import { ResultadosSimulacao, SimulacaoRecord } from '@/types/simulador'
import { formatCurrency, formatPercent } from '@/lib/calculos'

export interface DadosParaMensagemWhatsApp {
  titulo?: string
  empreendimento?: string
  bairro?: string
  metragem?: number
  valorDiaria?: number
  taxaOcupacaoPerc?: number
  dataSimulacao?: string | Date
  resultados: ResultadosSimulacao
}

export interface DadosParaMensagemPlanoPagamento {
  titulo?: string
  empreendimento?: string
  bairro?: string
  metragem?: number
  dataSimulacao?: string | Date
  resultados: ResultadosSimulacao
}

/**
 * Formata a mensagem de texto formal e profissional para compartilhamento com o cliente
 */
export function formatarMensagemWhatsApp(dados: DadosParaMensagemWhatsApp): string {
  const {
    titulo,
    empreendimento,
    bairro,
    metragem,
    valorDiaria,
    taxaOcupacaoPerc,
    dataSimulacao,
    resultados: res,
  } = dados

  const nomeExibicao = empreendimento || titulo || 'Studio Vitacon'

  // Investimento
  const patrimonio = res?.patrimonioTotal || res?.valorTotalImovel || 0
  const aporteTotal = res?.totalInvestidoAporte || res?.aporteEmObras || 0
  const financ = res?.financiamento

  // Operação mensal
  const diaria =
    valorDiaria ||
    (res?.diasOcupados && res?.faturamentoBrutoMensal
      ? res.faturamentoBrutoMensal / res.diasOcupados
      : 0)
  const ocupacao =
    typeof taxaOcupacaoPerc === 'number'
      ? taxaOcupacaoPerc
      : res?.diasOcupados
        ? Math.round((res.diasOcupados / 30) * 100)
        : 0
  const faturamentoBruto = res?.faturamentoBrutoMensal || 0
  const totalDespesas = res?.totalDespesasMensais || 0
  const sobraLiquida = res?.resultadoLiquidoFinal ?? res?.lucroLiquidoMensal ?? 0

  const rentabMes = res?.rentabilidadeMensalSobreAporte ?? 0
  const rentabAno = res?.rentabilidadeAnualSobreAporte ?? 0
  const payback = res?.paybackAnos

  // Formatação da data
  let dataFormatada = ''
  if (dataSimulacao) {
    const d = typeof dataSimulacao === 'string' ? new Date(dataSimulacao) : dataSimulacao
    if (!isNaN(d.getTime())) {
      dataFormatada = d.toLocaleDateString('pt-BR')
    }
  }
  if (!dataFormatada) {
    dataFormatada = new Date().toLocaleDateString('pt-BR')
  }

  const linhas: string[] = []

  // Título e identificação do empreendimento (sem emojis)
  linhas.push(`SIMULAÇÃO DE RENTABILIDADE — ${nomeExibicao.toUpperCase()}`)
  const detalhesLocalizacao: string[] = []
  if (bairro) detalhesLocalizacao.push(bairro)
  if (metragem && metragem > 0) detalhesLocalizacao.push(`${metragem} m²`)
  if (detalhesLocalizacao.length > 0) {
    linhas.push(`Localização / Tipologia: ${detalhesLocalizacao.join(' • ')}`)
  }
  linhas.push(`Data da simulação: ${dataFormatada}`)

  // Seção INVESTIMENTO
  const linhasInvestimento: string[] = []
  if (patrimonio > 0) {
    linhasInvestimento.push(`• Patrimônio total (com decoração): ${formatCurrency(patrimonio)}`)
  }
  if (aporteTotal > 0) {
    linhasInvestimento.push(`• Aporte do investidor: ${formatCurrency(aporteTotal)}`)
  }
  if (financ && financ.valorFinanciado > 0) {
    let detalheFinanc = `• Financiamento: ${formatCurrency(financ.valorFinanciado)}`
    if (financ.parcelaEfetiva > 0) {
      detalheFinanc += ` (parcela estimada: ${formatCurrency(financ.parcelaEfetiva)}/mês`
      if (financ.sistema) {
        detalheFinanc += ` — ${financ.sistema}`
      }
      detalheFinanc += ')'
    }
    linhasInvestimento.push(detalheFinanc)
  }

  if (linhasInvestimento.length > 0) {
    linhas.push('')
    linhas.push('INVESTIMENTO')
    linhas.push(...linhasInvestimento)
  }

  // Seção OPERAÇÃO MENSAL (SHORT STAY)
  const linhasOperacao: string[] = []
  if (diaria > 0 && ocupacao > 0) {
    linhasOperacao.push(`• Diária média: ${formatCurrency(diaria)} | Ocupação: ${ocupacao}%`)
  } else if (diaria > 0) {
    linhasOperacao.push(`• Diária média: ${formatCurrency(diaria)}`)
  } else if (ocupacao > 0) {
    linhasOperacao.push(`• Ocupação estimada: ${ocupacao}%`)
  }

  if (faturamentoBruto > 0) {
    linhasOperacao.push(`• Receita bruta mensal: ${formatCurrency(faturamentoBruto)}`)
  }
  if (totalDespesas > 0) {
    linhasOperacao.push(`• Custos operacionais e taxa Housi: ${formatCurrency(totalDespesas)}`)
  }
  if (sobraLiquida !== 0 || faturamentoBruto > 0) {
    linhasOperacao.push(`• Sobra líquida no bolso: ${formatCurrency(sobraLiquida)}/mês`)
  }

  if (linhasOperacao.length > 0) {
    linhas.push('')
    linhas.push('OPERAÇÃO MENSAL (SHORT STAY)')
    linhas.push(...linhasOperacao)
  }

  // Seção RETORNO
  const linhasRetorno: string[] = []
  if (rentabMes > 0 || rentabAno > 0) {
    linhasRetorno.push(
      `• Rentabilidade sobre o aporte: ${formatPercent(rentabMes, 2)} a.m. (~${formatPercent(rentabAno, 1)} a.a.)`,
    )
  }
  if (typeof payback === 'number' && !isNaN(payback) && payback > 0 && payback < 90) {
    linhasRetorno.push(`• Payback estimado: ${payback.toFixed(1)} anos`)
  }

  if (linhasRetorno.length > 0) {
    linhas.push('')
    linhas.push('RETORNO')
    linhas.push(...linhasRetorno)
  }

  // Frase final obrigatória com a grafia exata solicitada
  linhas.push('')
  linhas.push('Exemplo enviado através de simulador Gabriel Patrimônio')

  return linhas.join('\n')
}

/**
 * Formata a mensagem formal e profissional do Plano de Pagamento (sem emojis)
 * para envio direto ao cliente no WhatsApp ou cópia para área de transferência.
 */
export function formatarMensagemPlanoPagamento(dados: DadosParaMensagemPlanoPagamento): string {
  const { titulo, empreendimento, bairro, metragem, dataSimulacao, resultados: res } = dados

  const nomeExibicao = empreendimento || titulo || 'Studio Vitacon'

  // Formatação de data
  let dataFormatada = ''
  if (dataSimulacao) {
    const d = typeof dataSimulacao === 'string' ? new Date(dataSimulacao) : dataSimulacao
    if (!isNaN(d.getTime())) {
      dataFormatada = d.toLocaleDateString('pt-BR')
    }
  }
  if (!dataFormatada) {
    dataFormatada = new Date().toLocaleDateString('pt-BR')
  }

  const linhas: string[] = []

  // Cabeçalho
  linhas.push(`PLANO DE PAGAMENTO — ${nomeExibicao.toUpperCase()}`)
  const detalhesLocalizacao: string[] = []
  if (bairro) detalhesLocalizacao.push(bairro)
  if (metragem && metragem > 0) detalhesLocalizacao.push(`${metragem} m²`)
  if (detalhesLocalizacao.length > 0) {
    linhas.push(`Localização / Tipologia: ${detalhesLocalizacao.join(' • ')}`)
  }
  linhas.push(`Data da simulação: ${dataFormatada}`)

  // Valores do Imóvel e Patrimônio
  const valImovel = res?.valorImovelSemDecoracao || res?.valorTotalImovel || 0
  const valDecoracao = res?.valorDecoracao || 0
  const patrimonioTotal = res?.patrimonioTotal || valImovel + valDecoracao

  const linhasValores: string[] = []
  if (valImovel > 0) {
    linhasValores.push(`• Valor da unidade (sem decoração): ${formatCurrency(valImovel)}`)
  }
  if (valDecoracao > 0) {
    linhasValores.push(`• Decoração e mobília completa Housi: ${formatCurrency(valDecoracao)}`)
  }
  if (patrimonioTotal > 0 && (valDecoracao > 0 || valImovel !== patrimonioTotal)) {
    linhasValores.push(`• Patrimônio total: ${formatCurrency(patrimonioTotal)}`)
  }

  if (linhasValores.length > 0) {
    linhas.push('')
    linhas.push('VALOR DO IMÓVEL')
    linhas.push(...linhasValores)
  }

  // Cronograma de Pagamento (Fase de Obras)
  const plano = res?.planoPagamento || []
  const itensObras = plano.filter((p) => p.fase === 'Em Obras' && p.total > 0)
  const configPlano = res?.configPlanoPagamento

  if (itensObras.length > 0) {
    linhas.push('')
    linhas.push('FLUXO DE PAGAMENTO (EM OBRAS)')

    // Prazos Mestres informados na mensagem
    if (configPlano?.mesesAteEntrega) {
      linhas.push(`• Prazo até a entrega das chaves: ${configPlano.mesesAteEntrega} meses`)
    }

    for (const item of itensObras) {
      const serieUpper = item.serie.toUpperCase()
      const percStr = formatPercent(item.percentual, 1)

      if (serieUpper === 'ATO') {
        const linha =
          `• Ato (${percStr}): ${formatCurrency(item.total)}` +
          (item.inicio ? ` (vencimento em ${item.inicio})` : '')
        linhas.push(linha)
      } else if (serieUpper.includes('SINAL') || serieUpper.includes('SINAIS')) {
        let detalhe = `• Sinais (${percStr}): `
        if (item.quantidade > 1) {
          detalhe += `${item.quantidade}x de ${formatCurrency(item.valorParcela)} = ${formatCurrency(item.total)}`
        } else {
          detalhe += formatCurrency(item.total)
        }
        if (item.inicio) detalhe += ` (início em ${item.inicio})`
        linhas.push(detalhe)
      } else if (serieUpper.includes('MENSAIS') || serieUpper.includes('MENSAL')) {
        let detalhe = `• Parcelas mensais (${percStr}): `
        if (item.quantidade > 1) {
          detalhe += `${item.quantidade}x de ${formatCurrency(item.valorParcela)} = ${formatCurrency(item.total)}`
        } else {
          detalhe += formatCurrency(item.total)
        }
        if (item.inicio) detalhe += ` (início em ${item.inicio})`
        linhas.push(detalhe)
      } else if (serieUpper.includes('ANUAIS') || serieUpper.includes('ANUAL')) {
        let detalhe = `• Balões anuais (${percStr}): `
        if (item.quantidade > 1) {
          detalhe += `${item.quantidade}x de ${formatCurrency(item.valorParcela)} = ${formatCurrency(item.total)}`
        } else {
          detalhe += formatCurrency(item.total)
        }
        if (item.inicio) detalhe += ` (vencimento a partir de ${item.inicio})`
        linhas.push(detalhe)
      } else if (serieUpper.includes('ÚNICA') || serieUpper.includes('UNICA')) {
        const linha =
          `• Parcela única (${percStr}): ${formatCurrency(item.total)}` +
          (item.inicio ? ` (vencimento em ${item.inicio})` : '')
        linhas.push(linha)
      } else {
        // Outra série qualquer configurada
        let detalhe = `• ${item.serie} (${percStr}): `
        if (item.quantidade > 1) {
          detalhe += `${item.quantidade}x de ${formatCurrency(item.valorParcela)} = ${formatCurrency(item.total)}`
        } else {
          detalhe += formatCurrency(item.total)
        }
        if (item.inicio) detalhe += ` (início em ${item.inicio})`
        linhas.push(detalhe)
      }
    }

    // Total pago até as chaves
    const percChaves = res?.percentualAteChaves ?? 30
    const montanteChaves = res?.montanteAteChaves || valImovel * (percChaves / 100)
    if (montanteChaves > 0) {
      linhas.push(
        `• Total pago até as chaves (${formatPercent(percChaves, 1)}): ${formatCurrency(montanteChaves)}`,
      )
    }
  }
  // Quitação na Entrega / Financiamento
  const saldoFinanciar = res?.saldoRestanteFinanciar || 0
  const financ = res?.financiamento
  const percFinanc = 100 - (res?.percentualAteChaves ?? 30)

  const linhasQuitacao: string[] = []
  if (saldoFinanciar > 0) {
    linhasQuitacao.push(
      `• Saldo a financiar na entrega (${percFinanc}%): ${formatCurrency(saldoFinanciar)}`,
    )
  }

  if (financ && financ.valorFinanciado > 0) {
    if (financ.sistema) {
      linhasQuitacao.push(`• Sistema de amortização: ${financ.sistema}`)
    }
    if (financ.taxaJurosMensalPerc && financ.taxaJurosMensalPerc > 0) {
      const taxaAnualAprox =
        Math.round((Math.pow(1 + financ.taxaJurosMensalPerc / 100, 12) - 1) * 1000) / 10
      linhasQuitacao.push(
        `• Taxa de juros estimada: ${formatPercent(taxaAnualAprox, 1)} a.a. (~${formatPercent(financ.taxaJurosMensalPerc, 2)} a.m.)`,
      )
    }
    if (financ.prazoMeses && financ.prazoMeses > 0) {
      const anos = Math.round(financ.prazoMeses / 12)
      linhasQuitacao.push(`• Prazo do financiamento: ${financ.prazoMeses} meses (${anos} anos)`)
    }
    if (financ.primeiraParcela && financ.primeiraParcela > 0) {
      if (financ.sistema === 'SAC' && financ.ultimaParcela && financ.ultimaParcela > 0) {
        linhasQuitacao.push(
          `• 1ª parcela estimada: ${formatCurrency(financ.primeiraParcela)}/mês (decrescente até ${formatCurrency(financ.ultimaParcela)})`,
        )
      } else {
        linhasQuitacao.push(
          `• Parcela mensal estimada: ${formatCurrency(financ.primeiraParcela)}/mês`,
        )
      }
    } else if (financ.parcelaEfetiva && financ.parcelaEfetiva > 0) {
      linhasQuitacao.push(`• Parcela mensal estimada: ${formatCurrency(financ.parcelaEfetiva)}/mês`)
    }
  }

  if (linhasQuitacao.length > 0) {
    linhas.push('')
    linhas.push('QUITAÇÃO NA ENTREGA DAS CHAVES')
    linhas.push(...linhasQuitacao)
  }

  // Observação sobre a decoração Housi (se houver)
  if (valDecoracao > 0) {
    linhas.push('')
    linhas.push('MOBÍLIA E DECORAÇÃO')
    linhas.push(
      `• Kit de decoração completa Housi: ${formatCurrency(valDecoracao)} (adicionado ao fluxo para operação em short stay)`,
    )
  }

  // Frase final obrigatória com a grafia exata solicitada
  linhas.push('')
  linhas.push('Exemplo enviado através de simulador Gabriel Patrimônio')

  return linhas.join('\n')
}

/**
 * Converte um SimulacaoRecord completo em DadosParaMensagemWhatsApp
 */
export function extrairDadosDeSimulacaoRecord(sim: SimulacaoRecord): DadosParaMensagemWhatsApp {
  return {
    titulo: sim.titulo,
    empreendimento: sim.empreendimento,
    bairro: sim.bairro,
    metragem: sim.metragem,
    valorDiaria: sim.valor_diaria,
    taxaOcupacaoPerc: Math.round(sim.taxa_ocupacao * 100),
    dataSimulacao: sim.created,
    resultados: sim.resultados,
  }
}

/**
 * Converte um SimulacaoRecord em DadosParaMensagemPlanoPagamento
 */
export function extrairDadosPlanoDeSimulacaoRecord(
  sim: SimulacaoRecord,
): DadosParaMensagemPlanoPagamento {
  return {
    titulo: sim.titulo,
    empreendimento: sim.empreendimento,
    bairro: sim.bairro,
    metragem: sim.metragem,
    dataSimulacao: sim.created,
    resultados: sim.resultados,
  }
}

/**
 * Abre o WhatsApp diretamente com o texto montado
 */
export function abrirWhatsAppComTexto(texto: string, numeroTelefone?: string): void {
  const cleanPhone = (numeroTelefone || '').replace(/\D/g, '')
  const base = cleanPhone ? `https://wa.me/${cleanPhone}` : 'https://wa.me/'
  const url = `${base}?text=${encodeURIComponent(texto)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Copia o texto para a área de transferência com fallback
 */
export async function copiarTextoParaClipboard(texto: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto)
      return true
    }
  } catch (err) {
    console.warn('Clipboard API falhou, tentando fallback', err)
  }

  try {
    const textArea = document.createElement('textarea')
    textArea.value = texto
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error('Fallback de cópia falhou', err)
    return false
  }
}
