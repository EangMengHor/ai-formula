import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, ImageRun } from 'docx';
import Papa from 'papaparse';
import mermaid from 'mermaid';
import katex from 'katex';
import html2canvas from 'html2canvas'; // <-- Import html2canvas

// Initialize mermaid with optimal settings for high resolution
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  deterministicIds: true, // Ensure consistent IDs
  fontSize: 16,
  fontFamily: 'arial',
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    useMaxWidth: true,
  },
});

const parseMarkdownTable = (markdown) => {
  if (!markdown || typeof markdown !== 'string') {
    throw new Error('No content provided for table parsing');
  }

  const lines = markdown.trim().split('\n').map(line => line.trim()).filter(line => line);
  const tableData = [];
  let headers = [];
  let foundSeparator = false;

  let tableStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('|') && lines[i].endsWith('|')) {
      tableStartIndex = i;
      break;
    }
  }

  if (tableStartIndex === -1) {
    throw new Error('No valid table found in the content. Please ensure your markdown contains a properly formatted table.');
  }

  for (let i = tableStartIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('|') || !line.endsWith('|')) break;

    const cells = line
      .split('|')
      .slice(1, -1)
      .map(cell => cell.trim())
      .filter(cell => cell !== '');

    if (cells.length === 0) continue;

    if (!foundSeparator && line.includes('-')) {
      const isSeparator = cells.every(cell => cell.replace(/[:\-]/g, '').trim() === '');
      if (isSeparator) {
        foundSeparator = true;
        continue;
      }
    }

    if (headers.length === 0) {
      headers = cells;
    } else if (foundSeparator) {
      if (cells.length === headers.length) {
        tableData.push(cells);
      }
    }
  }

  if (headers.length === 0 || tableData.length === 0) {
    throw new Error('Invalid table structure. Please ensure your table has headers and data rows.');
  }

  return { headers, rows: tableData };
};

const base64ToUint8Array = (base64) => {
  const binaryString = window.atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
};

