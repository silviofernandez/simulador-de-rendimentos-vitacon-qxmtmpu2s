import pb from '@/lib/pocketbase/client'
import { MidiaRecord } from '@/types/simulador'

export async function listarMidias(categoria?: string): Promise<MidiaRecord[]> {
  const filter =
    categoria && categoria !== 'Todas' ? `categoria = "${categoria.replace(/"/g, '\\"')}"` : ''

  const records = await pb.collection('midias').getFullList<MidiaRecord>({
    filter,
    sort: '-created',
  })
  return records
}

export async function criarMidia(formData: FormData): Promise<MidiaRecord> {
  const record = await pb.collection('midias').create<MidiaRecord>(formData)
  return record
}

export async function excluirMidia(id: string): Promise<boolean> {
  await pb.collection('midias').delete(id)
  return true
}

export function obterUrlMidia(record: MidiaRecord, filename?: string): string {
  const file = filename || record.arquivo
  if (!file) return ''
  return pb.files.getURL(record, file)
}
