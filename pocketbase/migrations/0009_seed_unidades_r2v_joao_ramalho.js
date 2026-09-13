migrate(
  (app) => {
    // 1. Atualizar o empreendimento 'Vitacon João Ramalho' com a data de entrega das chaves da tabela R2V: 2029-12-10
    // O prazo anterior (julho/2028, 22 meses) foi substituído pela nova tabela oficial (dezembro/2029)
    try {
      const empreendimentos = app.findCollectionByNameOrId('empreendimentos')
      const records = app.findRecordsByFilter(
        'empreendimentos',
        "nome ~ 'João Ramalho' || nome ~ 'Joao Ramalho'",
        '',
        1,
      )

      if (records && records.length > 0) {
        const emp = records[0]
        emp.set('data_entrega_chaves', '2029-12-10')
        // Prazo dinâmico em meses a partir de set/2026 (~39 meses até dez/2029)
        emp.set('meses_ate_entrega', 39)
        app.save(emp)
      }
    } catch (e) {
      console.log('Aviso ao atualizar Vitacon João Ramalho:', e)
    }

    // 2. Inserir ou atualizar as 27 unidades R2V oficiais do PDF 'Vitacon TABELA R2V JOÃO RAMALHO - SETEMBRO-22ca5.pdf'
    // Tabela: JOÃO RAMALHO R FLUXO - SETEMBRO 26 (Tipologia R2V-2 "Unidade 1 DORM", Torre Única, andares 02 a 05)
    // Preserva studios existentes (HIS/HMP/NR/R2V antigos) usando a chave de unidade
    const unidadesR2V = [
      // Andar 2 (Garden)
      {
        unidade: 'U-0207',
        andar: 2,
        tipologia: 'R2V',
        metragem: 44.23,
        valor: 820219.59,
        status: 'disponivel',
        valor_diaria: 530,
        observacoes: 'R2V-2 Unidade 1 DORM GARDEN R2V-F07-2PAV 44,23m²',
      },
      {
        unidade: 'U-0208',
        andar: 2,
        tipologia: 'R2V',
        metragem: 44.14,
        valor: 819778.41,
        status: 'disponivel',
        valor_diaria: 530,
        observacoes: 'R2V-2 Unidade 1 DORM GARDEN R2V-F08-2PAV 44,14m²',
      },
      {
        unidade: 'U-0209',
        andar: 2,
        tipologia: 'R2V',
        metragem: 45.0,
        valor: 819999.0,
        status: 'disponivel',
        valor_diaria: 540,
        observacoes: 'R2V-2 Unidade 1 DORM GARDEN R2V-F09-2PAV 45,00m²',
      },
      {
        unidade: 'U-0210',
        andar: 2,
        tipologia: 'R2V',
        metragem: 34.08,
        valor: 719999.0,
        status: 'reservada',
        valor_diaria: 480,
        observacoes: 'R2V-2 Unidade 1 DORM GARDEN R2V-F10-2PAV 34,08m²',
      },
      {
        unidade: 'U-0211',
        andar: 2,
        tipologia: 'R2V',
        metragem: 33.44,
        valor: 720107.15,
        status: 'disponivel',
        valor_diaria: 480,
        observacoes: 'R2V-2 Unidade 1 DORM GARDEN R2V-F11-2PAV 33,44m²',
      },
      {
        unidade: 'U-0212',
        andar: 2,
        tipologia: 'R2V',
        metragem: 33.32,
        valor: 719890.85,
        status: 'disponivel',
        valor_diaria: 480,
        observacoes: 'R2V-2 Unidade 1 DORM GARDEN R2V-F12-2PAV 33,32m²',
      },

      // Andar 3 (Terraço Coberto)
      {
        unidade: 'U-0307',
        andar: 3,
        tipologia: 'R2V',
        metragem: 27.72,
        valor: 657848.6,
        status: 'disponivel',
        valor_diaria: 450,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F07-3AO5PAV 27,72m²',
      },
      {
        unidade: 'U-0309',
        andar: 3,
        tipologia: 'R2V',
        metragem: 28.37,
        valor: 659033.69,
        status: 'disponivel',
        valor_diaria: 450,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F09-3AO5PAV 28,37m²',
      },
      {
        unidade: 'U-0310',
        andar: 3,
        tipologia: 'R2V',
        metragem: 28.37,
        valor: 659033.69,
        status: 'disponivel',
        valor_diaria: 450,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F10-3AO5PAV 28,37m²',
      },
      {
        unidade: 'U-0311',
        andar: 3,
        tipologia: 'R2V',
        metragem: 27.93,
        valor: 658224.73,
        status: 'disponivel',
        valor_diaria: 450,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F11-3AO5PAV 27,93m²',
      },
      {
        unidade: 'U-0312',
        andar: 3,
        tipologia: 'R2V',
        metragem: 27.72,
        valor: 657848.6,
        status: 'disponivel',
        valor_diaria: 450,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F12-3AO5PAV 27,72m²',
      },

      // Andar 4 (Terraço Coberto)
      {
        unidade: 'U-0407',
        andar: 4,
        tipologia: 'R2V',
        metragem: 27.72,
        valor: 659810.37,
        status: 'disponivel',
        valor_diaria: 455,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F07-3AO5PAV 27,72m²',
      },
      {
        unidade: 'U-0408',
        andar: 4,
        tipologia: 'R2V',
        metragem: 27.93,
        valor: 660187.63,
        status: 'disponivel',
        valor_diaria: 455,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F08-3AO5PAV 27,93m²',
      },
      {
        unidade: 'U-0409',
        andar: 4,
        tipologia: 'R2V',
        metragem: 28.37,
        valor: 660999.0,
        status: 'disponivel',
        valor_diaria: 455,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F09-3AO5PAV 28,37m²',
      },
      {
        unidade: 'U-0410',
        andar: 4,
        tipologia: 'R2V',
        metragem: 28.37,
        valor: 660999.0,
        status: 'disponivel',
        valor_diaria: 455,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F10-3AO5PAV 28,37m²',
      },
      {
        unidade: 'U-0411',
        andar: 4,
        tipologia: 'R2V',
        metragem: 27.93,
        valor: 660187.63,
        status: 'disponivel',
        valor_diaria: 455,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F11-3AO5PAV 27,93m²',
      },
      {
        unidade: 'U-0412',
        andar: 4,
        tipologia: 'R2V',
        metragem: 27.72,
        valor: 659810.37,
        status: 'disponivel',
        valor_diaria: 455,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F12-3AO5PAV 27,72m²',
      },

      // Andar 5 (Terraço Coberto)
      {
        unidade: 'U-0507',
        andar: 5,
        tipologia: 'R2V',
        metragem: 27.72,
        valor: 661772.15,
        status: 'disponivel',
        valor_diaria: 460,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F07-3AO5PAV 27,72m²',
      },
      {
        unidade: 'U-0508',
        andar: 5,
        tipologia: 'R2V',
        metragem: 27.93,
        valor: 662150.52,
        status: 'disponivel',
        valor_diaria: 460,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F08-3AO5PAV 27,93m²',
      },
      {
        unidade: 'U-0509',
        andar: 5,
        tipologia: 'R2V',
        metragem: 28.37,
        valor: 662964.31,
        status: 'reservada',
        valor_diaria: 460,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F09-3AO5PAV 28,37m²',
      },
      {
        unidade: 'U-0510',
        andar: 5,
        tipologia: 'R2V',
        metragem: 28.37,
        valor: 662964.31,
        status: 'disponivel',
        valor_diaria: 460,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F10-3AO5PAV 28,37m²',
      },
      {
        unidade: 'U-0511',
        andar: 5,
        tipologia: 'R2V',
        metragem: 27.93,
        valor: 662150.52,
        status: 'disponivel',
        valor_diaria: 460,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F11-3AO5PAV 27,93m²',
      },
      {
        unidade: 'U-0512',
        andar: 5,
        tipologia: 'R2V',
        metragem: 27.72,
        valor: 661772.15,
        status: 'disponivel',
        valor_diaria: 460,
        observacoes: 'R2V-2 Unidade 1 DORM COM terraço coberto R2V-F12-3AO5PAV 27,72m²',
      },
    ]

    const unidadesCollection = app.findCollectionByNameOrId('unidades')

    for (const item of unidadesR2V) {
      try {
        const existing = app.findRecordsByFilter(
          'unidades',
          `empreendimento = 'Vitacon João Ramalho' && unidade = '${item.unidade}'`,
          '',
          1,
        )

        if (existing && existing.length > 0) {
          const rec = existing[0]
          rec.set('andar', item.andar)
          rec.set('tipologia', item.tipologia)
          rec.set('metragem', item.metragem)
          rec.set('valor', item.valor)
          rec.set('status', item.status)
          rec.set('valor_diaria', item.valor_diaria)
          rec.set('observacoes', item.observacoes)
          app.save(rec)
        } else {
          const rec = new Record(unidadesCollection)
          rec.set('empreendimento', 'Vitacon João Ramalho')
          rec.set('unidade', item.unidade)
          rec.set('andar', item.andar)
          rec.set('tipologia', item.tipologia)
          rec.set('metragem', item.metragem)
          rec.set('valor', item.valor)
          rec.set('status', item.status)
          rec.set('valor_diaria', item.valor_diaria)
          rec.set('observacoes', item.observacoes)
          app.save(rec)
        }
      } catch (err) {
        console.log(`Erro ao salvar unidade ${item.unidade}:`, err)
      }
    }
  },
  (app) => {
    // Reverter: remover unidades U-0207 até U-0512 de Vitacon João Ramalho
    try {
      const records = app.findRecordsByFilter(
        'unidades',
        "empreendimento = 'Vitacon João Ramalho' && unidade ~ 'U-0'",
        '',
        100,
      )
      for (const rec of records) {
        app.delete(rec)
      }
    } catch (_) {}
  },
)
