import pb from '@/lib/pocketbase/client'
import { UnidadeRecord, TipologiaUnidade, StatusUnidade } from '@/types/simulador'

export async function listarUnidades(empreendimento?: string): Promise<UnidadeRecord[]> {
  const filter = empreendimento ? `empreendimento = "${empreendimento.replace(/"/g, '\\"')}"` : ''

  const records = await pb.collection('unidades').getFullList<UnidadeRecord>({
    filter,
    sort: '+andar,+unidade',
  })
  return records
}

export async function criarUnidade(
  dados: Omit<UnidadeRecord, 'id' | 'created' | 'updated'>,
): Promise<UnidadeRecord> {
  const record = await pb.collection('unidades').create<UnidadeRecord>(dados)
  return record
}

export async function atualizarUnidade(
  id: string,
  dados: Partial<UnidadeRecord>,
): Promise<UnidadeRecord> {
  const record = await pb.collection('unidades').update<UnidadeRecord>(id, dados)
  return record
}

export async function excluirUnidade(id: string): Promise<boolean> {
  await pb.collection('unidades').delete(id)
  return true
}

export interface ImportResult {
  sucesso: number
  falhas: number
  erros: string[]
}

export interface SalvarUnidadesLoteOptions {
  substituirExistentes?: boolean
}

/**
 * Salva uma lista estruturada de unidades (já revisada pelo usuário),
 * com opção de substituir todas as existentes do empreendimento ou fazer upsert.
 */
export async function salvarListaUnidadesEmpreendimento(
  empreendimento: string,
  unidades: Array<{
    unidade: string
    andar?: number
    tipologia: TipologiaUnidade
    metragem: number
    valor: number
    status?: StatusUnidade
    valor_diaria?: number
    observacoes?: string
  }>,
  options: SalvarUnidadesLoteOptions = {},
): Promise<ImportResult> {
  const empNome = empreendimento.trim()
  let sucesso = 0
  let falhas = 0
  const erros: string[] = []

  // Se solicitado substituir existentes, remove as unidades anteriores deste empreendimento
  if (options.substituirExistentes) {
    try {
      const anteriores = await pb.collection('unidades').getFullList<UnidadeRecord>({
        filter: `empreendimento = "${empNome.replace(/"/g, '\\"')}"`,
      })
      for (const ant of anteriores) {
        try {
          await pb.collection('unidades').delete(ant.id)
        } catch (e) {
          console.warn('Erro ao remover unidade antiga', ant.id, e)
        }
      }
    } catch (e) {
      console.warn('Erro ao limpar unidades anteriores', e)
    }
  }

  // Buscar mapa de existentes atuais se não substituiu tudo
  const existentes = options.substituirExistentes
    ? []
    : await pb.collection('unidades').getFullList<UnidadeRecord>({
        filter: `empreendimento = "${empNome.replace(/"/g, '\\"')}"`,
      })
  const existentesMap = new Map<string, string>()
  existentes.forEach((u) => existentesMap.set(u.unidade.trim().toUpperCase(), u.id))

  for (let i = 0; i < unidades.length; i++) {
    const u = unidades[i]
    const uNum = u.unidade.trim()
    if (!uNum) {
      falhas++
      erros.push(`Linha ${i + 1}: número de unidade vazio`)
      continue
    }

    try {
      const existingId = existentesMap.get(uNum.toUpperCase())
      const dados = {
        empreendimento: empNome,
        unidade: uNum,
        andar: u.andar,
        tipologia: u.tipologia,
        metragem: u.metragem,
        valor: u.valor,
        status: u.status || 'disponivel',
        valor_diaria: u.valor_diaria,
        observacoes: u.observacoes || '',
      }

      if (existingId) {
        await pb.collection('unidades').update(existingId, dados)
      } else {
        const created = await pb.collection('unidades').create<UnidadeRecord>(dados)
        existentesMap.set(uNum.toUpperCase(), created.id)
      }
      sucesso++
    } catch (err: unknown) {
      falhas++
      const msg = err instanceof Error ? err.message : String(err)
      erros.push(`Unidade ${uNum}: ${msg}`)
    }
  }

  return { sucesso, falhas, erros }
}

