import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  Footer,
  PageNumber
} from 'docx';

const EMPRESA_NOME = 'COMPANHIA BRASILEIRA DE TRENS URBANOS - CBTU';
const COR_AZUL_HEX = '00509E';
const COR_CINZA_HEAD = '424242';
const COR_CINZA_ALT = 'F8F9FA';

function base64ToUint8Array(base64) {
  const binary = atob(base64.split(',')[1] || base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function gerarWord(dados, assinaturaBase64, anexos) {
  const sectionChildren = [];
  const spacingPadrao = 280;
  const spacingEntreSecoes = 320;

  // Logo centralizado – proporção original (1280×300 ≈ 4,27:1)
  try {
    const res = await fetch('/images/CBTU_Logo.svg.png');
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const logoData = new Uint8Array(arrayBuffer);
    const logoWidth = 140;
    const logoHeight = Math.round(logoWidth / (1280 / 300)); // ~33
    sectionChildren.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: logoData,
            transformation: { width: logoWidth, height: logoHeight },
            type: 'png'
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 320 }
      })
    );
  } catch (e) {
    console.warn('Logo não carregada:', e);
  }

  // Nome da empresa
  sectionChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: EMPRESA_NOME,
          bold: true,
          size: 22,
          color: COR_AZUL_HEX
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 }
    })
  );

  // Tipo do documento
  sectionChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: dados.tipoDocumento.toUpperCase(),
          bold: true,
          size: 26
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 }
    })
  );

  // Tabela de identificação – mesmo padrão visual do PDF
  const tabelaIdentificacao = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Campo', bold: true, size: 20, color: 'FFFFFF' })] })],
            shading: { fill: COR_CINZA_HEAD }
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Informação', bold: true, size: 20, color: 'FFFFFF' })] })],
            shading: { fill: COR_CINZA_HEAD }
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Nome do ASO', bold: true, size: 20 })] })],
            shading: { fill: COR_CINZA_ALT }
          }),
          new TableCell({ children: [new Paragraph(dados.nomeCompleto)] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Matrícula', bold: true, size: 20 })] })],
            shading: { fill: COR_CINZA_ALT }
          }),
          new TableCell({ children: [new Paragraph(dados.matricula)] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Data', bold: true, size: 20 })] })],
            shading: { fill: COR_CINZA_ALT }
          }),
          new TableCell({ children: [new Paragraph(dados.data)] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Destinatário', bold: true, size: 20 })] })],
            shading: { fill: COR_CINZA_ALT }
          }),
          new TableCell({ children: [new Paragraph(dados.destinatario)] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Protocolo', bold: true, size: 20 })] })],
            shading: { fill: COR_CINZA_ALT }
          }),
          new TableCell({ children: [new Paragraph('')] })
        ]
      })
    ]
  });

  sectionChildren.push(tabelaIdentificacao);
  sectionChildren.push(new Paragraph({ text: '', spacing: { after: spacingEntreSecoes } }));

  // Título Descrição do documento
  sectionChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Descrição do documento',
          bold: true,
          size: 20,
          color: COR_AZUL_HEX
        })
      ],
      spacing: { after: 180 }
    })
  );

  // Parágrafos da descrição – justificados
  const paragrafos = dados.documento.split(/\n\n+/).filter(p => p.trim());
  for (const p of paragrafos) {
    sectionChildren.push(
      new Paragraph({
        children: [new TextRun({ text: p.trim(), size: 21 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: spacingPadrao }
      })
    );
  }

  sectionChildren.push(new Paragraph({ text: '', spacing: { after: spacingEntreSecoes } }));

  // Atenciosamente
  sectionChildren.push(
    new Paragraph({
      children: [new TextRun({ text: 'Atenciosamente,', size: 20 })],
      spacing: { after: 400 }
    })
  );

  // Espaço em branco para assinatura
  sectionChildren.push(
    new Paragraph({ text: '', spacing: { after: 400 } }),
    new Paragraph({ text: '', spacing: { after: 400 } })
  );

  // Anexos
  if (anexos && anexos.length > 0) {
    for (const anexo of anexos) {
      sectionChildren.push(new Paragraph({ text: '', pageBreakBefore: true }));
      sectionChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Anexo',
              bold: true,
              size: 24,
              color: COR_AZUL_HEX
            })
          ],
          spacing: { after: 240 }
        })
      );
      try {
        const anexoData = base64ToUint8Array(anexo.data);
        const tipo = (anexo.type || 'png').toLowerCase().replace('jpeg', 'jpg');
        sectionChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: anexoData,
                transformation: { width: 450, height: 300 },
                type: tipo
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          })
        );
      } catch (e) {
        sectionChildren.push(new Paragraph({ text: '(Imagem não incluída)' }));
      }
    }
  }

  const rodape = new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: 'Página ' }),
          PageNumber.CURRENT,
          new TextRun({ text: ' de ' }),
          PageNumber.TOTAL_PAGES
        ],
        alignment: AlignmentType.CENTER
      })
    ]
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: sectionChildren,
      footers: { default: rodape }
    }]
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `documento_${dados.tipoDocumento.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
