import { useState } from 'react'
import './App.css'
import FormularioDocumento from './components/FormularioDocumento'
import PreviewDocumento from './components/PreviewDocumento'
import DocumentoFinal from './components/DocumentoFinal'
import Modal from './components/Modal'
import { gerarPDF } from './utils/gerarPDF'
import { gerarWord } from './utils/gerarWord'

const TIPOS_DOCUMENTO = {
  RDO: 'Relatório de Ocorrências',
  BO: 'Boletim de Ocorrências',
  REQUERIMENTO: 'Requerimento',
  SOLICITACAO: 'Solicitação'
}

function App() {
  const [etapa, setEtapa] = useState('formulario') // formulario | preview | final
  const [dados, setDados] = useState({
    tipoDocumento: '',
    nomeCompleto: '',
    matricula: '',
    destinatario: '',
    ocorrido: ''
  })
  const [documentoGerado, setDocumentoGerado] = useState('')
  const [tipoDocumentoNome, setTipoDocumentoNome] = useState('')
  const [assinatura, setAssinatura] = useState(null)
  const [anexos, setAnexos] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(null) // 'sobre' | 'como-usar' | null

  const handleGerarDocumento = async () => {
    setCarregando(true)
    setErro('')
    try {
      const res = await fetch('/api/gerar-documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoDocumento: dados.tipoDocumento,
          nomeCompleto: dados.nomeCompleto,
          matricula: dados.matricula,
          destinatario: dados.destinatario,
          ocorrido: dados.ocorrido
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.erro || 'Erro ao gerar documento')
      setDocumentoGerado(json.documento)
      setTipoDocumentoNome(json.tipoDocumento)
      setEtapa('preview')
    } catch (err) {
      const msg = err.message || 'Erro ao gerar documento'
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        setErro('Sem conexão. Verifique sua internet e tente novamente.')
      } else if (msg.includes('limit') || msg.includes('rate') || msg.includes('429')) {
        setErro('Muitas requisições. Aguarde alguns minutos e tente novamente.')
      } else {
        setErro(msg)
      }
    } finally {
      setCarregando(false)
    }
  }

  const handleAceitarDocumento = () => {
    setEtapa('final')
  }

  const handleRefazer = () => {
    setEtapa('formulario')
    setDocumentoGerado('')
  }

  const handleEditar = (novoTexto) => {
    setDocumentoGerado(novoTexto)
  }

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ data: reader.result, type: file.type })
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleSalvarPDF = async () => {
    const anexosBase64 = await Promise.all(anexos.map(fileToBase64))
    const dadosDoc = {
      tipoDocumento: tipoDocumentoNome,
      nomeCompleto: dados.nomeCompleto,
      matricula: dados.matricula,
      destinatario: dados.destinatario,
      documento: documentoGerado,
      data: new Date().toLocaleDateString('pt-BR')
    }
    await gerarPDF(dadosDoc, assinatura, anexosBase64)
  }

  const handleSalvarWord = async () => {
    const anexosBase64 = await Promise.all(anexos.map(fileToBase64))
    const dadosDoc = {
      tipoDocumento: tipoDocumentoNome,
      nomeCompleto: dados.nomeCompleto,
      matricula: dados.matricula,
      destinatario: dados.destinatario,
      documento: documentoGerado,
      data: new Date().toLocaleDateString('pt-BR')
    }
    await gerarWord(dadosDoc, assinatura, anexosBase64)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <img
              src="/images/CBTU_Logo.svg.png"
              alt="Logo CBTU"
              className="header-logo"
            />
            <div className="header-text">
              <h1>Assistente de Relatórios CBTU</h1>
              <p>Documentos para ASO - Segurança Metroferroviária</p>
            </div>
          </div>
          <nav className="header-menu" aria-label="Informações do projeto">
            <button type="button" className="header-menu-item" onClick={() => setModalAberto('sobre')}>
              Sobre o projeto
            </button>
            <button type="button" className="header-menu-item" onClick={() => setModalAberto('como-usar')}>
              Como usar
            </button>
          </nav>
        </div>
        <div className="header-rail-row" aria-hidden="true">
          <div className="header-rail">
            <div className="header-rail-sleepers" />
            <div className="header-rail-track" />
            <div className="header-locomotive">
              <div className="header-smoke header-smoke-1" />
              <div className="header-smoke header-smoke-2" />
              <div className="header-smoke header-smoke-3" />
              <div className="header-locomotive-body">
                <div className="header-locomotive-cabin" />
                <div className="header-locomotive-chimney" />
                <div className="header-locomotive-wheels">
                  <span className="header-wheel" />
                  <span className="header-wheel" />
                  <span className="header-wheel" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        {etapa === 'formulario' && (
          <FormularioDocumento
            dados={dados}
            setDados={setDados}
            tiposDocumento={TIPOS_DOCUMENTO}
            onGerar={handleGerarDocumento}
            carregando={carregando}
            erro={erro}
            onLimparErro={() => setErro('')}
          />
        )}

        {etapa === 'preview' && (
          <PreviewDocumento
            documento={documentoGerado}
            tipoDocumento={tipoDocumentoNome}
            dados={dados}
            onEditar={handleEditar}
            onAceitar={handleAceitarDocumento}
            onRefazer={handleRefazer}
          />
        )}

        {etapa === 'final' && (
          <DocumentoFinal
            documento={documentoGerado}
            tipoDocumento={tipoDocumentoNome}
            dados={dados}
            assinatura={assinatura}
            setAssinatura={setAssinatura}
            anexos={anexos}
            setAnexos={setAnexos}
            onSalvarPDF={handleSalvarPDF}
            onSalvarWord={handleSalvarWord}
          />
        )}
      </main>

      <footer className="footer">
        <p>
          <a href="https://www.gov.br/cbtu/pt-br" target="_blank" rel="noopener noreferrer" className="footer-link-cbtu">CBTU - Companhia Brasileira de Trens Urbanos</a>
        </p>
        <p>Desenvolvido por <strong>Ewerton Alexander</strong></p>
      </footer>

      {modalAberto === 'sobre' && (
        <Modal titulo="Sobre o projeto" onFechar={() => setModalAberto(null)}>
          <div className="modal-conteudo">
            <h3>O que é</h3>
            <p>O <strong>Assistente de Relatórios CBTU</strong> é uma ferramenta web para ASO Segurança da CBTU gerarem documentos oficiais de forma ágil e padronizada. Com ela, é possível criar RDO (Relatório de Ocorrências), BO (Boletim de Ocorrências), Requerimentos e Solicitações, com o texto redigido por inteligência artificial e revisável antes da exportação em PDF ou Word.</p>

            <h3>De qual necessidade surgiu</h3>
            <p>A rotina da segurança metroferroviária exige diversos relatórios e documentos formais. Redigir tudo manualmente consome tempo e pode gerar inconsistências de tom e formato. A necessidade foi de <strong>agilizar e padronizar</strong> a produção desses documentos, mantendo a linguagem adequada e liberando o ASO para outras atividades.</p>

            <h3>A ideia</h3>
            <p>O usuário preenche um formulário simples (tipo de documento, nome, matrícula, destinatário e descrição do ocorrido). A IA (Groq) redige o texto em linguagem formal e objetiva. O ASO visualiza o resultado, pode editar ou refazer e, ao aceitar, segue para a tela final onde pode incluir assinatura e anexos e exportar em PDF ou Word, com layout padronizado e numeração de páginas.</p>

            <h3>Quem fez</h3>
            <p>Desenvolvido por <strong>Ewerton Alexander</strong>, para uso da equipe de Segurança Metroferroviária da CBTU. Formado na área de tecnologia, com grande experiência em desenvolvimento e testes de software, atua na criação de soluções que unem qualidade, usabilidade e confiabilidade, sempre com foco em entregar ferramentas que facilitam o dia a dia das equipes.</p>
          </div>
        </Modal>
      )}

      {modalAberto === 'como-usar' && (
        <Modal titulo="Como usar" onFechar={() => setModalAberto(null)}>
          <div className="modal-conteudo modal-conteudo-lista">
            <p className="modal-intro">Siga o passo a passo abaixo para gerar e exportar seus documentos.</p>

            <ol>
              <li>
                <strong>Escolha o tipo de documento</strong><br />
                Selecione no formulário: RDO (Relatório de Ocorrências), BO (Boletim de Ocorrências), Requerimento ou Solicitação.
              </li>
              <li>
                <strong>Preencha os dados</strong><br />
                Informe seu nome completo, matrícula, o destinatário do documento e, no campo “Ocorrido”, descreva de forma clara o que aconteceu ou o que se solicita. Quanto mais objetivo e completo, melhor o texto gerado.
              </li>
              <li>
                <strong>Gere o documento</strong><br />
                Clique em <strong>“Gerar Documento”</strong>. A IA irá redigir o texto. Pode levar alguns segundos; aguarde a mensagem de conclusão. Em caso de erro (rede ou limite de uso), use “Tentar novamente” ou “Refazer”.
              </li>
              <li>
                <strong>Revise o texto (Preview)</strong><br />
                Leia o texto gerado. Se quiser, edite diretamente na caixa de texto. Se estiver tudo certo, clique em <strong>“Aceitar e Continuar”</strong>. Se preferir mudar os dados do formulário, use <strong>“Refazer”</strong>.
              </li>
              <li>
                <strong>Tela final – assinatura e anexos</strong><br />
                Na tela do documento final você pode (opcionalmente) desenhar uma assinatura no espaço reservado e adicionar anexos (imagens). Esses elementos serão incluídos no PDF e no Word.
              </li>
              <li>
                <strong>Exportar</strong><br />
                Use <strong>“Salvar PDF”</strong> e/ou <strong>“Salvar Word”</strong> para baixar o documento. O arquivo terá cabeçalho com logo CBTU, tabela de identificação, descrição formatada e numeração de páginas. A assinatura e os anexos aparecem ao final, quando preenchidos.
              </li>
            </ol>

            <p className="modal-dica">Dica: mantenha a descrição do ocorrido objetiva e cronológica para RDO e BO; para Requerimentos e Solicitações, deixe claro o pedido e o motivo.</p>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default App
