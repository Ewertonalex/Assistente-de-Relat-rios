import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

// Mock dos módulos que dependem de browser/Node
vi.mock('./utils/gerarPDF', () => ({ gerarPDF: vi.fn().mockResolvedValue(undefined) }))
vi.mock('./utils/gerarWord', () => ({ gerarWord: vi.fn().mockResolvedValue(undefined) }))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inicia na etapa formulário com título Novo Documento', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /novo documento/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /gerar documento/i })).toBeInTheDocument()
  })

  it('exibe botões de tipo de documento (RDO, BO, Requerimento, Solicitação)', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /relatório de ocorrências/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /solicitação/i })).toBeInTheDocument()
  })

  it('exibe links Sobre e Como usar no header', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /sobre o projeto/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /como usar/i })).toBeInTheDocument()
  })
})
