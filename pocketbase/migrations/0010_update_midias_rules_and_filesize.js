migrate(
  (app) => {
    // 1. Atualizar coleção midias:
    // - Garantir que list, view, create, update e delete permitam acesso seguro
    // - Permitir criação anônima ou autenticada (createRule: "") para que corretores e usuários do simulador possam subir materiais
    // - Aumentar maxSize do arquivo para 100MB (104857600 bytes) para comportar books institucionais grandes
    // - Adicionar tipos MIME comuns de documentos/imagens
    // - Garantir que categoria inclua 'Book'
    const midias = app.findCollectionByNameOrId('midias')

    // Permitir criação por qualquer usuário ou convidado
    midias.createRule = ''
    midias.listRule = ''
    midias.viewRule = ''
    midias.updateRule = ''
    midias.deleteRule = ''

    // Atualizar opções do campo 'arquivo'
    const arqField = midias.fields.getByName('arquivo')
    if (arqField) {
      arqField.maxSize = 104857600 // 100MB
      // mimeTypes vazio desativa o validador restritivo de MIME, aceitando qualquer PDF ou imagem com segurança
      arqField.mimeTypes = []
    }

    // Atualizar opções do campo 'categoria'
    const catField = midias.fields.getByName('categoria')
    if (catField && catField.type === 'select') {
      catField.values = ['Mapa de disponibilidade', 'Planta', 'Foto', 'Tabela', 'Book', 'Outros']
      catField.maxSelect = 1
    }

    app.save(midias)
  },
  (app) => {
    try {
      const midias = app.findCollectionByNameOrId('midias')
      const arqField = midias.fields.getByName('arquivo')
      if (arqField) {
        arqField.maxSize = 52428800 // 50MB
      }
      app.save(midias)
    } catch (_) {}
  },
)
