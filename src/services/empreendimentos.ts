import pb from '@/lib/pocketbase/client'
import { EmpreendimentoRecord } from '@/types/simulador'

export async function listarEmpreendimentos(): Promise<EmpreendimentoRecord[]> {
  try {
    const records = await pb.collection('empreendimentos').getFullList<EmpreendimentoRecord>({
      sort: 'nome',
      requestKey: null,
    })
    return records
  } catch (error) {
    console.error('Erro ao listar empreendimentos:', error)
    return []
  }
}

export async function obterEmpreendimentoPorId(id: string): Promise<EmpreendimentoRecord | null> {
  try {
    const record = await pb.collection('empreendimentos').getOne<EmpreendimentoRecord>(id)
    return record
  } catch (error) {
    console.error('Erro ao obter empreendimento:', error)
    return null
  }
}

export async function criarEmpreendimento(
  dados: Omit<EmpreendimentoRecord, 'id' | 'created' | 'updated'>,
): Promise<EmpreendimentoRecord> {
  const record = await pb.collection('empreendimentos').create<EmpreendimentoRecord>(dados)
  return record
}

export async function atualizarEmpreendimento(
  id: string,
  dados: Partial<EmpreendimentoRecord>,
): Promise<EmpreendimentoRecord> {
  const record = await pb.collection('empreendimentos').update<EmpreendimentoRecord>(id, dados)
  return record
}

export async function excluirEmpreendimento(id: string): Promise<boolean> {
  await pb.collection('empreendimentos').delete(id)
  return true
}
