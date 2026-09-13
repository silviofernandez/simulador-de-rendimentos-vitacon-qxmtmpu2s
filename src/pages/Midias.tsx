import React, { useState, useEffect, useRef } from 'react'
import { listarMidias, criarMidia, excluirMidia, obterUrlMidia } from '@/services/midias'
import { MidiaRecord, CategoriaMidia } from '@/types/simulador'
import {
  formatarMensagemMidiaWhatsApp,
  abrirWhatsAppComTexto,
  copiarTextoParaClipboard,
} from '@/lib/whatsapp'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  FolderOpen,
  Upload,
  FileText,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  Trash2,
  Search,
  Filter,
  Check,
} from 'lucide-react'

const CATEGORIAS: CategoriaMidia[] = [
  'Mapa de disponibilidade',
  'Planta',
  'Foto',
  'Tabela',
  'Outros',
]

export default function MidiasPage() {
  const { user } = useAuth()
  const [midias, setMidias] = useState<MidiaRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas')

  // Upload modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [categoria, setCategoria] = useState<CategoriaMidia>('Mapa de disponibilidade')
  const [empreendimento, setEmpreendimento] = useState('Vitacon João Ramalho')
  const [descricao, setDescricao] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cópia feedback
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const carregarMidias = async () => {
    try {
      setIsLoading(true)
      const data = await listarMidias(categoriaFiltro)
      setMidias(data)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar mídias.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarMidias()
  }, [categoriaFiltro])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!arquivo) {
      toast.error('Selecione um arquivo de imagem ou PDF.')
      return
    }
    if (!titulo.trim()) {
      toast.error('Informe um título para o material.')
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('titulo', titulo.trim())
      formData.append('categoria', categoria)
      if (empreendimento.trim()) formData.append('empreendimento', empreendimento.trim())
      if (descricao.trim()) formData.append('descricao', descricao.trim())
      formData.append('arquivo', arquivo)
      if (user?.id) formData.append('criado_por', user.id)

      await criarMidia(formData)
      toast.success('Material enviado com sucesso!')

      setUploadModalOpen(false)
      setTitulo('')
      setDescricao('')
      setArquivo(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      carregarMidias()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao fazer upload do arquivo.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleExcluir = async (id: string, tituloItem: string) => {
    if (!confirm(`Deseja realmente excluir "${tituloItem}"?`)) return
    try {
      await excluirMidia(id)
      setMidias((prev) => prev.filter((m) => m.id !== id))
      toast.success('Mídia removida com sucesso.')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir mídia.')
    }
  }

  const handleCopiarLink = async (m: MidiaRecord) => {
    const url = obterUrlMidia(m)
    if (!url) {
      toast.error('Arquivo indisponível.')
      return
    }
    const ok = await copiarTextoParaClipboard(url)
    if (ok) {
      setCopiedId(m.id)
      setTimeout(() => setCopiedId(null), 2500)
      toast.success('Link público copiado!')
    } else {
      toast.error('Falha ao copiar link.')
    }
  }

  const handleEnviarWhatsApp = (m: MidiaRecord) => {
    const url = obterUrlMidia(m)
    if (!url) {
      toast.error('Arquivo indisponível.')
      return
    }
    const texto = formatarMensagemMidiaWhatsApp({
      titulo: m.titulo,
      categoria: m.categoria,
      empreendimento: m.empreendimento,
      descricao: m.descricao,
      urlArquivo: url,
    })
    abrirWhatsAppComTexto(texto)
    toast.success('Abrindo WhatsApp com o material...')
  }

  const isPdf = (m: MidiaRecord) => {
    return m.arquivo?.toLowerCase().endsWith('.pdf')
  }

  const midiasFiltradas = midias.filter((m) => {
    const q = search.toLowerCase()
    return (
      m.titulo.toLowerCase().includes(q) ||
      m.categoria?.toLowerCase().includes(q) ||
      m.empreendimento?.toLowerCase().includes(q) ||
      m.descricao?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DFD6] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2A24]">
              Biblioteca de Mídias
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0F6B4F]/10 px-2.5 py-0.5 text-xs font-bold text-[#0F6B4F]">
              <FolderOpen className="h-3.5 w-3.5" />
              Arquivos & WhatsApp
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5E6E64] mt-1">
            Armazene plantas, mapas de disponibilidade, tabelas e fotos para envio rápido aos
            clientes via WhatsApp.
          </p>
        </div>

        {/* Modal de Upload */}
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white font-semibold text-xs gap-2 shadow-md shadow-[#0F6B4F]/20">
              <Upload className="h-4 w-4" />
              <span>Adicionar Mídia</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-[#E3DFD6] bg-white sm:max-w-md">
            <form onSubmit={handleUpload}>
              <DialogHeader>
                <DialogTitle className="text-[#1F2A24]">Adicionar Nova Mídia</DialogTitle>
                <DialogDescription className="text-xs text-[#5E6E64]">
                  Suba imagens (JPG, PNG, WEBP) ou documentos PDF (até 50MB).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="midia-titulo" className="text-xs font-semibold text-[#1F2A24]">
                    Título do Material *
                  </Label>
                  <Input
                    id="midia-titulo"
                    placeholder="Ex: Mapa de Disponibilidade João Ramalho"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="h-10 rounded-xl border-[#E3DFD6] text-xs focus-visible:ring-[#0F6B4F]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1F2A24]">Categoria</Label>
                    <Select
                      value={categoria}
                      onValueChange={(v) => setCategoria(v as CategoriaMidia)}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-[#E3DFD6] text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {CATEGORIAS.map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="midia-emp" className="text-xs font-semibold text-[#1F2A24]">
                      Empreendimento
                    </Label>
                    <Input
                      id="midia-emp"
                      placeholder="Ex: Vitacon João Ramalho"
                      value={empreendimento}
                      onChange={(e) => setEmpreendimento(e.target.value)}
                      className="h-10 rounded-xl border-[#E3DFD6] text-xs focus-visible:ring-[#0F6B4F]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="midia-desc" className="text-xs font-semibold text-[#1F2A24]">
                    Descrição / Observações (opcional)
                  </Label>
                  <Input
                    id="midia-desc"
                    placeholder="Ex: Atualizado em setembro com tabela de valores e tipologias"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="h-10 rounded-xl border-[#E3DFD6] text-xs focus-visible:ring-[#0F6B4F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="midia-file" className="text-xs font-semibold text-[#1F2A24]">
                    Arquivo (PDF, JPG, PNG) *
                  </Label>
                  <Input
                    id="midia-file"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                    className="h-11 rounded-xl border-[#E3DFD6] text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#0F6B4F]/10 file:text-[#0F6B4F] file:font-semibold"
                    required
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-xl border-[#E3DFD6] text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading}
                  className="rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white text-xs font-semibold"
                >
                  {isUploading ? 'Enviando...' : 'Fazer Upload'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Abas de categorias */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant={categoriaFiltro === 'Todas' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoriaFiltro('Todas')}
            className={`rounded-xl text-xs font-semibold h-9 ${
              categoriaFiltro === 'Todas'
                ? 'bg-[#0F6B4F] text-white'
                : 'border-[#E3DFD6] text-[#5E6E64] hover:text-[#1F2A24]'
            }`}
          >
            Todas ({midias.length})
          </Button>
          {CATEGORIAS.map((cat) => (
            <Button
              key={cat}
              variant={categoriaFiltro === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoriaFiltro(cat)}
              className={`rounded-xl text-xs font-semibold h-9 shrink-0 ${
                categoriaFiltro === cat
                  ? 'bg-[#0F6B4F] text-white'
                  : 'border-[#E3DFD6] text-[#5E6E64] hover:text-[#1F2A24]'
              }`}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Busca */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5E6E64]" />
          <Input
            placeholder="Buscar por título ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl border-[#E3DFD6] text-xs focus-visible:ring-[#0F6B4F]"
          />
        </div>
      </div>

      {/* Grid de Cards */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#5E6E64]">
          Carregando biblioteca de mídias...
        </div>
      ) : midiasFiltradas.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#E3DFD6] p-12 text-center bg-white">
          <FolderOpen className="mx-auto h-10 w-10 text-[#5E6E64]/50 mb-3" />
          <h3 className="text-sm font-bold text-[#1F2A24]">Nenhuma mídia encontrada</h3>
          <p className="mt-1 text-xs text-[#5E6E64] max-w-sm mx-auto">
            Adicione plantas, mapas de disponibilidade ou fotos para começar a compartilhar com seus
            clientes no WhatsApp.
          </p>
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="mt-4 rounded-xl bg-[#0F6B4F] hover:bg-[#0B5740] text-white text-xs font-semibold"
          >
            Adicionar Primeira Mídia
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {midiasFiltradas.map((m) => {
            const url = obterUrlMidia(m)
            const pdf = isPdf(m)
            return (
              <Card
                key={m.id}
                className="group border-[#E3DFD6] bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Preview Container */}
                  <div className="relative aspect-video w-full bg-[#F7F5F1] overflow-hidden flex items-center justify-center border-b border-[#E3DFD6]">
                    {pdf ? (
                      <div className="flex flex-col items-center gap-1.5 p-4 text-[#C62828]">
                        <FileText className="h-10 w-10 stroke-1" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Documento PDF
                        </span>
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt={m.titulo}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}

                    {/* Badge da Categoria */}
                    <div className="absolute top-2 left-2">
                      <Badge
                        variant="secondary"
                        className="bg-white/90 backdrop-blur-xs text-[#1F2A24] border border-[#E3DFD6] text-[10px] font-semibold"
                      >
                        {m.categoria || 'Geral'}
                      </Badge>
                    </div>

                    {/* Botão Visualizar Externo */}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Abrir arquivo em nova aba"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {/* Informações */}
                  <div className="p-4 space-y-1.5">
                    <h3 className="font-bold text-xs text-[#1F2A24] line-clamp-1 group-hover:text-[#0F6B4F] transition-colors">
                      {m.titulo}
                    </h3>
                    {m.empreendimento && (
                      <span className="text-[11px] font-medium text-[#5E6E64] block">
                        {m.empreendimento}
                      </span>
                    )}
                    {m.descricao && (
                      <p className="text-[11px] text-[#5E6E64] line-clamp-2 leading-relaxed">
                        {m.descricao}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="p-4 pt-0 border-t border-[#E3DFD6]/60 mt-2">
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopiarLink(m)}
                      className="h-8 rounded-lg border-[#E3DFD6] text-[11px] font-semibold gap-1 text-[#5E6E64] hover:text-[#1F2A24]"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleEnviarWhatsApp(m)}
                      className="h-8 rounded-lg bg-[#25D366] hover:bg-[#1EBE5B] text-white text-[11px] font-bold gap-1 shadow-xs"
                    >
                      <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                      <span>WhatsApp</span>
                    </Button>
                  </div>

                  {user && (
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleExcluir(m.id, m.titulo)}
                        className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remover</span>
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
