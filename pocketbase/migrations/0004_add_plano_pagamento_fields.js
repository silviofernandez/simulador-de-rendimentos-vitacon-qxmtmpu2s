migrate(
  (app) => {
    const simulacoes = app.findCollectionByNameOrId('simulacoes')

    if (!simulacoes.fields.getByName('meses_ate_entrega')) {
      simulacoes.fields.add(
        new NumberField({
          name: 'meses_ate_entrega',
          required: false,
        }),
      )
    }

    if (!simulacoes.fields.getByName('config_plano_pagamento')) {
      simulacoes.fields.add(
        new JSONField({
          name: 'config_plano_pagamento',
          required: false,
        }),
      )
    }

    app.save(simulacoes)
  },
  (app) => {
    try {
      const simulacoes = app.findCollectionByNameOrId('simulacoes')
      simulacoes.fields.removeByName('meses_ate_entrega')
      simulacoes.fields.removeByName('config_plano_pagamento')
      app.save(simulacoes)
    } catch (_) {}
  },
)
