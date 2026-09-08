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

/**
 * Formata a mensagem de texto com layout amigável para envio ao cliente via WhatsApp
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

  const nomeExibicao = empreendimento || titulo || 'Vitacon'

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

  // Cabeçalho
  linhas.push(`🏠 *Simulação Vitacon* — ${nomeExibicao}`)
  if (bairro) {
    linhas.push(`📍 ${bairro}${metragem ? ` • ${metragem} m²` : ''}`)
  } else if (metragem) {
    linhas.push(`📐 Studio: ${metragem} m²`)
  }

  linhas.push('')
  linhas.push('💰 *Investimento*')
  if (patrimonio > 0) {
    linhas.push(`• Patrimônio total (c/ decoração): ${formatCurrency(patrimonio)}`)
  }
  if (aporteTotal > 0) {
    linhas.push(`• Aporte do investidor: ${formatCurrency(aporteTotal)}`)
  }
  if (financ && financ.valorFinanciado > 0) {
    const parcelaStr =
      financ.parcelaEfetiva > 0
        ? ` (parcela ~${formatCurrency(financ.parcelaEfetiva)}/mês, ${financ.sistema})`
        : ''
    linhas.push(`• Financiamento: ${formatCurrency(financ.valorFinanciado)}${parcelaStr}`)
  }

  linhas.push('')
  linhas.push('📈 *Operação mensal (short stay)*')
  if (diaria > 0 || ocupacao > 0) {
    linhas.push(`• Diária média: ${formatCurrency(diaria)} | Ocupação: ${ocupacao}%`)
  }
  if (faturamentoBruto > 0) {
    linhas.push(`• Receita bruta: ${formatCurrency(faturamentoBruto)}`)
  }
  if (totalDespesas > 0) {
    linhas.push(`• Custos + administração Housi: ${formatCurrency(totalDespesas)}`)
  }
  linhas.push(`• Sobra líquida no bolso: *${formatCurrency(sobraLiquida)}/mês*`)

  linhas.push('')
  linhas.push(
    `✅ *Rentabilidade sobre o aporte:* ${formatPercent(rentabMes, 2)} a.m. (~${formatPercent(rentabAno, 1)} a.a.)`,
  )

  if (typeof payback === 'number' && payback > 0 && payback < 90) {
    linhas.push(`⏱ Payback estimado: ${payback.toFixed(1)} anos`)
  }

  linhas.push('')
  linhas.push(`_Simulado em ${dataFormatada} via Simulador Vitacon._`)

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
