import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import autoTable, { UserOptions } from 'jspdf-autotable';

export interface PDFExportOptions {
  elementId?: string;
  filename: string;
  title?: string;
  companyName?: string;
  projectName?: string;
  isLandscape?: boolean;
  useVectorTable?: boolean;
  tableOptions?: UserOptions;
}

export const exportToPDF = async (options: PDFExportOptions): Promise<void> => {
  const { elementId, filename, isLandscape = false, title, companyName = "RAB Pro Enterprise", projectName, useVectorTable = false, tableOptions } = options;

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

      const margin = 14;
      const startY = title ? (projectName ? 35 : 30) : (projectName ? 27 : 20);

      // Cek apakah elemen adalah <table> murni atau diminta ekspor tabel vektor
      const isPureTable = element instanceof HTMLTableElement;
      const containedTable = useVectorTable ? element.querySelector('table') : null;
      const targetTable = isPureTable ? element : containedTable;

      if (targetTable) {
        // Native vector-based table export using jspdf-autotable
        autoTable(pdf, {
          html: targetTable,
          startY,
          margin: { left: margin, right: margin, bottom: 18 },
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 8.5,
            cellPadding: 2.5,
            textColor: [30, 41, 59],
            lineColor: [203, 213, 225],
            lineWidth: 0.2,
          },
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          ...tableOptions,
        });
      } else {
        // Hide non-printable elements before screenshot
        const nonPrintables = element.querySelectorAll('.no-print');
        nonPrintables.forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });

        // Render with High-DPI resolution (scale: 4 for ultra-crisp text & vector-grade rasterization)
        const canvas = await html2canvas(element, {
          scale: 4, 
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        // Restore non-printable elements
        nonPrintables.forEach((el) => {
          (el as HTMLElement).style.display = '';
        });

        // Use lossless PNG format to eliminate compression artifacts
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calculate margins and dimensions
        const contentWidth = pdfWidth - (margin * 2);
        
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

        // Scale to fit page height if needed
        let finalWidth = contentWidth;
        let finalHeight = imgHeight;
        const maxHeight = pdfHeight - startY - 12;
        
        if (finalHeight > maxHeight) {
          const ratio = maxHeight / finalHeight;
          finalHeight = maxHeight;
          finalWidth = finalWidth * ratio;
        }

        // Add image to PDF using PNG format and maximum quality
        pdf.addImage(imgData, 'PNG', margin, startY, finalWidth, finalHeight, undefined, 'FAST');
      }
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

/**
 * Native Vector Table PDF Exporter using jspdf-autotable
 * Memastikan garis tabel dan font tetap 100% solid & tajam berbasis vektor
 */
export const exportTableToPDF = async (options: {
  tableElement?: HTMLTableElement | string;
  head?: string[][];
  body?: (string | number)[][];
  filename: string;
  title?: string;
  companyName?: string;
  projectName?: string;
  isLandscape?: boolean;
  tableOptions?: UserOptions;
}): Promise<void> => {
  const {
    tableElement,
    head,
    body,
    filename,
    isLandscape = false,
    title,
    companyName = "RAB Pro Enterprise",
    projectName,
    tableOptions,
  } = options;

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

    const margin = 14;
    const startY = title ? (projectName ? 35 : 30) : (projectName ? 27 : 20);

    const targetEl = typeof tableElement === 'string' 
      ? document.getElementById(tableElement) as HTMLTableElement 
      : tableElement;

    autoTable(pdf, {
      ...(targetEl ? { html: targetEl } : {}),
      ...(head ? { head } : {}),
      ...(body ? { body } : {}),
      startY,
      margin: { left: margin, right: margin, bottom: 18 },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 2.5,
        textColor: [30, 41, 59],
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      ...tableOptions,
    });

    // Add footer with timestamp
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "italic");
    pdf.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Menggunakan Enkripsi RAB Pro`, 14, pageHeight - 10);

    pdf.save(`${filename.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  } catch (error) {
    console.error('Failed to export vector table to PDF:', error);
    throw error;
  }
};

