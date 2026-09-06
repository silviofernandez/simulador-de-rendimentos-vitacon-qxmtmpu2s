migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('empreendimentos')

    const dadosEmpreendimentos = [
      { nome: 'Vitacon Casa Verde', endereco: 'Avenida Casa Verde, 3482', bairro: 'Casa Verde' },
      { nome: 'Vitacon Alameda Franca', endereco: 'Alameda Franca, 253', bairro: 'Jardins' },
      { nome: 'Vitacon Jardins', endereco: 'Rua Augusta, 2662', bairro: 'Jardins' },
      { nome: 'Vitacon Pinheiros', endereco: 'Rua Heitor Penteado,177', bairro: 'Pinheiros' },
      {
        nome: 'Vitacon Domingos de Morais',
        endereco: 'Rua Domingos de Morais, 3093',
        bairro: 'Vila Mariana',
      },
      { nome: 'Vitacon Perdizes', endereco: 'Rua Padre Chico, 183', bairro: 'Perdizes' },
      { nome: 'H Bela Cintra By Vitacon', endereco: 'Rua Bela Cintra, 1425', bairro: 'Jardins' },
      { nome: 'Vitacon Mourato Coelho', endereco: 'Rua Mourato Coelho, 128', bairro: 'Pinheiros' },
      { nome: 'Vitacon Maestro Cardim', endereco: 'Rua Maestro Cardim, 1041', bairro: 'Paraíso' },
      { nome: 'Vitacon Vila Olímpia', endereco: 'Rua Alvorada, 203', bairro: 'Vila Olímpia' },
      {
        nome: 'Vitacon Alto de Pinheiros',
        endereco: 'Rua Tonelero, 1213',
        bairro: 'Alto de Pinheiros',
      },
      {
        nome: 'Vitacon Brigadeiro',
        endereco: 'Av. Brigadeiro Luís Antônio, 871',
        bairro: 'Bela Vista',
      },
      { nome: 'On Jardins', endereco: 'Alameda Itú,1571', bairro: 'Jardins' },
      { nome: 'Vitacon Itaim', endereco: 'Rua Urussuí, 142', bairro: 'Itaim Bibi' },
      {
        nome: 'Vitacon Boa Vista',
        endereco: 'Rua São Benedito, 2575',
        bairro: 'Alto da Boa Vista',
      },
      { nome: 'Vitacon Bela Vista', endereco: 'Rua São Miguel, 117', bairro: 'Bela Vista' },
      { nome: 'Vitacon Lorena', endereco: 'Alameda Lorena, 2158', bairro: 'Jardins' },
      { nome: 'On Flórida', endereco: 'Av. Santo Amaro, 3800', bairro: 'Brooklin' },
      { nome: 'Housi Paulista', endereco: 'Rua Bela Cintra, 1032', bairro: 'Consolação' },
      {
        nome: 'On Pixel Life Vila Mariana',
        endereco: 'Rua Madre Cabrini, 303',
        bairro: 'Vila Mariana',
      },
      { nome: 'Vitacon Alameda Jaú', endereco: 'Alameda Jaú, 20', bairro: 'Jardins' },
      { nome: 'On Cardoso de Melo', endereco: 'Rua Alvorada, 1036', bairro: 'Vila Olímpia' },
      { nome: 'On Brooklin', endereco: 'Av. Santo Amaro, 5200', bairro: 'Brooklin' },
      { nome: 'On Maracatins', endereco: 'Alameda dos Maracatins, 1424', bairro: 'Moema' },
      {
        nome: 'On Domingos de Morais',
        endereco: 'Rua Domingos de Morais, 1164',
        bairro: 'Vila Mariana',
      },
      { nome: 'On Vila Olímpia', endereco: 'Rua Cabo Verde, 350', bairro: 'Vila Olímpia' },
      { nome: 'On Jurupis', endereco: 'Alameda dos Jurupis, 700', bairro: 'Moema' },
      { nome: 'Housi Perdizes', endereco: 'Rua Caraíbas, 198', bairro: 'Perdizes' },
      { nome: 'Housi Brooklin', endereco: 'Rua Getúlio Soares da Rocha, 135', bairro: 'Brooklin' },
      { nome: 'On Alvorada 183', endereco: 'Rua Alvorada 183', bairro: 'Vila Olímpia' },
      { nome: 'On Lorena', endereco: 'Alameda Lorena, 718', bairro: 'Jardins' },
      { nome: 'On Imarés', endereco: 'Av. dos Imarés 318', bairro: 'Moema' },
      { nome: 'VN Ueno', endereco: 'Rua Barata Ribeiro, 108', bairro: 'Bela Vista' },
      { nome: 'VN Millennium Faria Lima', endereco: 'Rua Chilon, 184', bairro: 'Itaim Bibi' },
      { nome: 'VN Frei Caneca', endereco: 'Rua Frei Caneca, 645', bairro: 'Bela Vista' },
      { nome: 'VN Consolação', endereco: 'Rua da Consolação, 297', bairro: 'Bela Vista' },
    ]

    const diariaPorBairro = {
      'Casa Verde': 250,
      Jardins: 380,
      Pinheiros: 380,
      'Vila Mariana': 300,
      Perdizes: 450,
      Paraíso: 350,
      'Vila Olímpia': 300,
      'Alto de Pinheiros': 300,
      'Bela Vista': 350,
      'Itaim Bibi': 350,
      'Alto da Boa Vista': 340,
      Brooklin: 395,
      Consolação: 385,
      Moema: 300,
      Ipiranga: 290,
      Higienópolis: 280,
      'Bom Retiro': 270,
      Aclimação: 260,
      Pompéia: 250,
      Saúde: 240,
      Morumbi: 230,
      Sumaré: 220,
    }

    const valorBaseM2 = 32400
    const diariaBase = 300

    for (let i = 0; i < dadosEmpreendimentos.length; i++) {
      const item = dadosEmpreendimentos[i]
      try {
        app.findFirstRecordByData('empreendimentos', 'nome', item.nome)
        // já existe, continua
      } catch (_) {
        const diaria = diariaPorBairro[item.bairro] || 300
        const valorM2 = Math.round(valorBaseM2 * (diaria / diariaBase))

        const rec = new Record(col)
        rec.set('nome', item.nome)
        rec.set('endereco', item.endereco)
        rec.set('bairro', item.bairro)
        rec.set('valor_diaria', diaria)
        rec.set('valor_m2', valorM2)
        app.save(rec)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('empreendimentos')
      app.truncateCollection(col)
    } catch (_) {}
  },
)
