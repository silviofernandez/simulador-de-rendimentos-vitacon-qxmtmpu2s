routerAdd(
  'POST',
  '/backend/v1/documentos/extrair-unidades',
  (e) => {
    const files = e.findUploadedFiles('arquivo')
    if (!files || files.length === 0) {
      return e.json(400, {
        error:
          "Nenhum arquivo enviado. Envie um arquivo PDF, XLSX, CSV ou imagem no campo 'arquivo'.",
      })
    }

    const uploadedFile = files[0]
    let rawText = ''
    let truncated = false

    // 1. Tentar ler o arquivo via $documents.toMarkdown (suporta PDF, XLSX, DOCX, CSV)
    try {
      const docResult = $documents.toMarkdown({ file: uploadedFile })
      rawText = docResult.markdown || ''
      truncated = !!docResult.truncated
    } catch (err) {
      console.log('Aviso: falha em $documents.toMarkdown:', err.message)
      // Se for erro de OCR requerido (PDF digitalizado/imagem escaneada)
      if (err && err.status === 422) {
        return e.json(422, {
          error:
            'O documento enviado parece ser uma imagem ou PDF escaneado sem camada de texto selecionável. Por favor, envie o PDF original com texto ou copie e cole a tabela.',
        })
      }
    }

    // Se o rawText ficou vazio ou muito curto, retorna indicação para o fallback do cliente
    if (!rawText || rawText.trim().length < 10) {
      return e.json(200, {
        sucesso: false,
        unidades: [],
        rawText: rawText || '',
        aviso:
          'Não foi possível extrair texto diretamente do arquivo. Utilize a opção de colar tabela como texto.',
      })
    }

    // 2. Usar $ai.chat com modelo 'fast' para transformar o markdown/texto em lista de unidades JSON estruturada
    // e também extrair o fluxo de pagamento com foco na parcela "nas chaves" / data de entrega das chaves.
    try {
      const promptSistema =
        'Você é um especialista em extrair dados de tabelas e mapas de disponibilidade de empreendimentos imobiliários da Vitacon. ' +
        'Seu objetivo é: ' +
        '1) Extrair uma lista de unidades disponíveis, reservadas ou vendidas. ' +
        '2) Identificar no documento/tabela o fluxo ou plano de pagamento, localizando especificamente a parcela "nas chaves", "chaves", "entrega das chaves" ou "conclusão da obra". ' +
        'O prazo de entrega das chaves deve ser DERIVADO DO PRÓPRIO FLUXO DE PAGAMENTO: a fase/parcela "nas chaves" ou última data de entrega do fluxo define a data de entrega. ' +
        'Retorne APENAS um JSON válido no formato: ' +
        '{\n' +
        '  "unidades": [{"unidade": "401", "andar": 4, "tipologia": "NR", "metragem": 20.55, "valor": 435000, "status": "disponivel", "observacoes": ""}],\n' +
        '  "data_entrega_chaves": "YYYY-MM-DD ou YYYY-MM ou null se não encontrada",\n' +
        '  "meses_ate_entrega": 22,\n' +
        '  "detalhes_chaves": "Ex: Parcela nas chaves prevista para Março/2027",\n' +
        '  "resumo": "..."\n' +
        '}\n' +
        'Regras para unidades:\n' +
        "1. 'unidade' deve ser o número ou identificador da unidade (ex: '101', '402', '1401', '12A').\n" +
        "2. 'andar' deve ser um número inteiro (ex: se unidade 401, andar 4; se 1201, andar 12; se não souber, deduza ou deixe null).\n" +
        "3. 'tipologia' deve ser EXATAMENTE um destes 4 valores: 'R2V', 'NR', 'HIS' ou 'HMP'.\n" +
        "4. 'metragem' deve ser um número float em m² (ex: 20.55).\n" +
        "5. 'valor' deve ser um número float em Reais (ex: 435000.00). Remova 'R$', pontos de milhar e converta centavos.\n" +
        "6. 'status' deve ser 'disponivel', 'reservada' ou 'vendida'.\n" +
        'Regras para entrega das chaves:\n' +
        "7. Se encontrar coluna ou linha de 'Chaves', 'Nas Chaves', 'Financiamento/Chaves', 'Entrega', 'Habite-se', verifique a data de vencimento correspondente (ex: '03/2027', 'março de 2027', '30/03/2027'). Converta para YYYY-MM-01. Calcule a diferença em meses a partir de hoje e coloque em 'meses_ate_entrega'.\n" +
        '8. Ignore textos institucionais e retorne estritamente o JSON sem blocos markdown ```.'

      const reply = $ai.chat({
        model: 'fast',
        messages: [
          { role: 'system', content: promptSistema },
          {
            role: 'user',
            content:
              'Hoje é ' +
              new Date().toISOString().slice(0, 10) +
              '. Aqui está o conteúdo extraído da tabela / mapa de disponibilidade:\n\n' +
              rawText.slice(0, 32000),
          },
        ],
      })

      const aiContent =
        reply && reply.choices && reply.choices[0] && reply.choices[0].message
          ? reply.choices[0].message.content
          : ''

      // Limpar possíveis delimitadores de markdown (```json ... ```)
      let jsonStr = aiContent.trim()
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.substring(7)
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.substring(3)
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3)
      }
      jsonStr = jsonStr.trim()

      let parsed = null
      try {
        parsed = JSON.parse(jsonStr)
      } catch (parseErr) {
        console.log(
          'Erro ao parsear JSON da AI:',
          parseErr.message,
          'conteúdo:',
          jsonStr.slice(0, 200),
        )
      }

      if (parsed && Array.isArray(parsed.unidades)) {
        // Normalizar unidades
        const normalizadas = []
        for (let i = 0; i < parsed.unidades.length; i++) {
          const u = parsed.unidades[i]
          let tip = String(u.tipologia || 'NR')
            .toUpperCase()
            .trim()
          if (tip.includes('R2V') || tip.includes('RESID')) {
            tip = 'R2V'
          } else if (tip.includes('HIS')) {
            tip = 'HIS'
          } else if (tip.includes('HMP')) {
            tip = 'HMP'
          } else {
            tip = 'NR'
          }

          let st = String(u.status || 'disponivel')
            .toLowerCase()
            .trim()
          if (st.includes('vend')) {
            st = 'vendida'
          } else if (st.includes('res')) {
            st = 'reservada'
          } else {
            st = 'disponivel'
          }

          const metragemNum =
            typeof u.metragem === 'number'
              ? u.metragem
              : parseFloat(String(u.metragem || 0).replace(',', '.')) || 0
          const valorNum =
            typeof u.valor === 'number'
              ? u.valor
              : parseFloat(
                  String(u.valor || 0)
                    .replace(/[^\d.,]/g, '')
                    .replace(/\.(?=\d{3})/g, '')
                    .replace(',', '.'),
                ) || 0
          const andarNum =
            typeof u.andar === 'number' ? u.andar : parseInt(String(u.andar || ''), 10) || undefined
          const uStr = String(u.unidade || '').trim()

          if (uStr.length > 0) {
            normalizadas.push({
              unidade: uStr,
              andar: andarNum,
              tipologia: tip,
              metragem: metragemNum,
              valor: valorNum,
              status: st,
              observacoes: u.observacoes ? String(u.observacoes) : '',
            })
          }
        }

        // Tratar data_entrega_chaves e meses_ate_entrega detectados
        let dataEntregaChavesDetectada = null
        if (parsed.data_entrega_chaves && typeof parsed.data_entrega_chaves === 'string') {
          const rawData = parsed.data_entrega_chaves.trim()
          if (/^\d{4}-\d{2}-\d{2}$/.test(rawData)) {
            dataEntregaChavesDetectada = rawData
          } else if (/^\d{4}-\d{2}$/.test(rawData)) {
            dataEntregaChavesDetectada = rawData + '-01'
          }
        }

        let mesesDetectados = undefined
        if (typeof parsed.meses_ate_entrega === 'number' && parsed.meses_ate_entrega >= 0) {
          mesesDetectados = Math.round(parsed.meses_ate_entrega)
        }

        return e.json(200, {
          sucesso: true,
          unidades: normalizadas,
          total: normalizadas.length,
          dataEntregaChaves: dataEntregaChavesDetectada,
          mesesAteEntrega: mesesDetectados,
          detalhesChaves: parsed.detalhes_chaves || null,
          resumo: parsed.resumo || normalizadas.length + ' unidades extraídas com sucesso',
          truncated: truncated,
          rawTextPreview: rawText.slice(0, 500),
        })
      }

      // Se o parse da AI falhar, devolve o texto para o cliente tentar o parser local
      return e.json(200, {
        sucesso: false,
        unidades: [],
        rawText: rawText,
        aviso:
          'Não foi possível converter os dados automaticamente em unidades. Você pode colar a tabela como texto.',
      })
    } catch (aiErr) {
      console.log('Erro na chamada de IA:', aiErr.message)
      return e.json(200, {
        sucesso: false,
        unidades: [],
        rawText: rawText,
        aviso: 'Falha na análise automática. O texto extraído está disponível para revisão manual.',
      })
    }
  },
  $apis.requireAuth(),
)
