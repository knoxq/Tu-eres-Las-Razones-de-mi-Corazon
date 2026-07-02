import { jsPDF } from 'jspdf';
import { prologo, capitulos, epilogo } from '../data/capitulos.js';

const COLORS = {
  primary: [26, 26, 46],
  secondary: [61, 61, 110],
  accent: [74, 111, 165],
  accentLight: [106, 74, 154],
  heart: [74, 122, 181],
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

  function handleNewPage() {
    addFooter(doc, doc.internal.getNumberOfPages());
    doc.addPage();
    if (opts.onNewPage) opts.onNewPage();
    ensureStyle();
    currentY = 25;
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
          handleNewPage();
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
        handleNewPage();
      }
      doc.text(line, x + (!hasRendered ? firstLineIndent : 0), currentY);
      hasRendered = true;
      currentY += lineHeight;
    }
  }

  return currentY;
}

function addChapterHeader(doc, item, margin, pageW) {
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
}

export async function generatePDF() {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = 210;
  const margin = 25;
  const maxTextW = pageW - margin * 2;
  const lineH = 6;

  // ============================================================
  // LOAD IMAGES
  // ============================================================
  const plantillaData = await loadImage('/img/plantilla.png');
  const contenidoData = await loadImage('/img/contenido.png');
  const portadaData = await loadImage('/img/portada.png');
  const contraportadaData = await loadImage('/img/contraportada.png');

  function addTitleBg() {
    doc.addImage(plantillaData, 'PNG', 0, 0, 210, 297);
  }

  function addContentBg() {
    doc.addImage(contenidoData, 'PNG', 0, 0, 210, 297);
  }

  // ============================================================
  // COVER
  // ============================================================
  doc.addImage(portadaData, 'PNG', 0, 0, 210, 297);

  // ============================================================
  // TABLE OF CONTENTS
  // ============================================================
  doc.addPage();
  addTitleBg();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.text('Índice', pageW / 2, 35, { align: 'center' });

  doc.setDrawColor(...COLORS.accentLight);
  doc.setLineWidth(0.5);
  doc.line(margin, 40, pageW - margin, 40);

  let tocY = 52;
  doc.setFontSize(11);

  // Prólogo entry
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.accent);
  doc.text('Prólogo', margin, tocY);
  tocY += 10;

  // Chapter entries
  for (const ch of capitulos) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text(`${ch.id}.`, margin, tocY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.secondary);
    doc.text(stripHTML(ch.titulo), margin + 10, tocY);
    tocY += 10;
  }

  // Epílogo entry
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORS.accent);
  doc.text('Epílogo', margin, tocY);

  addFooter(doc, 2);

  // ============================================================
  // PRÓLOGO
  // ============================================================
  doc.addPage();
  addTitleBg();
  const prologoPage = doc.internal.getNumberOfPages();

  doc.setFillColor(...COLORS.accentLight);
  doc.rect(margin, 90, pageW - margin * 2, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.primary);
  doc.text('Prólogo', pageW / 2, 115, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.secondary);

  let yPos = 135;
  wrapText(doc, stripHTML(prologo.contenido), margin, yPos, maxTextW, lineH, {
    firstLineIndent: 5,
    onNewPage: addTitleBg,
  });

  addFooter(doc, prologoPage);

  // ============================================================
  // CHAPTER PAGES
  // ============================================================
  const chapterStartPages = [];

  for (const item of capitulos) {
    // Chapter title page
    doc.addPage();
    addTitleBg();
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
    addContentBg();

    addChapterHeader(doc, item, margin, pageW);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.secondary);

    yPos = 32;
    wrapText(doc, stripHTML(item.contenido), margin, yPos, maxTextW, lineH, {
      firstLineIndent: 5,
      onNewPage: addContentBg,
    });

    // "Al lector" page
    doc.addPage();
    addTitleBg();

    addChapterHeader(doc, item, margin, pageW);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.heart);
    doc.text('Al lector', pageW / 2, 34, { align: 'center' });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.secondary);

    yPos = 42;
    wrapText(doc, stripHTML(item.carta), margin, yPos, maxTextW, lineH, {
      firstLineIndent: 5,
      onNewPage: addTitleBg,
    });
  }

  // ============================================================
  // EPÍLOGO
  // ============================================================
  doc.addPage();
  addTitleBg();
  const epilogoPage = doc.internal.getNumberOfPages();

  doc.setFillColor(...COLORS.accentLight);
  doc.rect(margin, 90, pageW - margin * 2, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.primary);
  doc.text('Epílogo', pageW / 2, 115, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.secondary);

  yPos = 135;
  wrapText(doc, stripHTML(epilogo.contenido), margin, yPos, maxTextW, lineH, {
    firstLineIndent: 5,
    onNewPage: addTitleBg,
  });

  addFooter(doc, epilogoPage);

  // ============================================================
  // UPDATE TOC WITH PAGE NUMBERS
  // ============================================================
  doc.setPage(2);
  tocY = 52;

  // Prólogo page number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accentLight);
  doc.text(String(prologoPage), pageW - margin - 5, tocY, { align: 'right' });
  tocY += 10;

  // Chapter page numbers
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

  // Epílogo page number
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.accentLight);
  doc.text(String(epilogoPage), pageW - margin - 5, tocY, { align: 'right' });

  // ============================================================
  // BACK COVER
  // ============================================================
  doc.addPage();
  doc.addImage(contraportadaData, 'PNG', 0, 0, 210, 297);

  // ============================================================
  // PAGE NUMBERS ON ALL PAGES (skip cover and back cover)
  // ============================================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 2; i <= totalPages - 1; i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  doc.save('nuestra-historia.pdf');
}
