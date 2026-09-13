migrate(
  (app) => {
    // 1. Garantir que o empreendimento "Vitacon João Ramalho" exista na coleção empreendimentos
    const empCol = app.findCollectionByNameOrId('empreendimentos')
    let joaoRamalhoExists = false
    try {
      app.findFirstRecordByData('empreendimentos', 'nome', 'Vitacon João Ramalho')
      joaoRamalhoExists = true
    } catch (_) {}

    if (!joaoRamalhoExists) {
      const empRecord = new Record(empCol)
      empRecord.set('nome', 'Vitacon João Ramalho')
      empRecord.set('endereco', 'Rua João Ramalho, 569')
      empRecord.set('bairro', 'Perdizes')
      empRecord.set('valor_diaria', 420)
      empRecord.set('valor_m2', 45000)
      app.save(empRecord)
    }

    // 2. Semear unidades representativas do Vitacon João Ramalho com base no catálogo oficial Vitacon
    // Tipologias: R2V, NR, HIS, HMP
    // Andares variados e status representativos
    const unidadesCol = app.findCollectionByNameOrId('unidades')

    const unidadesIniciais = [
      // 1º ao 3º andar - HIS e HMP
      {
        unidade: '101',
        andar: 1,
        tipologia: 'HIS',
        metragem: 24.5,
        valor: 345000,
        status: 'disponivel',
        valor_diaria: 320,
        observacoes: 'Studio compacto com living integrado - Enquadramento HIS-2',
      },
      {
        unidade: '102',
        andar: 1,
        tipologia: 'HIS',
        metragem: 24.5,
        valor: 349000,
        status: 'disponivel',
        valor_diaria: 320,
        observacoes: 'Studio HIS voltado para vista interna',
      },
      {
        unidade: '103',
        andar: 1,
        tipologia: 'HMP',
        metragem: 29.0,
        valor: 418000,
        status: 'disponivel',
        valor_diaria: 350,
        observacoes: 'Studio 1 dormitório com varanda - Programa HMP',
      },
      {
        unidade: '201',
        andar: 2,
        tipologia: 'HMP',
        metragem: 29.0,
        valor: 425000,
        status: 'reservada',
        valor_diaria: 350,
        observacoes: 'HMP 29m² com dormitório reservado',
      },
      // 4º ao 8º andar - NR (Não Residencial - ideal para Short Stay / Housi)
      {
        unidade: '401',
        andar: 4,
        tipologia: 'NR',
        metragem: 20.55,
        valor: 435000,
        status: 'disponivel',
        valor_diaria: 380,
        observacoes: 'Studio inteligente NR para investimento short stay',
      },
      {
        unidade: '402',
        andar: 4,
        tipologia: 'NR',
        metragem: 22.0,
        valor: 458000,
        status: 'disponivel',
        valor_diaria: 390,
        observacoes: 'Studio NR vista João Ramalho',
      },
      {
        unidade: '501',
        andar: 5,
        tipologia: 'NR',
        metragem: 25.0,
        valor: 495000,
        status: 'disponivel',
        valor_diaria: 410,
        observacoes: 'Studio NR 25m² mobiliável Housi',
      },
      {
        unidade: '502',
        andar: 5,
        tipologia: 'NR',
        metragem: 20.55,
        valor: 442000,
        status: 'vendida',
        valor_diaria: 380,
        observacoes: 'Studio NR vendido - investidor short stay',
      },
      {
        unidade: '601',
        andar: 6,
        tipologia: 'NR',
        metragem: 28.5,
        valor: 540000,
        status: 'disponivel',
        valor_diaria: 430,
        observacoes: 'Studio NR andar alto com vista livre',
      },
      // 9º ao 14º andar - R2V (Residencial 2 Vias - Studios e 1 Dorm)
      {
        unidade: '901',
        andar: 9,
        tipologia: 'R2V',
        metragem: 27.0,
        valor: 520000,
        status: 'disponivel',
        valor_diaria: 420,
        observacoes: 'Residencial R2V studio com sacada',
      },
      {
        unidade: '902',
        andar: 9,
        tipologia: 'R2V',
        metragem: 30.0,
        valor: 575000,
        status: 'disponivel',
        valor_diaria: 440,
        observacoes: 'R2V 1 dormitório amplo',
      },
      {
        unidade: '1001',
        andar: 10,
        tipologia: 'R2V',
        metragem: 35.0,
        valor: 660000,
        status: 'disponivel',
        valor_diaria: 460,
        observacoes: 'R2V 1 dormitório com suíte',
      },
      {
        unidade: '1101',
        andar: 11,
        tipologia: 'R2V',
        metragem: 45.0,
        valor: 795000,
        status: 'reservada',
        valor_diaria: 520,
        observacoes: 'R2V 45m² vista panorâmica PUC Perdizes',
      },
      {
        unidade: '1201',
        andar: 12,
        tipologia: 'R2V',
        metragem: 27.5,
        valor: 545000,
        status: 'disponivel',
        valor_diaria: 425,
        observacoes: 'R2V studio andar alto',
      },
      {
        unidade: '1401',
        andar: 14,
        tipologia: 'R2V',
        metragem: 45.0,
        valor: 825000,
        status: 'disponivel',
        valor_diaria: 540,
        observacoes: 'R2V 1 dormitório cobertura/andar alto',
      },
    ]

    for (const u of unidadesIniciais) {
      try {
        const existente = app.findFirstRecordByData('unidades', 'unidade', u.unidade)
        if (existente && existente.get('empreendimento') === 'Vitacon João Ramalho') {
          continue
        }
      } catch (_) {}

      const rec = new Record(unidadesCol)
      rec.set('empreendimento', 'Vitacon João Ramalho')
      rec.set('unidade', u.unidade)
      rec.set('andar', u.andar)
      rec.set('tipologia', u.tipologia)
      rec.set('metragem', u.metragem)
      rec.set('valor', u.valor)
      rec.set('status', u.status)
      rec.set('valor_diaria', u.valor_diaria)
      rec.set('observacoes', u.observacoes)
      app.save(rec)
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter(
        'unidades',
        "empreendimento = 'Vitacon João Ramalho'",
        '',
        100,
        0,
      )
      for (const r of records) {
        app.delete(r)
      }
    } catch (_) {}
  },
)
