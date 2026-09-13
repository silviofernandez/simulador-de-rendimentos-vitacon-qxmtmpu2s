import pb from '@/lib/pocketbase/client'
import { TipologiaUnidade, StatusUnidade } from '@/types/simulador'

export interface UnidadeExtraida {
  unidade: string
  andar?: number
  tipologia: TipologiaUnidade
  metragem: number
  valor: number
  status: StatusUnidade
  valor_diaria?: number
  observacoes?: string
  selecionada?: boolean
}

export interface ExtracaoResult {
  sucesso: boolean
  unidades: UnidadeExtraida[]
  total: number
  dataEntregaChaves?: string | null
  mesesAteEntrega?: number
  detalhesChaves?: string | null
  resumo?: string
  aviso?: string
  rawText?: string
}

/**
 * Normaliza string de valor em moeda brasileira ou padrão americano
 * Ex: "R$ 435.000,00" -> 435000, "1.234.567,89" -> 1234567.89, "1234567.89" -> 1234567.89
 */
export function normalizarValorMoeda(str: string | number | undefined | null): number {
  if (typeof str === 'number') return isNaN(str) ? 0 : str
  if (!str) return 0
  const clean = String(str).trim()
  if (!clean) return 0

  // Se já for numérico direto como "435000" ou "435000.5"
  if (/^-?\d+(\.\d+)?$/.test(clean)) {
    return parseFloat(clean) || 0
  }

  // Padrão brasileiro: "435.000,00" ou "R$ 435.000,00"
  if (clean.includes(',')) {
    const semPontos = clean.replace(/[^\d,-]/g, '').replace(/\./g, '')
    const comPonto = semPontos.replace(',', '.')
    return parseFloat(comPonto) || 0
  }

  // Padrão com ponto decimal ou separador: "435,000.00"
  const semSimbolos = clean.replace(/[^\d.-]/g, '')
  return parseFloat(semSimbolos) || 0
}

/**
 * Normaliza metragem em número float (m²)
 * Ex: "20,55 m²" -> 20.55, "20.55" -> 20.55
 */
export function normalizarMetragem(str: string | number | undefined | null): number {
  if (typeof str === 'number') return isNaN(str) ? 0 : str
  if (!str) return 0
  const clean = String(str)
    .replace(/[^\d.,]/g, '')
    .trim()
  if (!clean) return 0
  if (clean.includes(',')) {
    return parseFloat(clean.replace(',', '.')) || 0
  }
  return parseFloat(clean) || 0
}

/**
 * Normaliza a tipologia em um dos 4 padrões aceitos pela Vitacon
 */
export function normalizarTipologia(str: string | undefined | null): TipologiaUnidade {
  if (!str) return 'NR'
  const s = str.toUpperCase().trim()
  if (s.includes('R2V') || s.includes('RESID')) return 'R2V'
  if (s.includes('HIS')) return 'HIS'
  if (s.includes('HMP')) return 'HMP'
  if (s.includes('NR') || s.includes('NÃO RESID') || s.includes('NAO RESID')) return 'NR'
  return 'NR'
}

/**
 * Normaliza o status da unidade
 */
export function normalizarStatus(str: string | undefined | null): StatusUnidade {
  if (!str) return 'disponivel'
  const s = str.toLowerCase().trim()
  if (s.includes('vend') || s.includes('sold')) return 'vendida'
  if (s.includes('res')) return 'reservada'
  return 'disponivel'
}

/**
 * Dedução do andar com base no número da unidade (ex: 401 -> 4, 1205 -> 12, 102 -> 1)
 */
export function deduzirAndar(unidadeStr: string): number | undefined {
  const match = unidadeStr.match(/\d+/)
  if (!match) return undefined
  const num = parseInt(match[0], 10)
  if (num < 100) return undefined
  if (num >= 100 && num < 1000) {
    return Math.floor(num / 100)
  }
  if (num >= 1000 && num < 100000) {
    return Math.floor(num / 100)
  }
  return undefined
}

/**
 * Parser client-side de texto puro tabulado/CSV/espaçado
 * Útil como fallback imediato ou para colar texto copiado
 */
