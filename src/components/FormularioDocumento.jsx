import { useState, useEffect, useRef } from 'react'

const SpeechRecognitionAPI = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

export default function FormularioDocumento({ dados, setDados, tiposDocumento, onGerar, carregando, erro, onLimparErro }) {
  const [mensagemDemora, setMensagemDemora] = useState(false)
  const [gravando, setGravando] = useState(false)
  const [tempoGravacaoSegundos, setTempoGravacaoSegundos] = useState(0)
  const [erroAudio, setErroAudio] = useState('')
  const recognitionRef = useRef(null)
  /** Única string guardada: a transcrição mais longa recebida (evita repetição). */
  const maiorTranscriptRef = useRef('')
  const intervaloRef = useRef(null)
  const iniciandoRef = useRef(false)

  useEffect(() => {
    if (!carregando) {
      setMensagemDemora(false)
      return
    }
    const timer = setTimeout(() => setMensagemDemora(true), 4000)
    return () => clearTimeout(timer)
  }, [carregando])

  const handleChange = (campo, valor) => {
    if (erro && onLimparErro) onLimparErro()
    setDados(prev => ({ ...prev, [campo]: valor }))
  }

  const pararTimer = () => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current)
      intervaloRef.current = null
    }
    setTempoGravacaoSegundos(0)
  }

  const iniciarGravacao = () => {
    if (!SpeechRecognitionAPI) {
      setErroAudio('Seu navegador não suporta gravação por voz. Use Chrome ou Edge, ou digite o texto.')
      return
    }
    if (iniciandoRef.current || gravando) return
    iniciandoRef.current = true
    setErroAudio('')
    maiorTranscriptRef.current = ''
    setTempoGravacaoSegundos(0)
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch (_) {}
      recognitionRef.current = null
    }
    const Recognition = SpeechRecognitionAPI
    const recognition = new Recognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = (event.results[i][0].transcript || '').trim()
        if (!transcript) continue
        if (transcript.length > maiorTranscriptRef.current.length) {
          maiorTranscriptRef.current = transcript
        }
      }
    }
    recognition.onerror = (event) => {
      iniciandoRef.current = false
      if (event.error === 'aborted') return
      if (event.error === 'not-allowed') {
        setErroAudio('Permissão de microfone negada. Permita o acesso nas configurações do navegador.')
      } else if (event.error === 'no-speech') {
        setErroAudio('Nenhuma fala detectada. Fale perto do microfone e tente novamente.')
      } else {
        setErroAudio('Erro ao ouvir. Tente novamente ou digite o texto.')
      }
    }
    recognition.onend = () => {
      iniciandoRef.current = false
      pararTimer()
      setGravando(false)
      const textoFinal = maiorTranscriptRef.current.trim()
      if (textoFinal) {
        setDados(prev => ({
          ...prev,
          ocorrido: prev.ocorrido ? `${prev.ocorrido}\n\n${textoFinal}` : textoFinal
        }))
        setErroAudio('')
      } else {
        setErroAudio('Nenhuma fala detectada. Fale perto do microfone e clique em Gravar novamente.')
      }
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
      setGravando(true)
      intervaloRef.current = setInterval(() => {
        setTempoGravacaoSegundos(s => s + 1)
      }, 1000)
    } catch (err) {
      iniciandoRef.current = false
      recognitionRef.current = null
      setErroAudio('Não foi possível iniciar o microfone. Verifique a permissão ou use Chrome/Edge.')
    }
  }

  const pararGravacao = () => {
    pararTimer()
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
    setGravando(false)
  }

  useEffect(() => {
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current)
      if (recognitionRef.current) recognitionRef.current.abort()
    }
  }, [])

  const formatarTempo = (segundos) => {
    const m = Math.floor(segundos / 60)
    const s = segundos % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const podeGerar = dados.tipoDocumento && dados.nomeCompleto?.trim() && dados.matricula?.trim() && dados.destinatario?.trim() && dados.ocorrido?.trim()

  return (
    <section className="card formulario">
      <h2>Novo Documento</h2>
      <p className="subtitulo">Preencha os dados e descreva o ocorrido. A IA irá gerar o documento formal.</p>

      <div className="campo">
        <label>Tipo de Documento *</label>
        <div className="tipo-doc-botoes" role="group" aria-label="Tipo de documento">
          {(['RDO', 'BO', 'REQUERIMENTO', 'SOLICITACAO']).map(tipo => (
            <button
              key={tipo}
              type="button"
              className={`tipo-doc-btn ${dados.tipoDocumento === tipo ? 'tipo-doc-btn-selecionado' : ''}`}
              onClick={() => handleChange('tipoDocumento', tipo)}
            >
              {tiposDocumento[tipo]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="campo">
          <label>Nome Completo *</label>
          <input
            type="text"
            value={dados.nomeCompleto}
            onChange={e => handleChange('nomeCompleto', e.target.value)}
            placeholder="Nome do ASO"
          />
        </div>
        <div className="campo">
          <label>Matrícula *</label>
          <input
            type="text"
            value={dados.matricula}
            onChange={e => handleChange('matricula', e.target.value)}
            placeholder="Número da matrícula"
          />
        </div>
      </div>

      <div className="campo">
        <label>Destinatário *</label>
        <input
          type="text"
          value={dados.destinatario}
          onChange={e => handleChange('destinatario', e.target.value)}
          placeholder="Ex: Gerência de Segurança, Superintendência..."
        />
      </div>

      <div className="campo campo-ocorrido">
        <label>Descreva o ocorrido *</label>
        <textarea
          value={dados.ocorrido}
          onChange={e => handleChange('ocorrido', e.target.value)}
          placeholder="Conte com suas palavras o que aconteceu. A IA transformará em linguagem formal. Você também pode gravar por áudio."
          rows={6}
        />
        <div className="campo-ocorrido-acoes">
          {SpeechRecognitionAPI ? (
            gravando ? (
              <>
                <span className="tempo-gravacao" aria-live="polite">
                  Gravando… {formatarTempo(tempoGravacaoSegundos)}
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-gravar ativo"
                  onClick={pararGravacao}
                  aria-label="Parar gravação"
                >
                  Parar gravação
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-gravar"
                onClick={iniciarGravacao}
                disabled={carregando}
                aria-label="Gravar áudio para descrever o ocorrido"
              >
                Gravar áudio
              </button>
            )
          ) : (
            <span className="campo-ocorrido-aviso">Gravação por voz disponível no Chrome ou Edge.</span>
          )}
          {SpeechRecognitionAPI && !gravando && (
            <span className="campo-ocorrido-dica">Você pode gravar de novo a qualquer momento para acrescentar ao texto.</span>
          )}
        </div>
        {erroAudio && <p className="campo-ocorrido-erro">{erroAudio}</p>}
      </div>

      {carregando && (
        <div className="estado-geracao">
          <div className="estado-geracao-spinner" aria-hidden />
          <p className="estado-geracao-texto">Redigindo documento…</p>
          {mensagemDemora && (
            <p className="estado-geracao-aviso">Pode levar alguns segundos. Aguarde.</p>
          )}
        </div>
      )}

      {erro && (
        <div className="erro-com-acao">
          <p className="erro-titulo">Não foi possível gerar o documento</p>
          <p className="erro-mensagem">{erro}</p>
          <div className="erro-botoes">
            <button type="button" className="btn btn-outline" onClick={onLimparErro}>
              Tentar novamente
            </button>
            <button type="button" className="btn btn-secundario" onClick={() => { onLimparErro(); setDados({ tipoDocumento: '', nomeCompleto: '', matricula: '', destinatario: '', ocorrido: '' }) }}>
              Refazer
            </button>
          </div>
        </div>
      )}

      {!erro && (
        <button
          className="btn btn-primario"
          onClick={onGerar}
          disabled={!podeGerar || carregando}
        >
          {carregando ? 'Gerando...' : 'Gerar Documento'}
        </button>
      )}
    </section>
  )
}
