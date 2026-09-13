migrate(
  (app) => {
    // 1. Adicionar campo data_entrega_chaves na coleção empreendimentos
    const empreendimentos = app.findCollectionByNameOrId('empreendimentos')
    if (!empreendimentos.fields.getByName('data_entrega_chaves')) {
      empreendimentos.fields.add(
        new TextField({
          name: 'data_entrega_chaves',
          required: false,
        }),
      )
      app.save(empreendimentos)
    }

    // 2. Calcular data de entrega para 22 meses a partir da data de hoje
    // e definir para o "Vitacon João Ramalho"
    const hoje = new Date()
    const dataEntregaJR = new Date(hoje.getFullYear(), hoje.getMonth() + 22, 1)
    const ano = dataEntregaJR.getFullYear()
    const mes = String(dataEntregaJR.getMonth() + 1).padStart(2, '0')
    const dia = '01'
    const dataEntregaJRStr = `${ano}-${mes}-${dia}` // Formato YYYY-MM-DD

    try {
      const jr = app.findFirstRecordByData('empreendimentos', 'nome', 'Vitacon João Ramalho')
      jr.set('meses_ate_entrega', 22)
      jr.set('data_entrega_chaves', dataEntregaJRStr)
      app.save(jr)
    } catch (e) {
      console.log('Vitacon João Ramalho não encontrado para atualização de prazo:', e.message)
    }

    // Também garantir que o Vitacon Domingos de Morais tenha meses_ate_entrega padrão (22 ou 24) se estiver 0
    try {
      const domingos = app.findFirstRecordByData(
        'empreendimentos',
        'nome',
        'Vitacon Domingos de Morais',
      )
      if (!domingos.get('meses_ate_entrega') || domingos.get('meses_ate_entrega') === 0) {
        const dataEntregaDM = new Date(hoje.getFullYear(), hoje.getMonth() + 22, 1)
        const anoDM = dataEntregaDM.getFullYear()
        const mesDM = String(dataEntregaDM.getMonth() + 1).padStart(2, '0')
        domingos.set('meses_ate_entrega', 22)
        domingos.set('data_entrega_chaves', `${anoDM}-${mesDM}-01`)
        app.save(domingos)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const empreendimentos = app.findCollectionByNameOrId('empreendimentos')
      if (empreendimentos.fields.getByName('data_entrega_chaves')) {
        empreendimentos.fields.removeByName('data_entrega_chaves')
        app.save(empreendimentos)
      }
    } catch (_) {}
  },
)
