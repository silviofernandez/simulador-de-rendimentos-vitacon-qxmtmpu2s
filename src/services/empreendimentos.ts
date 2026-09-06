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
