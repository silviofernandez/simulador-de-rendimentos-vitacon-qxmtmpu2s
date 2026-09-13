import React, { useState, useEffect } from 'react'
import {
  listarUsuarios,
  criarUsuarioAdmin,
  alternarStatusUsuario,
  gerarSenhaForte,
} from '@/services/usuarios'
import { UserRecord } from '@/types/simulador'
import {
  formatarMensagemCredenciaisWhatsApp,
  abrirWhatsAppComTexto,
  copiarTextoParaClipboard,
} from '@/lib/whatsapp'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Users,
  UserPlus,
  RefreshCw,
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  Power,
  Search,
} from 'lucide-react'

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Form states
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [telefone, setTelefone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dialog de sucesso com credenciais prontas para WhatsApp
  const [sucessoModalOpen, setSucessoModalOpen] = useState(false)
  const [credenciaisGeradas, setCredenciaisGeradas] = useState<{
    nome: string
    email: string
    senha: string
    telefone?: string
  } | null>(null)
  const [copiado, setCopiado] = useState(false)

  const carregarUsuarios = async () => {
    try {
      setIsLoading(true)
      const data = await listarUsuarios()
      setUsuarios(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao listar usuários.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const handleGerarSenha = () => {
    const s = gerarSenhaForte()
    setSenha(s)
    toast.info('Senha forte gerada.')
  }

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }
    if (senha.length < 8) {
      toast.error('A senha deve possuir pelo menos 8 caracteres.')
      return
    }

    try {
      setIsSubmitting(true)
      await criarUsuarioAdmin({
        name: nome.trim(),
        email: email.trim(),
        password: senha.trim(),
        role: 'corretor',
      })

      // Armazena credenciais para o modal de compartilhamento WhatsApp
      setCredenciaisGeradas({
        nome: nome.trim(),
        email: email.trim(),
        senha: senha.trim(),
        telefone: telefone.trim(),
      })
      setSucessoModalOpen(true)

      // Limpa formulário
      setNome('')
      setEmail('')
      setSenha('')
      setTelefone('')

      toast.success('Novo usuário criado com sucesso!')
      carregarUsuarios()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Erro ao criar usuário. E-mail já em uso?'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAlternarStatus = async (user: UserRecord) => {
    if (user.email === 'gabsilvio@gmail.com') {
      toast.error('O administrador principal não pode ser desativado.')
      return
    }
    const novoStatus = !(user.is_active ?? true)
    try {
      await alternarStatusUsuario(user.id, novoStatus)
      setUsuarios((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: novoStatus } : u)),
      )
      toast.success(`Usuário ${user.name} ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao atualizar status do usuário.')
    }
  }

  const handleEnviarWhatsAppCredenciais = () => {
    if (!credenciaisGeradas) return
    const texto = formatarMensagemCredenciaisWhatsApp({
      nome: credenciaisGeradas.nome,
      email: credenciaisGeradas.email,
      senha: credenciaisGeradas.senha,
    })
    abrirWhatsAppComTexto(texto, credenciaisGeradas.telefone)
    toast.success('Abrindo WhatsApp com as credenciais...')
  }

  const handleCopiarMensagemCredenciais = async () => {
    if (!credenciaisGeradas) return
    const texto = formatarMensagemCredenciaisWhatsApp({
      nome: credenciaisGeradas.nome,
      email: credenciaisGeradas.email,
      senha: credenciaisGeradas.senha,
    })
    const ok = await copiarTextoParaClipboard(texto)
    if (ok) {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
      toast.success('Texto copiado para a área de transferência!')
    }
  }

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DFD6] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2A24]">
              Gestão de Usuários
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0F6B4F]/10 px-2.5 py-0.5 text-xs font-bold text-[#0F6B4F]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Área do Administrador
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5E6E64] mt-1">
            Controle de acessos exclusivo. Novos usuários são cadastrados aqui e recebem as
            credenciais diretamente pelo WhatsApp.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={carregarUsuarios}
          disabled={isLoading}
          className="rounded-xl border-[#E3DFD6] text-xs font-semibold gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulário de Criação (5 Colunas) */}
        <div className="lg:col-span-5">
          <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-[#E3DFD6]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F6B4F]/10 text-[#0F6B4F]">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-[#1F2A24]">
                    Novo Usuário
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5E6E64]">
                    Defina as credenciais para envio via WhatsApp
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleCriarUsuario} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="user-name" className="text-xs font-semibold text-[#1F2A24]">
                    Nome Completo *
                  </Label>
                  <Input
                    id="user-name"
                    placeholder="Ex: Carlos Eduardo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="h-10 rounded-xl border-[#E3DFD6] text-xs focus-visible:ring-[#0F6B4F]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="user-email" className="text-xs font-semibold text-[#1F2A24]">
                    E-mail de Login *
                  </Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="carlos@vitacon.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 rounded-xl border-[#E3DFD6] text-xs focus-visible:ring-[#0F6B4F]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="user-pass" className="text-xs font-semibold text-[#1F2A24]">
                      Senha de Acesso *
                    </Label>
                    <button
                      type="button"
                      onClick={handleGerarSenha}
                      className="text-[11px] font-semibold text-[#0F6B4F] hover:underline flex items-center gap-1"
                    >
                      <KeyRound className="h-3 w-3" />
                      Gerar Senha Forte
                    </button>
                  </div>
                  <Input
                    id="user-pass"
                    type="text"
                    placeholder="Mínimo 8 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="h-10 rounded-xl border-[#E3DFD6] text-xs font-mono focus-visible:ring-[#0F6B4F]"
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="user-phone" className="text-xs font-semibold text-[#1F2A24]">
                    WhatsApp do Usuário (opcional)
                  </Label>
                  <Input
                    id="user-phone"
                    type="tel"
                    placeholder="Ex: 11999998888 (com DDD)"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="h-10 rounded-xl border-[#E3DFD6] text-xs focus-visible:ring-[#0F6B4F]"
                  />
                  <span className="text-[10px] text-[#5E6E64] block">
                    Se preenchido, abre diretamente o chat da pessoa ao concluir.
                  </span>
                </div>

                <div className="rounded-xl bg-[#F7F5F1] p-3 border border-[#E3DFD6] text-xs text-[#5E6E64] space-y-1">
                  <p className="font-semibold text-[#1F2A24]">Envio de Credenciais:</p>
                  <p className="text-[11px]">
                    Não há envio automático por e-mail. Ao clicar em "Criar e Gerar WhatsApp", uma
                    mensagem formatada profissionalmente será gerada para envio imediato.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white font-semibold text-xs shadow-md shadow-[#0F6B4F]/20"
                >
                  {isSubmitting ? 'Cadastrando...' : 'Criar e Gerar WhatsApp'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Listagem de Usuários (7 Colunas) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-[#E3DFD6] bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-[#E3DFD6]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-[#1F2A24] flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#0F6B4F]" />
                    <span>Usuários Cadastrados ({usuarios.length})</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-[#5E6E64]">
                    Controle de contas com ativação e desativação de acesso
                  </CardDescription>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5E6E64]" />
                  <Input
                    placeholder="Buscar usuário..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 rounded-xl border-[#E3DFD6] text-xs focus-visible:ring-[#0F6B4F]"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-[#F7F5F1]/80">
                    <TableRow>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Usuário
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Perfil
                      </TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Status
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Criado Em
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-[#1F2A24]">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-xs text-[#5E6E64]">
                          Carregando usuários...
                        </TableCell>
                      </TableRow>
                    ) : usuariosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-xs text-[#5E6E64]">
                          Nenhum usuário encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      usuariosFiltrados.map((u) => {
                        const ativo = u.is_active ?? true
                        const eAdmin = u.email === 'gabsilvio@gmail.com' || u.role === 'admin'
                        return (
                          <TableRow key={u.id} className="hover:bg-[#F7F5F1]/50 text-xs">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-[#1F2A24]">{u.name}</span>
                                <span className="text-[11px] text-[#5E6E64]">{u.email}</span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold ${
                                  eAdmin
                                    ? 'bg-[#0F6B4F]/10 text-[#0F6B4F] border-[#0F6B4F]/30'
                                    : 'bg-neutral-100 text-[#5E6E64] border-neutral-200'
                                }`}
                              >
                                {eAdmin ? 'Administrador' : 'Corretor'}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] font-semibold ${
                                  ativo
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                {ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right text-[#5E6E64] text-[11px] tabular-nums">
                              {u.created ? new Date(u.created).toLocaleDateString('pt-BR') : '—'}
                            </TableCell>

                            <TableCell className="text-center">
                              {!eAdmin ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAlternarStatus(u)}
                                  className={`h-7 text-xs font-semibold gap-1 ${
                                    ativo
                                      ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                                      : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                                  }`}
                                  title={ativo ? 'Desativar acesso' : 'Reativar acesso'}
                                >
                                  <Power className="h-3.5 w-3.5" />
                                  <span>{ativo ? 'Desativar' : 'Ativar'}</span>
                                </Button>
                              ) : (
                                <span className="text-[10px] text-[#5E6E64] italic">
                                  Admin fixo
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Envio das Credenciais via WhatsApp */}
      <Dialog open={sucessoModalOpen} onOpenChange={setSucessoModalOpen}>
        <DialogContent className="rounded-2xl border-[#E3DFD6] bg-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1F2A24] flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#0F6B4F]" />
              Credenciais Geradas com Sucesso
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5E6E64]">
              Envie as informações diretamente para o WhatsApp do usuário ou copie a mensagem
              pronta.
            </DialogDescription>
          </DialogHeader>

          {credenciaisGeradas && (
            <div className="space-y-4 py-2">
              {/* Preview da Mensagem */}
              <div className="rounded-xl border border-[#E3DFD6] bg-[#F7F5F1] p-3 text-xs font-mono whitespace-pre-wrap leading-relaxed text-[#1F2A24]">
                {formatarMensagemCredenciaisWhatsApp({
                  nome: credenciaisGeradas.nome,
                  email: credenciaisGeradas.email,
                  senha: credenciaisGeradas.senha,
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-neutral-50 p-2.5 border border-[#E3DFD6]">
                  <span className="text-[10px] uppercase font-bold text-[#5E6E64] block">
                    E-mail
                  </span>
                  <span className="font-semibold text-[#1F2A24] truncate block">
                    {credenciaisGeradas.email}
                  </span>
                </div>
                <div className="rounded-lg bg-neutral-50 p-2.5 border border-[#E3DFD6]">
                  <span className="text-[10px] uppercase font-bold text-[#5E6E64] block">
                    Senha Provisória
                  </span>
                  <span className="font-semibold text-[#0F6B4F] font-mono block">
                    {credenciaisGeradas.senha}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopiarMensagemCredenciais}
              className="rounded-xl border-[#E3DFD6] text-xs font-semibold gap-1.5"
            >
              {copiado ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span>{copiado ? 'Copiado!' : 'Copiar Mensagem'}</span>
            </Button>

            <Button
              type="button"
              onClick={handleEnviarWhatsAppCredenciais}
              className="rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white text-xs font-bold gap-2 shadow-sm"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Enviar no WhatsApp</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
