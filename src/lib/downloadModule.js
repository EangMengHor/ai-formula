import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';

export const downloadDocument = async ({ content, type = 'pdf' }) => {
  try {
    switch (type.toLowerCase()) {
      case 'pdf': {
        const pdf = new jsPDF({
          orientation: 'p',
          unit: 'pt',
          format: 'a4',
          compress: true,
          putOnlyUsedFonts: true,
          floatPrecision: 16
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 40;
        const textWidth = pageWidth - (2 * margin);
        let yPosition = margin;

        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trimEnd();

          if (line.trim()) {
            if (yPosition + 30 > pdf.internal.pageSize.getHeight() - margin) {
              pdf.addPage();
              yPosition = margin;
            }

            if (line.startsWith('# ')) {
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(24);
              pdf.text(line.substring(2), margin, yPosition);
              yPosition += 36;
            } else if (line.startsWith('## ')) {
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(20);
              pdf.text(line.substring(3), margin, yPosition);
              yPosition += 30;
            } else {
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(12);

              const splitText = pdf.splitTextToSize(line, textWidth);
              pdf.text(splitText, margin, yPosition);
              yPosition += splitText.length * 14 + 6;
            }
          } else {
            if (yPosition + 10 > pdf.internal.pageSize.getHeight() - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            yPosition += 10;
          }
        }

        pdf.save('document.pdf');
        return { success: true, message: 'PDF downloaded successfully' };
      }

      case 'docx': {
        const docElements = [];

        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trimEnd();

          if (line.trim()) {
            if (line.startsWith('# ')) {
              docElements.push(new Paragraph({
                text: line.substring(2),
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 240, after: 120 }
              }));
            } else if (line.startsWith('## ')) {
              docElements.push(new Paragraph({
                text: line.substring(3),
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 }
              }));
            } else {
              docElements.push(new Paragraph({
                text: line,
                spacing: { before: 80, after: 80 }
              }));
            }
          } else {
            docElements.push(new Paragraph({ text: '', spacing: { before: 80, after: 80 } }));
          }
        }

        const doc = new Document({
          sections: [{
            properties: {},
            children: docElements
          }]
        });

        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'document.docx';
        link.click();
        window.URL.revokeObjectURL(url);
        return { success: true, message: 'DOCX downloaded successfully' };
      }

      default:
        if (type.toLowerCase() !== 'pdf' && type.toLowerCase() !== 'docx') {
          throw new Error(`Unsupported file type: ${type}. Only PDF and DOCX are supported for text download.`);
        }
        break;
    }
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      message: error.message || 'Failed to download document',
      error
    };
  }
};