migrate(
  (app) => {
    // 1. Atualizar regras da coleção users para permitir que usuários autenticados listem/vejam outros usuários ou admin gerencie
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Regras de acesso para users:
    // listRule: "@request.auth.id != ''"
    // viewRule: "@request.auth.id != ''"
    // createRule: "@request.auth.email = 'gabsilvio@gmail.com'"
    // updateRule: "@request.auth.id = id || @request.auth.email = 'gabsilvio@gmail.com'"
    // deleteRule: "@request.auth.email = 'gabsilvio@gmail.com'"
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.createRule = "@request.auth.email = 'gabsilvio@gmail.com'"
    users.updateRule = "@request.auth.id = id || @request.auth.email = 'gabsilvio@gmail.com'"
    users.deleteRule = "@request.auth.email = 'gabsilvio@gmail.com'"

    if (!users.fields.getByName('is_active')) {
      users.fields.add(
        new BoolField({
          name: 'is_active',
          required: false,
        }),
      )
    }

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'corretor', 'investidor'],
          maxSelect: 1,
          required: false,
        }),
      )
    }
    app.save(users)

    // Garantir que Gabriel Silvio tenha role='admin' e is_active=true
    try {
      const adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'gabsilvio@gmail.com')
      adminUser.set('role', 'admin')
      adminUser.set('is_active', true)
      app.save(adminUser)
    } catch (_) {}

    // 2. Criar coleção unidades
    const unidades = new Collection({
      name: 'unidades',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'empreendimento', type: 'text', required: true },
        { name: 'unidade', type: 'text', required: true },
        { name: 'andar', type: 'number', required: false },
        {
          name: 'tipologia',
          type: 'select',
          values: ['R2V', 'NR', 'HIS', 'HMP'],
          maxSelect: 1,
          required: true,
        },
        { name: 'metragem', type: 'number', required: true },
        { name: 'valor', type: 'number', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['disponivel', 'reservada', 'vendida'],
          maxSelect: 1,
          required: false,
        },
        { name: 'valor_diaria', type: 'number', required: false },
        { name: 'observacoes', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_unidades_emp ON unidades (empreendimento)',
        'CREATE INDEX idx_unidades_status ON unidades (status)',
        'CREATE INDEX idx_unidades_tipologia ON unidades (tipologia)',
        'CREATE UNIQUE INDEX idx_unidades_emp_num ON unidades (empreendimento, unidade)',
      ],
    })
    app.save(unidades)

    // 3. Criar coleção midias
    const midias = new Collection({
      name: 'midias',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'titulo', type: 'text', required: true },
        {
          name: 'categoria',
          type: 'select',
          values: ['Mapa de disponibilidade', 'Planta', 'Foto', 'Tabela', 'Outros'],
          maxSelect: 1,
          required: false,
        },
        { name: 'empreendimento', type: 'text', required: false },
        {
          name: 'arquivo',
          type: 'file',
          maxSelect: 1,
          maxSize: 52428800, // 50MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'],
        },
        { name: 'descricao', type: 'text', required: false },
        {
          name: 'criado_por',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_midias_categoria ON midias (categoria)',
        'CREATE INDEX idx_midias_created ON midias (created DESC)',
      ],
    })
    app.save(midias)
  },
  (app) => {
    try {
      const midias = app.findCollectionByNameOrId('midias')
      app.delete(midias)
    } catch (_) {}

    try {
      const unidades = app.findCollectionByNameOrId('unidades')
      app.delete(unidades)
    } catch (_) {}

    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.fields.removeByName('is_active')
      users.fields.removeByName('role')
      app.save(users)
    } catch (_) {}
  },
)
