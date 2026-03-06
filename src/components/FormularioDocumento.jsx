import { useState, useEffect } from 'react'

export default function FormularioDocumento({ dados, setDados, tiposDocumento, onGerar, carregando, erro, onLimparErro }) {
  const [mensagemDemora, setMensagemDemora] = useState(false)

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

  const podeGerar = dados.tipoDocumento && dados.nomeCompleto?.trim() && dados.matricula?.trim() && dados.destinatario?.trim() && dados.ocorrido?.trim()

  return (
    <section className="card formulario">
      <h2>Novo Documento</h2>
      <p className="subtitulo">Preencha os dados e descreva o ocorrido. A IA irá gerar o documento formal.</p>

      <div className="campo">
        <label>Tipo de Documento *</label>
        <select
          value={dados.tipoDocumento}
          onChange={e => handleChange('tipoDocumento', e.target.value)}
        >
          <option value="">Selecione o tipo</option>
          <option value="RDO">{tiposDocumento.RDO}</option>
          <option value="BO">{tiposDocumento.BO}</option>
          <option value="REQUERIMENTO">{tiposDocumento.REQUERIMENTO}</option>
          <option value="SOLICITACAO">{tiposDocumento.SOLICITACAO}</option>
        </select>
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

      <div className="campo">
        <label>Descreva o ocorrido *</label>
        <textarea
          value={dados.ocorrido}
          onChange={e => handleChange('ocorrido', e.target.value)}
          placeholder="Conte com suas palavras o que aconteceu. A IA transformará em linguagem formal."
          rows={6}
        />
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
