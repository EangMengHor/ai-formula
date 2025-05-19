import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import { downloadPdf } from '@/services/n8n-apis/_core/downloadPdf.api';

export const downloadDocument = async ({ content, type = 'pdf',fileName }) => {
  try {
    const data = await downloadPdf({ content, type });
    if (!data.success) {
      throw new Error(data.message || 'Failed to download document');
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