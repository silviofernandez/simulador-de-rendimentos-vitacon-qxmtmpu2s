import pb from '@/lib/pocketbase/client'
import { UserRecord } from '@/types/simulador'

export async function listarUsuarios(): Promise<UserRecord[]> {
  const records = await pb.collection('users').getFullList<UserRecord>({
    sort: '-created',
  })
  return records
}

export async function criarUsuarioAdmin(dados: {
  name: string
  email: string
  password: string
  role?: 'admin' | 'corretor' | 'investidor'
}): Promise<UserRecord> {
  const record = await pb.collection('users').create<UserRecord>({
    name: dados.name,
    email: dados.email,
    password: dados.password,
    passwordConfirm: dados.password,
    role: dados.role || 'corretor',
    is_active: true,
  })
  return record
}

export async function alternarStatusUsuario(id: string, is_active: boolean): Promise<UserRecord> {
  const record = await pb.collection('users').update<UserRecord>(id, {
    is_active,
  })
  return record
}

/**
 * Gera uma senha forte e legível (ex: Vitacon@2026$Xk)
 */
export function gerarSenhaForte(): string {
  const prefixos = ['Vit@con', 'Smart', 'Living', 'Invest', 'Studio']
  const sulfixos = ['2026', '2027', '789', '456', '321']
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!#$'

  const p = prefixos[Math.floor(Math.random() * prefixos.length)]
  const s = sulfixos[Math.floor(Math.random() * sulfixos.length)]
  let extra = ''
  for (let i = 0; i < 3; i++) {
    extra += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${p}@${s}${extra}`
}