export function parseTextoParaUnidades(texto: string): UnidadeExtraida[] {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const resultado: UnidadeExtraida[] = []

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i]

    // Ignorar linhas de cabeçalho
    const lower = linha.toLowerCase()
    if (
      (lower.includes('unidade') ||
        lower.includes('andar') ||
        lower.includes('tipologia') ||
        lower.includes('metragem')) &&
      i < 3
    ) {
      continue
    }

    // Tentar separar por TAB
    let partes = linha.split('\t')
    if (partes.length < 3) partes = linha.split(';')
    if (partes.length < 3) partes = linha.split(',')
    if (partes.length < 3) partes = linha.split(/\s{2,}/)

    const clean = partes.map((p) => p.trim())
    if (clean.length < 2) continue

    const uNum = clean[0]
    if (!uNum || uNum.length > 15) continue

    // Andar pode ser a coluna 1 ou inferido
    let andar: number | undefined = undefined
    let tipologia: TipologiaUnidade = 'NR'
    let metragem = 20
    let valor = 0
    let status: StatusUnidade = 'disponivel'
    let obs = ''

    if (clean.length >= 5) {
      // Formato: Unidade | Andar | Tipologia | Metragem | Valor | (Status)
      andar = parseInt(clean[1], 10) || deduzirAndar(uNum)
      tipologia = normalizarTipologia(clean[2])
      metragem = normalizarMetragem(clean[3]) || 20
      valor = normalizarValorMoeda(clean[4])
      if (clean[5]) status = normalizarStatus(clean[5])
      if (clean[6]) obs = clean[6]
    } else if (clean.length === 4) {
      // Formato: Unidade | Tipologia | Metragem | Valor
      andar = deduzirAndar(uNum)
      tipologia = normalizarTipologia(clean[1])
      metragem = normalizarMetragem(clean[2]) || 20
      valor = normalizarValorMoeda(clean[3])
    } else if (clean.length === 3) {
      // Formato: Unidade | Metragem | Valor
      andar = deduzirAndar(uNum)
      metragem = normalizarMetragem(clean[1]) || 20
      valor = normalizarValorMoeda(clean[2])
    }

    resultado.push({
      unidade: uNum,
      andar,
      tipologia,
      metragem,
      valor,
      status,
      observacoes: obs,
      selecionada: true,
    })
  }

  return resultado
}

/**
 * Envia o arquivo para a API do backend (/backend/v1/documentos/extrair-unidades)
 * que utiliza $documents.toMarkdown + $ai.chat para interpretar tabelas de PDF, XLSX e CSV.
 */
export async function extrairUnidadesDeArquivo(file: File): Promise<ExtracaoResult> {
  const formData = new FormData()
  formData.append('arquivo', file)

  try {
    const res = await pb.send('/backend/v1/documentos/extrair-unidades', {
      method: 'POST',
      body: formData,
    })

    if (res && res.sucesso && Array.isArray(res.unidades)) {
      const mapeadas: UnidadeExtraida[] = res.unidades.map((u: Record<string, unknown>) => ({
        unidade: String(u.unidade || '').trim(),
        andar: typeof u.andar === 'number' ? u.andar : deduzirAndar(String(u.unidade || '')),
        tipologia: normalizarTipologia(String(u.tipologia || '')),
        metragem:
          typeof u.metragem === 'number'
            ? u.metragem
            : normalizarMetragem(String(u.metragem || '')),
        valor: typeof u.valor === 'number' ? u.valor : normalizarValorMoeda(String(u.valor || '')),
        status: normalizarStatus(String(u.status || '')),
        valor_diaria: typeof u.valor_diaria === 'number' ? u.valor_diaria : undefined,
        observacoes: u.observacoes ? String(u.observacoes) : '',
        selecionada: true,
      }))

      return {
        sucesso: true,
        unidades: mapeadas,
        total: mapeadas.length,
        dataEntregaChaves: res.dataEntregaChaves,
        mesesAteEntrega: res.mesesAteEntrega,
        detalhesChaves: res.detalhesChaves,
        resumo: res.resumo || `${mapeadas.length} unidades encontradas`,
        aviso: res.truncated
          ? 'O arquivo é grande e algumas páginas finais podem não ter sido lidas.'
          : undefined,
        rawText: res.rawTextPreview,
      }
    }

    // Se a IA não gerou JSON mas devolveu rawText, tenta o parser client-side no texto
    if (res && res.rawText) {
      const parsedLocal = parseTextoParaUnidades(res.rawText)
      if (parsedLocal.length > 0) {
        return {
          sucesso: true,
          unidades: parsedLocal,
          total: parsedLocal.length,
          resumo: `${parsedLocal.length} unidades interpretadas a partir do texto do documento`,
          rawText: res.rawText,
        }
      }
      return {
        sucesso: false,
        unidades: [],
        total: 0,
        aviso: res.aviso || 'Não foi possível extrair a tabela estruturada deste documento.',
        rawText: res.rawText,
      }
    }

    return {
      sucesso: false,
      unidades: [],
      total: 0,
      aviso: res.error || res.aviso || 'Não foi possível interpretar o arquivo.',
    }
  } catch (err: unknown) {
    console.error('Erro na extração de unidades:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return {
      sucesso: false,
      unidades: [],
      total: 0,
      aviso: `Falha ao processar o arquivo: ${msg}`,
    }
  }
}
