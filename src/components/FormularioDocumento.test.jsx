import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FormularioDocumento from './FormularioDocumento'

const tiposDocumento = {
  RDO: 'Relatório de Ocorrências',
  BO: 'Boletim de Ocorrências',
  REQUERIMENTO: 'Requerimento',
  SOLICITACAO: 'Solicitação'
}

function renderFormulario(overrides = {}) {
  const defaultProps = {
    dados: {
      tipoDocumento: '',
      nomeCompleto: '',
      matricula: '',
      destinatario: '',
      ocorrido: ''
    },
    setDados: vi.fn(),
    tiposDocumento,
    onGerar: vi.fn(),
    carregando: false,
    erro: '',
    onLimparErro: vi.fn(),
    ...overrides
  }
  return render(<FormularioDocumento {...defaultProps} />)
}

describe('FormularioDocumento', () => {
  it('renderiza título e os quatro botões de tipo de documento', () => {
    renderFormulario()
    expect(screen.getByRole('heading', { name: /novo documento/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /relatório de ocorrências/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /boletim de ocorrências/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /requerimento/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /solicitação/i })).toBeInTheDocument()
  })

  it('ao clicar em um tipo, chama setDados com updater que define tipoDocumento', () => {
    const setDados = vi.fn()
    renderFormulario({ setDados })
    fireEvent.click(screen.getByRole('button', { name: /solicitação/i }))
    expect(setDados).toHaveBeenCalled()
    const updater = setDados.mock.calls[0][0]
    expect(typeof updater).toBe('function')
    const novoEstado = updater({ tipoDocumento: '', nomeCompleto: '', matricula: '', destinatario: '', ocorrido: '' })
    expect(novoEstado.tipoDocumento).toBe('SOLICITACAO')
  })

  it('botão Gerar Documento está desabilitado quando falta ocorrido', () => {
    renderFormulario({
      dados: {
        tipoDocumento: 'RDO',
        nomeCompleto: 'João',
        matricula: '123',
        destinatario: 'RH',
        ocorrido: ''
      }
    })
    const btn = screen.getByRole('button', { name: /gerar documento/i })
    expect(btn).toBeDisabled()
  })

  it('botão Gerar Documento está habilitado quando todos os campos obrigatórios estão preenchidos', () => {
    renderFormulario({
      dados: {
        tipoDocumento: 'RDO',
        nomeCompleto: 'João',
        matricula: '123',
        destinatario: 'RH',
        ocorrido: 'Ocorrência relatada.'
      }
    })
    const btn = screen.getByRole('button', { name: /gerar documento/i })
    expect(btn).not.toBeDisabled()
  })

  it('campo Descreva o ocorrido existe e aceita texto', () => {
    const setDados = vi.fn()
    renderFormulario({ setDados })
    const textarea = screen.getByPlaceholderText(/conte com suas palavras/i)
    expect(textarea).toBeInTheDocument()
    fireEvent.change(textarea, { target: { value: 'Teste ocorrência' } })
    expect(setDados).toHaveBeenCalled()
  })
})
