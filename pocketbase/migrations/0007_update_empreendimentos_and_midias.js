migrate(
  (app) => {
    // 1. Atualizar regras da coleção empreendimentos para permitir criação/edição/exclusão por usuários autenticados
    const empreendimentos = app.findCollectionByNameOrId('empreendimentos')
    empreendimentos.createRule = "@request.auth.id != ''"
    empreendimentos.updateRule = "@request.auth.id != ''"
    empreendimentos.deleteRule = "@request.auth.id != ''"

    if (!empreendimentos.fields.getByName('meses_ate_entrega')) {
      empreendimentos.fields.add(
        new NumberField({
          name: 'meses_ate_entrega',
          required: false,
        }),
      )
    }

    if (!empreendimentos.fields.getByName('descricao')) {
      empreendimentos.fields.add(
        new TextField({
          name: 'descricao',
          required: false,
        }),
      )
    }

    app.save(empreendimentos)

    // 2. Atualizar categorias permitidas de midias para incluir 'Book'
    const midias = app.findCollectionByNameOrId('midias')
    const catField = midias.fields.getByName('categoria')
    if (catField && catField.type === 'select') {
      catField.values = ['Mapa de disponibilidade', 'Planta', 'Foto', 'Tabela', 'Book', 'Outros']
      catField.maxSelect = 1
    }
    app.save(midias)
  },
  (app) => {
    try {
      const empreendimentos = app.findCollectionByNameOrId('empreendimentos')
      empreendimentos.fields.removeByName('meses_ate_entrega')
      empreendimentos.fields.removeByName('descricao')
      empreendimentos.createRule = null
      empreendimentos.updateRule = null
      empreendimentos.deleteRule = null
      app.save(empreendimentos)
    } catch (_) {}

    try {
      const midias = app.findCollectionByNameOrId('midias')
      const catField = midias.fields.getByName('categoria')
      if (catField && catField.type === 'select') {
        catField.values = ['Mapa de disponibilidade', 'Planta', 'Foto', 'Tabela', 'Outros']
        catField.maxSelect = 1
      }
      app.save(midias)
    } catch (_) {}
  },
)
