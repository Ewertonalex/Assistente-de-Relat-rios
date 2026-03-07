import { useRef } from 'react'

export default function DocumentoFinal({
  documento,
  tipoDocumento,
  dados,
  assinatura,
  setAssinatura,
  anexos,
  setAnexos,
  onVoltar,
  onFazerNovo,
  onSalvarPDF,
  onSalvarWord
}) {
  const fileInputRef = useRef(null)

  const handleAdicionarAnexo = (e) => {
    const files = Array.from(e.target.files || [])
    const imagens = files.filter(f => f.type.startsWith('image/'))
    if (imagens.length > 0) {
      setAnexos(prev => [...prev, ...imagens])
    }
    e.target.value = ''
  }

  const handleRemoverAnexo = (index) => {
    setAnexos(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <section className="card documento-final">
      <h2>Documento Final</h2>
      <p className="subtitulo">
        Adicione sua assinatura eletrônica, anexos (opcional) e exporte em PDF ou Word.
      </p>

      <div className="documento-resumo">
        <div className="resumo-header">
          <strong>{tipoDocumento}</strong>
          <p>ASO: {dados.nomeCompleto} | Matrícula: {dados.matricula}</p>
          <p>Destinatário: {dados.destinatario}</p>
        </div>
        <div className="texto-documento">
          {documento.split('\n').map((p, i) => (
            <p key={i}>{p || <br />}</p>
          ))}
        </div>
      </div>

      <div className="secao-assinatura">
        <h3>Assinatura</h3>
        <p className="subtitulo">
          No documento gerado será reservado apenas o espaço para a assinatura eletrônica,
          que será realizada posteriormente pelo ASO no sistema SouGov ou equivalente.
        </p>
      </div>

      <div className="secao-anexos">
        <h3>Anexos</h3>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => fileInputRef.current?.click()}
        >
          + Adicionar anexos (imagens)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleAdicionarAnexo}
          style={{ display: 'none' }}
        />
        {anexos.length > 0 && (
          <div className="lista-anexos">
            {anexos.map((file, i) => (
              <div key={i} className="anexo-item">
                <span>{file.name}</span>
                <button type="button" className="btn-remover" onClick={() => handleRemoverAnexo(i)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="acoes-exportar">
        {onVoltar && (
          <button type="button" className="btn btn-outline" onClick={onVoltar}>
            Voltar à revisão
          </button>
        )}
        {onFazerNovo && (
          <button type="button" className="btn btn-outline acao-limpar" onClick={onFazerNovo}>
            Fazer novo
          </button>
        )}
        <button className="btn btn-primario" onClick={onSalvarPDF}>
          Salvar PDF
        </button>
        <button className="btn btn-secundario" onClick={onSalvarWord}>
          Salvar Word
        </button>
      </div>
    </section>
  )
}