const renderMermaidDiagram = async (code) => {
  try {
    // Generate a valid and unique ID for the diagram
    const diagramId = `mermaid-diagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Render the diagram with high resolution settings
    const { svg } = await mermaid.render(diagramId, code);
    
    // Create a container for the SVG
    const container = document.createElement('div');
    container.innerHTML = svg;
    const svgElement = container.querySelector('svg');
    
    // Set dimensions for high resolution
    const scale = 4; // Increase scale for higher resolution
    const width = 1600;
    const height = 1200;
    
    svgElement.setAttribute('width', width.toString());
    svgElement.setAttribute('height', height.toString());
    svgElement.style.backgroundColor = 'white';
    
    // Create a high-resolution canvas
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    // Create an image from the SVG
    const img = new Image();
    img.crossOrigin = "anonymous"; // Set to avoid tainted canvas
    img.referrerPolicy = "no-referrer"; // <-- Added to prevent tainting
    const svgBlob = new Blob([svgElement.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    
    // Convert SVG to high-resolution PNG
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        
        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Draw image with anti-aliasing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png', 1.0)); // Maximum quality
      };
      img.onerror = reject;
      img.src = url;
    });
  } catch (error) {
    console.error('Error rendering Mermaid diagram:', error);
    throw error;
  }
};

const renderLatexFormula = async (latex, displayMode) => {
  try {
    const katexHtml = katex.renderToString(latex, {
      throwOnError: false,
      displayMode: displayMode,
      output: 'html', // Ensure HTML output
    });

    // Create a temporary container for KaTeX rendering
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px'; // Position off-screen
    container.style.top = '-9999px';
    container.style.display = 'inline-block'; // Ensure it takes content size
    container.style.padding = '10px'; // Add some padding
    container.style.backgroundColor = 'white'; // Ensure white background
    container.style.color = 'black'; // Ensure text is visible for rendering
    container.innerHTML = katexHtml;

    // Append to body to allow rendering
    document.body.appendChild(container);

    // Ensure KaTeX CSS is loaded and applied - this assumes KaTeX CSS is linked globally
    // If not, you might need to dynamically load or include the CSS here.

    // Use html2canvas to render the container
    const canvas = await html2canvas(container, {
      scale: 4, // Increase scale for higher resolution
      backgroundColor: '#ffffff', // Explicitly set background
      useCORS: true, // Allow loading cross-origin resources (like fonts)
      logging: false, // Disable html2canvas logging if desired
    });

    // Remove the temporary container
    document.body.removeChild(container);

    // Return the canvas as a high-quality PNG data URL
    return canvas.toDataURL('image/png', 1.0);

  } catch (error) {
    console.error('Error rendering LaTeX with html2canvas:', error);
    // Clean up container if it exists and an error occurred
    const tempContainer = document.querySelector('div[style*="left: -9999px"]');
    if (tempContainer) {
      document.body.removeChild(tempContainer);
    }
    throw error; // Re-throw the error to be handled by the caller
  }
};

export const downloadDocument = async ({ content, type = 'pdf', elementId = null }) => {
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
        let inMermaidBlock = false;
        let mermaidCode = '';
        let inTable = false;
        let tableContent = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trimEnd();

          // Handle Mermaid diagrams
          if (line.trim() === '```mermaid') {
            inMermaidBlock = true;
            mermaidCode = '';
            continue;
          }

          if (inMermaidBlock) {
            if (line.trim() === '```') {
              inMermaidBlock = false;
              try {
                const diagramImage = await renderMermaidDiagram(mermaidCode);
                if (yPosition + 450 > pdf.internal.pageSize.getHeight() - margin) {
                  pdf.addPage();
                  yPosition = margin;
                }
                pdf.addImage(diagramImage, 'PNG', margin, yPosition, textWidth, 300);
                yPosition += 320;
              } catch (error) {
                console.error('Failed to render Mermaid diagram:', error);
                pdf.setTextColor(255, 0, 0);
                pdf.text('Error: Failed to render diagram', margin, yPosition);
                pdf.setTextColor(0, 0, 0);
                yPosition += 20;
              }
            } else {
              mermaidCode += line + '\n';
            }
            continue;
          }

          // Handle tables
          if (line.startsWith('|')) {
            if (!inTable) {
              inTable = true;
              tableContent = line + '\n';
            } else {
              tableContent += line + '\n';
            }
            continue;
          } else if (inTable) {
            inTable = false;
            try {
              const { headers, rows } = parseMarkdownTable(tableContent);
              const cellWidth = (textWidth - margin) / headers.length;
              const cellHeight = 25;
              let tableY = yPosition;

              // Draw headers
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(12);
              headers.forEach((header, index) => {
                pdf.rect(margin + (index * cellWidth), tableY, cellWidth, cellHeight);
                pdf.text(header, margin + (index * cellWidth) + 5, tableY + 17);
              });
              tableY += cellHeight;

              // Draw rows
              pdf.setFont('helvetica', 'normal');
              rows.forEach(row => {
                if (tableY + cellHeight > pdf.internal.pageSize.getHeight() - margin) {
                  pdf.addPage();
                  tableY = margin;
                }
                row.forEach((cell, index) => {
                  pdf.rect(margin + (index * cellWidth), tableY, cellWidth, cellHeight);
                  pdf.text(cell, margin + (index * cellWidth) + 5, tableY + 17);
                });
                tableY += cellHeight;
              });
              yPosition = tableY + 20;
            } catch (error) {
              console.error('Failed to render table:', error);
            }
          }

          // Handle block LaTeX formulas (lines that start and end with "$$")
          if (line.trim().startsWith('$$') && line.trim().endsWith('$$')) {
            const latexCode = line.trim().slice(2, -2).trim();
            try {
              const formulaImage = await renderLatexFormula(latexCode, true);
              if (yPosition + 120 > pdf.internal.pageSize.getHeight() - margin) {
                pdf.addPage();
                yPosition = margin;
              }
              pdf.addImage(formulaImage, 'PNG', margin, yPosition, textWidth, 100);
              yPosition += 120;
            } catch (error) {
              console.error('Failed to render LaTeX formula in PDF:', error);
              pdf.setTextColor(255, 0, 0);
              pdf.text('Error: Failed to render LaTeX formula', margin, yPosition);
              pdf.setTextColor(0, 0, 0);
              yPosition += 20;
            }
            continue;
          }

          // Handle regular text and headers
          if (!inTable && !inMermaidBlock && line.trim()) {
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
              
              const words = line.split(' ');
              let currentLine = '';
              
              for (const word of words) {
                const testLine = currentLine ? currentLine + ' ' + word : word;
                const testWidth = pdf.getStringUnitWidth(testLine) * pdf.getFontSize();
                
                if (testWidth > textWidth) {
                  pdf.text(currentLine, margin, yPosition);
                  currentLine = word;
                  yPosition += 20;
                  
                  if (yPosition > pdf.internal.pageSize.getHeight() - margin) {
                    pdf.addPage();
                    yPosition = margin;
                  }
                } else {
                  currentLine = testLine;
                }
              }
              
              if (currentLine) {
                pdf.text(currentLine, margin, yPosition);
                yPosition += 20;
              }
            }
          } else if (!inTable && !inMermaidBlock) {
            yPosition += 10;
          }
        }

        pdf.save('document.pdf');
        return { success: true, message: 'PDF downloaded successfully' };
      }

      case 'docx': {
        const docElements = [];
        let inMermaidBlock = false;
        let mermaidCode = '';
        let inTable = false;
        let tableContent = '';

        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trimEnd();

          if (line.trim() === '```mermaid') {
            inMermaidBlock = true;
            mermaidCode = '';
            continue;
          }

          if (inMermaidBlock) {
            if (line.trim() === '```') {
              inMermaidBlock = false;
              try {
                const diagramImage = await renderMermaidDiagram(mermaidCode);
                const base64Data = diagramImage.split(',')[1];
                const imageData = base64ToUint8Array(base64Data);
                
                docElements.push(new Paragraph({
                  children: [
                    new ImageRun({
                      data: imageData,
                      transformation: {
                        width: 600,
                        height: 450,
                      },
                    }),
                  ],
                  spacing: { before: 240, after: 240 },
                }));
              } catch (error) {
                console.error('Failed to render Mermaid diagram:', error);
                docElements.push(new Paragraph({
                  text: 'Error: Failed to render diagram',
                  color: 'FF0000'
                }));
              }
            } else {
              mermaidCode += line + '\n';
            }
            continue;
          }

          if (line.startsWith('|')) {
            if (!inTable) {
              inTable = true;
              tableContent = line + '\n';
            } else {
              tableContent += line + '\n';
            }
            continue;
          } else if (inTable) {
            inTable = false;
            try {
              const { headers, rows } = parseMarkdownTable(tableContent);
              const table = new Table({
                rows: [
                  new TableRow({
                    children: headers.map(header => 
                      new TableCell({
                        children: [new Paragraph({ text: header, bold: true })]
                      })
                    )
                  }),
                  ...rows.map(row => 
                    new TableRow({
                      children: row.map(cell => 
                        new TableCell({
                          children: [new Paragraph({ text: cell })]
                        })
                      )
                    })
                  )
                ]
              });
              docElements.push(table);
            } catch (error) {
              console.warn('Failed to parse table:', error);
            }
          }

          // Handle block LaTeX formulas in DOCX
          if (line.trim().startsWith('$$') && line.trim().endsWith('$$')) {
            const latexCode = line.trim().slice(2, -2).trim();
            try {
              const formulaImage = await renderLatexFormula(latexCode, true);
              const base64Data = formulaImage.split(',')[1];
              const imageData = base64ToUint8Array(base64Data);
              docElements.push(new Paragraph({
                children: [
                  new ImageRun({
                    data: imageData,
                    transformation: { width: 600, height: 100 },
                  }),
                ],
                spacing: { before: 240, after: 240 },
              }));
            } catch (error) {
              console.error('Failed to render LaTeX formula in DOCX:', error);
              docElements.push(new Paragraph({
                text: 'Error: Failed to render LaTeX formula',
                color: 'FF0000'
              }));
            }
            continue;
          }

          if (!inTable && !inMermaidBlock && line.trim()) {
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

      case 'csv': {
        try {
          const { headers, rows } = parseMarkdownTable(content);
          
          if (headers.length === 0 || rows.length === 0) {
            throw new Error('No valid table found in the content. Please ensure your markdown contains a properly formatted table.');
          }

          const csvData = [headers, ...rows];
          const csv = Papa.unparse(csvData, {
            quotes: true,
            delimiter: ',',
            header: true
          });
          
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'document.csv';
          link.click();
          window.URL.revokeObjectURL(url);
          return { success: true, message: 'CSV downloaded successfully' };
        } catch (error) {
          throw new Error(`Failed to generate CSV: ${error.message}`);
        }
      }

      default:
        throw new Error(`Unsupported file type: ${type}`);
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