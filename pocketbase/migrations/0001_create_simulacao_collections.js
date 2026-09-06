migrate(
  (app) => {
    // Coleção empreendimentos
    const empreendimentos = new Collection({
      name: 'empreendimentos',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'endereco', type: 'text', required: true },
        { name: 'bairro', type: 'text', required: true },
        { name: 'valor_diaria', type: 'number', required: true },
        { name: 'valor_m2', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_empreendimentos_nome ON empreendimentos (nome)',
        'CREATE INDEX idx_empreendimentos_bairro ON empreendimentos (bairro)',
      ],
    })
    app.save(empreendimentos)

    // Coleção simulacoes
    const simulacoes = new Collection({
      name: 'simulacoes',
      type: 'base',
      listRule: 'user = @request.auth.id',
      viewRule: 'user = @request.auth.id',
      createRule: "@request.auth.id != ''",
      updateRule: 'user = @request.auth.id',
      deleteRule: 'user = @request.auth.id',
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text' },
        { name: 'empreendimento', type: 'text' },
        { name: 'bairro', type: 'text' },
        { name: 'endereco', type: 'text' },
        { name: 'valor_m2', type: 'number', required: true },
        { name: 'metragem', type: 'number', required: true },
        { name: 'valor_diaria', type: 'number', required: true },
        { name: 'taxa_ocupacao', type: 'number', required: true },
        { name: 'custos_operacionais', type: 'number', required: true },
        { name: 'valorizacao_obra', type: 'number', required: true },
        { name: 'resultados', type: 'json', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_simulacoes_user ON simulacoes (user)',
        'CREATE INDEX idx_simulacoes_created ON simulacoes (created DESC)',
      ],
    })
    app.save(simulacoes)
  },
  (app) => {
    try {
      const simulacoes = app.findCollectionByNameOrId('simulacoes')
      app.delete(simulacoes)
    } catch (_) {}

    try {
      const empreendimentos = app.findCollectionByNameOrId('empreendimentos')
      app.delete(empreendimentos)
    } catch (_) {}
  },
)
