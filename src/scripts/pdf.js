import { jsPDF } from 'jspdf';
import { capitulos } from '../data/capitulos.js';

const COLORS = {
  primary: [26, 26, 46],
  secondary: [61, 61, 110],
  accent: [74, 111, 165],
  accentLight: [106, 74, 154],
  heart: [74, 122, 181],
  bg: [240, 243, 250],
};

async function loadImage(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function stripHTML(str) {
  return str.replace(/<[^>]*>/g, '');
}

function addPageBackground(doc) {
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, 210, 297, 'F');
}

function addFooter(doc, pageNum) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.accentLight);
  doc.text(String(pageNum), 105, 288, { align: 'center' });
}

function wrapText(doc, text, x, y, maxWidth, lineHeight, opts = {}) {
  const paragraphs = text.split('\n');
  const firstLineIndent = opts.firstLineIndent || 0;
  let currentY = y;
  let hasRendered = false;

  function ensureStyle() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.secondary);
  }

  for (const para of paragraphs) {
    if (para.trim() === '') {
      currentY += lineHeight * 0.7;
      continue;
    }
    const words = para.split(' ');
    let line = '';
    let isLineStart = true;

    for (const word of words) {
      const indent = isLineStart ? firstLineIndent : 0;
      const testLine = line + (line ? ' ' : '') + word;
      if (doc.getTextWidth(testLine) + indent > maxWidth && line) {
        if (currentY + lineHeight > 275) {
          addFooter(doc, doc.internal.getNumberOfPages());
          doc.addPage();
          addPageBackground(doc);
          ensureStyle();
          currentY = 25;
        }
        doc.text(line, x + (isLineStart && !hasRendered ? firstLineIndent : 0), currentY);
        hasRendered = true;
        currentY += lineHeight;
        line = word;
        isLineStart = false;
      } else {
        line = testLine;
        isLineStart = false;
      }
    }
    if (line) {
      if (currentY + lineHeight > 275) {
        addFooter(doc, doc.internal.getNumberOfPages());
        doc.addPage();
        addPageBackground(doc);
        ensureStyle();
        currentY = 25;
      }
      doc.text(line, x + (!hasRendered ? firstLineIndent : 0), currentY);
      hasRendered = true;
      currentY += lineHeight;
    }
  }

  return currentY;
}

export async function generatePDF() {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = 210;
  const margin = 25;
  const maxTextW = pageW - margin * 2;
  const lineH = 6;
  const chapterStartPages = [];

  // ============================================================
  // COVER — portada.png full page
  // ============================================================
  const portadaData = await loadImage('/img/portada.png');
  doc.addImage(portadaData, 'PNG', 0, 0, 210, 297);

  // ============================================================
  // TABLE OF CONTENTS
  // ============================================================
  doc.addPage();
  addPageBackground(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.text('Índice', pageW / 2, 35, { align: 'center' });

  doc.setDrawColor(...COLORS.accentLight);
  doc.setLineWidth(0.5);
  doc.line(margin, 40, pageW - margin, 40);

  let tocY = 52;
  doc.setFontSize(11);
  for (const ch of capitulos) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(`${ch.id}.`, margin, tocY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.secondary);
    doc.text(stripHTML(ch.titulo), margin + 10, tocY);
    tocY += 10;
  }

  addFooter(doc, 2);

  // ============================================================
  // CHAPTER PAGES
  // ============================================================
  for (const item of capitulos) {
    // Chapter title page
    doc.addPage();
    addPageBackground(doc);
    chapterStartPages.push({ id: item.id, page: doc.internal.getNumberOfPages() });

    doc.setFillColor(...COLORS.accentLight);
    doc.rect(margin, 90, pageW - margin * 2, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...COLORS.primary);
    doc.text(`Capítulo ${item.id}`, pageW / 2, 115, { align: 'center' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(...COLORS.accent);
    doc.text(stripHTML(item.titulo), pageW / 2, 132, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.accentLight);
    doc.text(stripHTML(item.resumen), pageW / 2, 155, { maxWidth: maxTextW - 20, align: 'center' });

    addFooter(doc, doc.internal.getNumberOfPages());

    // Chapter content
    doc.addPage();
    addPageBackground(doc);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.primary);
    doc.text(`Capítulo ${item.id}`, margin, 18);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.accentLight);
    doc.text(stripHTML(item.titulo), margin + 30, 18);

    doc.setDrawColor(...COLORS.accentLight);
    doc.setLineWidth(0.3);
    doc.line(margin, 22, pageW - margin, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.secondary);

    let yPos = 32;
    yPos = wrapText(doc, stripHTML(item.contenido), margin, yPos, maxTextW, lineH, { firstLineIndent: 5 });

    // Carta page
    doc.addPage();
    addPageBackground(doc);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.primary);
    doc.text(`Capítulo ${item.id}`, margin, 18);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.accentLight);
    doc.text(stripHTML(item.titulo), margin + 30, 18);

    doc.setDrawColor(...COLORS.accentLight);
    doc.setLineWidth(0.3);
    doc.line(margin, 22, pageW - margin, 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.heart);
    doc.text('Carta', pageW / 2, 34, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.secondary);

    yPos = 42;
    yPos = wrapText(doc, stripHTML(item.carta), margin, yPos, maxTextW, lineH, { firstLineIndent: 5 });
  }

  // Update TOC with page numbers
  doc.setPage(2);
  tocY = 52;
  for (const ch of capitulos) {
    const info = chapterStartPages.find(p => p.id === ch.id);
    if (info) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.accentLight);
      doc.text(String(info.page), pageW - margin - 5, tocY, { align: 'right' });
    }
    tocY += 10;
  }

  // ============================================================
  // FINAL PAGE — contraportada.png
  // ============================================================
  const contraportadaData = await loadImage('/img/contraportada.png');
  doc.addPage();
  doc.addImage(contraportadaData, 'PNG', 0, 0, 210, 297);

  // ============================================================
  // ADD PAGE NUMBERS TO ALL PAGES (skip cover and back cover)
  // ============================================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 2; i <= totalPages - 1; i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  doc.save('12-capitulos-nuestra-historia.pdf');
}