/**
 * Faz parse de texto tabulado ou com ponto-e-vírgula/vírgula contendo:
 * Unidade, Andar, Tipologia, Metragem, Valor, Status (opcional)
 */
export async function importarUnidadesEmLote(
  empreendimento: string,
  linhasTexto: string,
): Promise<ImportResult> {
  const linhas = linhasTexto
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  let sucesso = 0
  let falhas = 0
  const erros: string[] = []

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i]

    // Ignorar cabeçalho se houver
    if (
      i === 0 &&
      (linha.toLowerCase().includes('unidade') ||
        linha.toLowerCase().includes('andar') ||
        linha.toLowerCase().includes('tipologia'))
    ) {
      continue
    }

    // Tentar separar por TAB, ;, ou vírgula
    let partes = linha.split('\t')
    if (partes.length < 3) {
      partes = linha.split(';')
    }
    if (partes.length < 3) {
      partes = linha.split(',')
    }

    // Se ainda não separou, tentar múltiplos espaços
    if (partes.length < 3) {
      partes = linha.split(/\s{2,}/)
    }

    const clean = partes.map((p) => p.trim())
    if (clean.length < 4) {
      falhas++
      erros.push(`Linha ${i + 1}: formato insuficiente ("${linha}")`)
      continue
    }

    try {
      const unidadeNum = clean[0]
      const andarNum = parseInt(clean[1], 10) || undefined

      // Normaliza tipologia
      let tipoRaw = clean[2].toUpperCase().trim()
      let tipologia: 'R2V' | 'NR' | 'HIS' | 'HMP' = 'NR'
      if (tipoRaw.includes('R2V') || tipoRaw.includes('RESIDENCIAL')) {
        tipologia = 'R2V'
      } else if (tipoRaw.includes('HIS')) {
        tipologia = 'HIS'
      } else if (tipoRaw.includes('HMP')) {
        tipologia = 'HMP'
      } else if (tipoRaw.includes('NR')) {
        tipologia = 'NR'
      }

      // Metragem
      const metragemStr = clean[3].replace(/[^\d.,]/g, '').replace(',', '.')
      const metragem = parseFloat(metragemStr) || 25

      // Valor
      const valorStr = clean[4]
        ? clean[4]
            .replace(/[^\d.,]/g, '')
            .replace(/\.(?=\d{3})/g, '')
            .replace(',', '.')
        : '0'
      const valor = parseFloat(valorStr) || 0

      // Status opcional
      let status: 'disponivel' | 'reservada' | 'vendida' = 'disponivel'
      if (clean[5]) {
        const s = clean[5].toLowerCase()
        if (s.includes('vend') || s.includes('sold')) status = 'vendida'
        else if (s.includes('res')) status = 'reservada'
      }

      // Upsert: verifica se já existe
      const filtro = `empreendimento = "${empreendimento.replace(/"/g, '\\"')}" && unidade = "${unidadeNum.replace(/"/g, '\\"')}"`
      const existentes = await pb.collection('unidades').getList<UnidadeRecord>(1, 1, {
        filter: filtro,
      })

      if (existentes.items.length > 0) {
        await pb.collection('unidades').update(existentes.items[0].id, {
          andar: andarNum,
          tipologia,
          metragem,
          valor,
          status,
        })
      } else {
        await pb.collection('unidades').create({
          empreendimento,
          unidade: unidadeNum,
          andar: andarNum,
          tipologia,
          metragem,
          valor,
          status,
        })
      }

      sucesso++
    } catch (err: unknown) {
      falhas++
      const msg = err instanceof Error ? err.message : String(err)
      erros.push(`Linha ${i + 1}: ${msg}`)
    }
  }

  return { sucesso, falhas, erros }
}
