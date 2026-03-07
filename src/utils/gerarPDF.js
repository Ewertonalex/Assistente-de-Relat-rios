import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const EMPRESA_NOME = 'COMPANHIA BRASILEIRA DE TRENS URBANOS - CBTU';
const COR_AZUL = [0, 80, 158];
const COR_CINZA_HEAD = [66, 66, 66];
const COR_CINZA_ALT = [248, 249, 250];

export async function gerarPDF(dados, assinaturaBase64, anexos) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 24;

  // Logo centralizado
  try {
    const logoBase64 = await fetchImageAsBase64('/images/CBTU_Logo.svg.png');
    if (logoBase64) {
      const img = await loadImage(logoBase64);
      const maxLogoWidth = 32;
      const ratio = img.height / img.width || 1;
      const imgW = maxLogoWidth;
      const imgH = Math.min(imgW * ratio, 14);
      const logoX = margin + (contentWidth - imgW) / 2;
      doc.addImage(logoBase64, 'PNG', logoX, yPos, imgW, imgH);
      yPos += imgH + 8;
    }
  } catch (e) {
    console.warn('Logo não carregada:', e);
  }

  // Nome da empresa
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COR_AZUL);
  doc.text(EMPRESA_NOME, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Tipo do documento
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(dados.tipoDocumento.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  yPos += 14;

  // Linha separadora
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Tabela de identificação (compacta)
  doc.autoTable({
    startY: yPos,
    head: [['Campo', 'Informação']],
    body: [
      ['Nome do ASO', dados.nomeCompleto],
      ['Matrícula', dados.matricula],
      ['Data', dados.data],
      ['Destinatário', dados.destinatario],
      ['Protocolo', '']
    ],
    theme: 'plain',
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    headStyles: {
      fillColor: COR_CINZA_HEAD,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    alternateRowStyles: {
      fillColor: COR_CINZA_ALT
    },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    didDrawPage: (data) => {}
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Corpo do documento: apenas o texto gerado pela IA (título já vem no texto)
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  const lineHeight = 5.5;
  const docTexto = (dados.documento || '').trim();
  const paragrafos = docTexto.split(/\n\n+/).filter(p => p.trim());
  for (const p of paragrafos) {
    const lines = doc.splitTextToSize(p.trim(), contentWidth);
    for (const line of lines) {
      if (yPos > pageHeight - 35) {
        doc.addPage();
        yPos = 25;
      }
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    }
    yPos += lineHeight * 0.5; // espaço entre parágrafos
  }

  yPos += 10;

  // Nova página se necessário para encerramento
  if (yPos > pageHeight - 45) {
    doc.addPage();
    yPos = 25;
  }

  // Atenciosamente
  doc.setFontSize(10);
  doc.text('Atenciosamente,', margin, yPos);
  yPos += 18;

  // Espaço em branco para assinatura
  yPos += 30;

  // Anexos
  if (anexos && anexos.length > 0) {
    for (const anexo of anexos) {
      doc.addPage();
      yPos = 25;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COR_AZUL);
      doc.text('Anexo', margin, yPos);
      yPos += 10;
      doc.setTextColor(0, 0, 0);
      try {
        const fmt = (anexo.type || 'image/png').toLowerCase().includes('jpeg') ? 'JPEG' : 'PNG';
        const img = await loadImage(anexo.data);
        const maxW = contentWidth;
        const maxH = 230;
        let imgW = img.width;
        let imgH = img.height;
        const ratio = Math.min(maxW / imgW, maxH / imgH);
        imgW *= ratio;
        imgH *= ratio;
        const xCentered = margin + (maxW - imgW) / 2;
        doc.addImage(anexo.data, fmt, xCentered, yPos, imgW, imgH);
      } catch (e) {
        doc.setFont('helvetica', 'normal');
        doc.text('(Imagem não pôde ser incluída)', margin, yPos);
      }
    }
  }

  // Rodapé com numeração em todas as páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const footerY = pageHeight - 12;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, footerY, { align: 'center' });
  }

  const nomeArquivo = `documento_${dados.tipoDocumento.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nomeArquivo);
}

async function fetchImageAsBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
