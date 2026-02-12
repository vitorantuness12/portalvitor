import jsPDF from 'jspdf';

interface Module {
  title: string;
  content: string;
}

interface GenerateCoursePdfProps {
  title: string;
  description: string;
  level: string;
  durationHours: number;
  modules: Module[];
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function generateCoursePdf({ title, description, level, durationHours, modules }: GenerateCoursePdfProps): Blob {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const marginTop = 30;
  const marginBottom = 25;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const teal = [13, 148, 136] as const;
  const darkGray = [51, 51, 51] as const;
  const lightGray = [170, 170, 170] as const;

  const levelLabel = level === 'beginner' ? 'Iniciante' : level === 'intermediate' ? 'Intermediário' : 'Avançado';

  // === COVER PAGE ===
  let y = 100;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...teal);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
  y += titleLines.length * 10 + 10;

  // Divider
  const dividerWidth = 40;
  doc.setDrawColor(...teal);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - dividerWidth / 2, y, pageWidth / 2 + dividerWidth / 2, y);
  y += 12;

  // Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(85, 85, 85);
  const descLines = doc.splitTextToSize(description, contentWidth - 20);
  doc.text(descLines, pageWidth / 2, y, { align: 'center' });
  y += descLines.length * 5 + 20;

  // Meta info
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  const metaText = `${durationHours}h  •  ${levelLabel}  •  ${modules.length} Módulos`;
  doc.text(metaText, pageWidth / 2, y, { align: 'center' });
  y += 30;

  // Institution
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(153, 153, 153);
  doc.text('FORMAK - Cursos Livres', pageWidth / 2, y, { align: 'center' });

  // === MODULE PAGES ===
  let totalPages = 1;

  const addHeader = (pageNum: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.text(title, marginLeft, 15);
    doc.setDrawColor(238, 238, 238);
    doc.setLineWidth(0.2);
    doc.line(marginLeft, 18, pageWidth - marginRight, 18);
  };

  const addPageNumber = (pageNum: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...lightGray);
    doc.text(`${pageNum}`, pageWidth - marginRight, pageHeight - 15, { align: 'right' });
  };

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    doc.addPage();
    totalPages++;
    let currentPage = totalPages;

    addHeader(currentPage);

    y = marginTop;

    // Module title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...teal);
    const modTitle = `Módulo ${i + 1}: ${mod.title}`;
    const modTitleLines = doc.splitTextToSize(modTitle, contentWidth);
    doc.text(modTitleLines, marginLeft, y);
    y += modTitleLines.length * 6 + 4;

    // Divider under title
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 8;

    // Content
    const cleaned = stripMarkdown(mod.content);
    const paragraphs = cleaned.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);

    for (const para of paragraphs) {
      const lines = doc.splitTextToSize(para, contentWidth);

      for (const line of lines) {
        if (y > pageHeight - marginBottom) {
          addPageNumber(currentPage);
          doc.addPage();
          totalPages++;
          currentPage = totalPages;
          addHeader(currentPage);
          y = marginTop;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(...darkGray);
        }
        doc.text(line, marginLeft, y);
        y += 5;
      }
      y += 3; // paragraph spacing
    }

    addPageNumber(currentPage);
  }

  return doc.output('blob');
}
