import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      errors[field] = (detail as { message: string }).message
    }
  }
  return errors
}

export function formatarMensagemErroUpload(
  error: unknown,
  fallback = 'Erro ao fazer upload do arquivo.',
): string {
  if (!error) return fallback

  if (error instanceof ClientResponseError) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      // Verifica erros específicos no campo 'arquivo'
      const arquivoErro = (data as Record<string, unknown>).arquivo
      if (arquivoErro) {
        let msg = ''
        if (typeof arquivoErro === 'string') msg = arquivoErro
        else if (typeof arquivoErro === 'object' && arquivoErro && 'message' in arquivoErro) {
          msg = String((arquivoErro as { message: unknown }).message)
        }

        if (msg) {
          const msgLower = msg.toLowerCase()
          if (
            msgLower.includes('size') ||
            msgLower.includes('tamanho') ||
            msgLower.includes('maximum allowed')
          ) {
            return 'Arquivo muito grande. O limite máximo para upload é de 100 MB.'
          }
          if (msgLower.includes('mime') || msgLower.includes('type') || msgLower.includes('tipo')) {
            return 'Formato de arquivo não suportado. Por favor, envie um PDF ou imagem válida (JPG, PNG, WEBP).'
          }
          return `Erro no arquivo: ${msg}`
        }
      }

      // Verifica outros campos
      const fieldErrors = extractFieldErrors(error)
      const fieldKeys = Object.keys(fieldErrors)
      if (fieldKeys.length > 0) {
        return fieldKeys.map((k) => `${k}: ${fieldErrors[k]}`).join(' | ')
      }
    }

    if (error.status === 413) {
      return 'Arquivo muito grande. O tamanho excede o limite aceito pelo servidor (máximo 100 MB).'
    }
    if (error.status === 400) {
      if (
        error.message?.includes('Failed to create record') ||
        error.message?.includes('Failed to upload')
      ) {
        return 'Dados de upload inválidos ou arquivo incompatível com o servidor.'
      }
      return error.message || 'Requisição inválida ao enviar material.'
    }
    if (error.status === 403 || error.status === 401) {
      return 'Você não tem permissão para adicionar mídias. Faça login e tente novamente.'
    }
    if (error.status === 408 || error.status === 504 || error.isAbort) {
      return 'Tempo limite esgotado ao enviar o arquivo (timeout). Verifique sua conexão e tente novamente.'
    }
    if (
      error.status === 0 ||
      error.message?.toLowerCase().includes('failed to fetch') ||
      error.message?.toLowerCase().includes('network')
    ) {
      return 'Falha na conexão de rede ao enviar o arquivo. Verifique sua internet.'
    }
    if (error.message) {
      return error.message
    }
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('network') || msg.includes('failed to fetch')) {
      return 'Falha de rede ao transferir o arquivo. Verifique sua conexão com a internet.'
    }
    if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('abort')) {
      return 'Tempo limite esgotado ao transferir o arquivo. Tente novamente.'
    }
    return error.message
  }

  return fallback
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'An unexpected error occurred.'
  }
  const msgs = Object.values(extractFieldErrors(error))
  return msgs.length > 0 ? msgs.join(' ') : error.message || 'An unexpected error occurred.'
}
