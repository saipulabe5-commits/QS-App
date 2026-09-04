import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  elementId?: string;
  filename: string;
  title?: string;
  companyName?: string;
  projectName?: string;
  isLandscape?: boolean;
}

export const exportToPDF = async (options: PDFExportOptions): Promise<void> => {
  const { elementId, filename, isLandscape = false, title, companyName = "RAB Pro Enterprise", projectName } = options;

  try {
    const orientation = isLandscape ? 'l' : 'p';
    const pdf = new jsPDF(orientation, 'mm', 'a4');
    
    // Add Header
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(companyName, 14, 15);
    
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    if (projectName) {
      pdf.text(`Proyek: ${projectName}`, 14, 22);
    }
    
    if (title) {
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(title, 14, projectName ? 30 : 25);
    }

    if (elementId) {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with id ${elementId} not found`);
      }

      // Hide non-printable elements before screenshot
      const nonPrintables = element.querySelectorAll('.no-print');
      nonPrintables.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });

      // Render with high resolution (scale: 3 for crisp text)
      const canvas = await html2canvas(element, {
        scale: 3, // High-res rasterization
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Restore non-printable elements
      nonPrintables.forEach((el) => {
        (el as HTMLElement).style.display = '';
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98); // High quality JPEG to keep file size down
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate margins and dimensions
      const margin = 14;
      const startY = title ? (projectName ? 35 : 30) : (projectName ? 27 : 20);
      const contentWidth = pdfWidth - (margin * 2);
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

      // Add image to PDF
      // If content is longer than a page, it will overflow. Advanced multi-page splitting is complex with images.
      // We'll scale it to fit one page if it's too long, or let it span (if we implement splitting).
      // For now, scaling to fit width and letting it be on one page. If too tall, we shrink it to fit height.
      let finalWidth = contentWidth;
      let finalHeight = imgHeight;
      const maxHeight = pdfHeight - startY - 10;
      
      if (finalHeight > maxHeight) {
        const ratio = maxHeight / finalHeight;
        finalHeight = maxHeight;
        finalWidth = finalWidth * ratio;
      }

      pdf.addImage(imgData, 'JPEG', margin, startY, finalWidth, finalHeight);
    }

    // Add footer with timestamp
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    pdf.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Menggunakan Enkripsi RAB Pro`, 14, pageHeight - 10);

    pdf.save(`${filename.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
};
