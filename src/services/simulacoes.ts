import pb from '@/lib/pocketbase/client'
import { SimulacaoRecord } from '@/types/simulador'

export async function listarSimulacoes(): Promise<SimulacaoRecord[]> {
  try {
    const records = await pb.collection('simulacoes').getFullList<SimulacaoRecord>({
      sort: '-created',
      requestKey: null,
    })
    return records
  } catch (error) {
    console.error('Erro ao listar simulações:', error)
    return []
  }
}

export async function criarSimulacao(
  dados: Omit<SimulacaoRecord, 'id' | 'created' | 'updated'>,
): Promise<SimulacaoRecord> {
  const record = await pb.collection('simulacoes').create<SimulacaoRecord>(dados)
  return record
}

export async function excluirSimulacao(id: string): Promise<boolean> {
  try {
    await pb.collection('simulacoes').delete(id)
    return true
  } catch (error) {
    console.error('Erro ao excluir simulação:', error)
    return false
  }
}

export async function duplicarSimulacao(simulacao: SimulacaoRecord): Promise<SimulacaoRecord> {
  const dados = {
    user: pb.authStore.record?.id || simulacao.user,
    titulo: `${simulacao.titulo || 'Simulação'} (Cópia)`,
    empreendimento: simulacao.empreendimento,
    bairro: simulacao.bairro,
    endereco: simulacao.endereco,
    valor_m2: simulacao.valor_m2,
    metragem: simulacao.metragem,
    valor_diaria: simulacao.valor_diaria,
    taxa_ocupacao: simulacao.taxa_ocupacao,
    custos_operacionais: simulacao.custos_operacionais,
    valorizacao_obra: simulacao.valorizacao_obra,
    resultados: simulacao.resultados,
  }
  return await pb.collection('simulacoes').create<SimulacaoRecord>(dados)
}
