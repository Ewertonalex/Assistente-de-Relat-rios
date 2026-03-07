import { describe, it, expect } from 'vitest'
import { extrairTituloEDocumento } from './extrairTituloEDocumento.js'

describe('extrairTituloEDocumento', () => {
  it('quando a IA envia título na primeira linha e corpo depois, separa corretamente', () => {
    const raw = `Solicitação de extrato de pagamento 2025

Por meio deste, solicito o extrato de pagamento referente ao ano de 2025.
Justifico a presente solicitação para fins de acompanhamento.`
    const { titulo, documento } = extrairTituloEDocumento(raw)
    expect(titulo).toBe('Solicitação de extrato de pagamento 2025')
    expect(documento).toContain('Por meio deste, solicito')
    expect(documento).not.toContain('Solicitação de extrato de pagamento 2025')
  })

  it('quando a IA envia só o corpo (um único parágrafo longo), deriva título da primeira frase', () => {
    const raw = `O Assistente de Segurança Operacional (ASO) solicita, por meio deste documento, o seu extrato de pagamento referente ao ano de 2025 para fins de acompanhamento e verificação de seus pagamentos ao longo do ano, visando garantir a exatidão e transparência em sua remuneração.`
    const { titulo, documento } = extrairTituloEDocumento(raw)
    expect(titulo.length).toBeGreaterThan(0)
    expect(titulo).not.toBe('Assunto do documento')
    expect(documento).toBe(raw)
  })

  it('nunca retorna título vazio; usa primeira frase ou fallback', () => {
    const raw = `Solicito extrato de pagamento.

Justifico para acompanhamento.`
    const { titulo } = extrairTituloEDocumento(raw)
    expect(titulo.trim().length).toBeGreaterThan(0)
  })

  it('com resposta vazia, retorna fallback de documento e título', () => {
    const { titulo, documento } = extrairTituloEDocumento('')
    expect(documento).toBe('Não foi possível gerar o documento.')
    expect(titulo).toBe('Relato de ocorrência')
  })

  it('primeira linha curta como título (até 180 chars) é usada como assunto', () => {
    const tituloCurto = 'Abordagem a passageiro na Estação Central'
    const raw = `${tituloCurto}

Desloquei-me ao local por volta das 14h.`
    const { titulo, documento } = extrairTituloEDocumento(raw)
    expect(titulo).toBe(tituloCurto)
    expect(documento).toContain('Desloquei-me')
  })

  it('limita título a 200 caracteres', () => {
    const tituloLongo = 'A'.repeat(250)
    const raw = `${tituloLongo}

Parágrafo único.`
    const { titulo } = extrairTituloEDocumento(raw)
    expect(titulo.length).toBeLessThanOrEqual(200)
  })

  it('quando a IA envia "Relato de ocorrência" na primeira linha e corpo com conteúdo, deriva título do corpo (nunca retorna genérico)', () => {
    const raw = `Relato de ocorrência

Eu, [nome do ASO], venho por meio deste requerimento solicitar minhas férias para o mês de junho de 2026. O período solicitado compreende os dias 1 a 10 de junho.

Justifico meu pedido com base nas necessidades pessoais.`
    const { titulo, documento } = extrairTituloEDocumento(raw)
    expect(titulo).not.toBe('Relato de ocorrência')
    expect(titulo.trim().length).toBeGreaterThan(0)
    expect(documento).toContain('solicitar minhas férias')
    expect(titulo.toLowerCase()).not.toMatch(/^relato\s+de\s+ocorr[eê]ncia$/)
  })
})
