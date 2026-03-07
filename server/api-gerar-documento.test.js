/**
 * Testa a lógica da API de geração de documento: simula respostas da IA (raw)
 * e verifica se o título extraído vem correto (nunca "Relato de ocorrência" quando há conteúdo).
 */
import { describe, it, expect } from 'vitest'
import { extrairTituloEDocumento } from './utils/extrairTituloEDocumento.js'

describe('API gerar-documento (simulação da IA)', () => {
  it('quando a IA retorna título na primeira linha (ex.: Solicitação de férias), título vem correto', () => {
    const rawSimulado = `Solicitação de férias

Por meio deste, solicito minhas férias para o mês de junho de 2026. O período solicitado compreende os dias 1 a 10 de junho.

Justifico meu pedido com base nas necessidades pessoais.`
    const { titulo, documento } = extrairTituloEDocumento(rawSimulado)
    expect(titulo).toBe('Solicitação de férias')
    expect(titulo).not.toBe('Relato de ocorrência')
    expect(documento).toContain('solicito minhas férias')
    expect(documento).not.toContain('Solicitação de férias')
  })

  it('quando a IA retorna "Relato de ocorrência" na primeira linha e corpo sobre férias, título deve ser derivado (ex.: Requerimento de férias)', () => {
    const rawSimulado = `Relato de ocorrência

Eu, [nome do ASO], venho por meio deste requerimento solicitar minhas férias para o mês de junho de 2026. O período solicitado para gozo das férias compreende os dias 1 a 10 de junho de 2026.

Justifico meu pedido com base nas necessidades pessoais.`
    const { titulo, documento } = extrairTituloEDocumento(rawSimulado)
    expect(titulo).not.toBe('Relato de ocorrência')
    expect(titulo.toLowerCase()).toMatch(/f[eé]rias/)
    expect(['Requerimento de férias', 'Solicitação de férias']).toContain(titulo)
    expect(documento).toContain('solicitar minhas férias')
  })

  it('quando a IA retorna Requerimento de férias na primeira linha, título vem correto', () => {
    const rawSimulado = `Requerimento de férias

Eu, [nome do ASO], venho por meio deste requerimento solicitar minhas férias para o período de 1 a 10 de junho de 2026.`
    const { titulo, documento } = extrairTituloEDocumento(rawSimulado)
    expect(titulo).toBe('Requerimento de férias')
    expect(titulo).not.toBe('Relato de ocorrência')
    expect(documento).toContain('solicitar minhas férias')
  })

  it('resposta da API nunca deve ter título "Relato de ocorrência" quando o documento tem conteúdo sobre férias', () => {
    const cenarios = [
      `Solicitação de férias\n\nPor meio deste, solicito férias para junho de 2026.`,
      `Relato de ocorrência\n\nPor meio deste requerimento solicito minhas férias para junho de 2026.`
    ]
    for (const raw of cenarios) {
      const { titulo } = extrairTituloEDocumento(raw)
      expect(titulo, `raw: ${raw.slice(0, 50)}...`).not.toBe('Relato de ocorrência')
    }
  })
})
