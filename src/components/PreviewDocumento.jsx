import { useState } from 'react'

export default function PreviewDocumento({ documento, tipoDocumento, dados, onEditar, onAceitar, onRefazer, onFazerNovo }) {
  const [editando, setEditando] = useState(false)
  const [textoEditado, setTextoEditado] = useState(documento)

  const handleSalvarEdicao = () => {
    onEditar(textoEditado)
    setEditando(false)
  }

  return (
    <section className="card preview">
      <h2>Sugestão de Documento</h2>
      <p className="subtitulo">
        Revise o documento gerado pela IA. Você pode editar o texto ou aceitar para prosseguir.
      </p>

      <div className="preview-documento">
        <div className="preview-header">
          <strong>{tipoDocumento}</strong>
          <p>ASO: {dados.nomeCompleto} | Matrícula: {dados.matricula}</p>
          <p>Destinatário: {dados.destinatario}</p>
        </div>

        {editando ? (
          <div className="area-edicao">
            <textarea
              value={textoEditado}
              onChange={e => setTextoEditado(e.target.value)}
              rows={16}
            />
            <div className="botoes-edicao">
              <button className="btn btn-secundario" onClick={() => setEditando(false)}>
                Cancelar
              </button>
              <button className="btn btn-primario" onClick={handleSalvarEdicao}>
                Salvar alterações
              </button>
            </div>
          </div>
        ) : (
          <div className="texto-documento">
            {documento.split('\n').map((p, i) => (
              <p key={i}>{p || <br />}</p>
            ))}
          </div>
        )}
      </div>

      <div className="acoes-preview">
        <button className="btn btn-outline" onClick={onRefazer}>
          Voltar ao formulário
        </button>
        {onFazerNovo && (
          <button type="button" className="btn btn-outline acao-limpar" onClick={onFazerNovo}>
            Fazer novo
          </button>
        )}
        {!editando ? (
          <button className="btn btn-secundario" onClick={() => { setTextoEditado(documento); setEditando(true) }}>
            Editar
          </button>
        ) : null}
        {!editando && (
          <button className="btn btn-primario" onClick={onAceitar}>
            Aceitar e Continuar
          </button>
        )}
      </div>
    </section>
  )
}
