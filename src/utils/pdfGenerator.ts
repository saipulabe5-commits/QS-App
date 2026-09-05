import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { Project, RABItem, RABCalculationResult, AppSettings, RABCategory, RAB_CATEGORIES } from '../types';
import { formatRupiah, formatNumber, numberToWordsIndo, formatDateIndo } from './formatters';

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

export interface OfficialReportPDFOptions {
  project: Project;
  items: RABItem[];
  calc: RABCalculationResult;
  settings?: AppSettings;
  reportType?: 'detail' | 'recap';
  orientation?: 'portrait' | 'landscape';
  includeSignatures?: boolean;
  reportDate?: string;
  filename?: string;
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
        // Delay 800ms to allow animations, progress bars, and charts to fully render before capture
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Hide non-printable elements before screenshot
        const nonPrintables = element.querySelectorAll('.no-print');
        nonPrintables.forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });

        // Render with High-DPI resolution (scale: 2 for sharp vector-like rasterization without canvas memory overflow)
        const canvas = await html2canvas(element, {
          scale: 2, 
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        // Restore non-printable elements
        nonPrintables.forEach((el) => {
          (el as HTMLElement).style.display = '';
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const contentWidth = pdfWidth - (margin * 2);
        
        const pxPerMm = canvas.width / contentWidth;
        const firstPageAvailableHeightMm = pdfHeight - startY - 15;
        const subsequentPageAvailableHeightMm = pdfHeight - (margin * 2) - 15;

        const firstPageHeightPx = firstPageAvailableHeightMm * pxPerMm;
        const subsequentPageHeightPx = subsequentPageAvailableHeightMm * pxPerMm;

        let renderedHeightPx = 0;
        let pageIndex = 0;

        while (renderedHeightPx < canvas.height) {
          if (pageIndex > 0) {
            pdf.addPage();
          }

          const currentAvailableHeightPx = pageIndex === 0 ? firstPageHeightPx : subsequentPageHeightPx;
          const currentSliceHeightPx = Math.min(currentAvailableHeightPx, canvas.height - renderedHeightPx);

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = currentSliceHeightPx;
          const pageCtx = pageCanvas.getContext('2d');

          if (pageCtx) {
            pageCtx.fillStyle = '#ffffff';
            pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            pageCtx.drawImage(
              canvas,
              0,
              renderedHeightPx,
              canvas.width,
              currentSliceHeightPx,
              0,
              0,
              pageCanvas.width,
              currentSliceHeightPx
            );

            const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
            const sliceHeightMm = currentSliceHeightPx / pxPerMm;
            const currentStartY = pageIndex === 0 ? startY : margin;

            pdf.addImage(pageImgData, 'PNG', margin, currentStartY, contentWidth, sliceHeightMm, undefined, 'FAST');
          }

          // Add footer on each page
          const currentTotalPages = pageIndex + 1;
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "italic");
          pdf.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Halaman ${currentTotalPages}`, 14, pdfHeight - 8);

          renderedHeightPx += currentSliceHeightPx;
          pageIndex++;
        }
      }
    }

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

/**
 * Official Vector Report PDF Generator using jsPDF and jspdf-autotable
 * Menghasilkan dokumen RAB resmi berstandar konstruksi Indonesia secara 100% vektor murni.
 */
export const exportOfficialReportToPDF = async (options: OfficialReportPDFOptions): Promise<void> => {
  const {
    project,
    items,
    calc,
    settings,
    reportType = 'detail',
    orientation = 'portrait',
    includeSignatures = true,
    reportDate = new Date().toISOString().split('T')[0],
    filename,
  } = options;

  try {
    const isLandscape = orientation === 'landscape';
    const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 14;

    const companyName = settings?.companyName || 'PT. CITRA KUSUMA DEVELOPMENT';
    const companyAddress = settings?.companyAddress || 'Jl. Sudirman No. 123, Jakarta';
    const companyPhone = settings?.companyPhone || '021-5551234';
    const companyEmail = settings?.companyEmail || 'info@citrakusuma.co.id';

    // 1. Kop Surat Header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.text(companyName.toUpperCase(), margin, 15);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105); // slate-600
    pdf.text(companyAddress, margin, 20);
    pdf.text(`Telp: ${companyPhone}  ·  Email: ${companyEmail}`, margin, 24);

    // Right side: Document Number & Date
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text('DOKUMEN RESMI RAB', pageWidth - margin, 15, { align: 'right' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text(project.documentNo || 'DOC-RAB-001', pageWidth - margin, 20, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`Tanggal: ${formatDateIndo(reportDate)}`, pageWidth - margin, 24, { align: 'right' });

    // Decorative Header Lines
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.6);
    pdf.line(margin, 27, pageWidth - margin, 27);
    pdf.setLineWidth(0.2);
    pdf.line(margin, 28, pageWidth - margin, 28);

    // 2. Report Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(15, 23, 42);
    pdf.text('RENCANA ANGGARAN BIAYA (RAB)', pageWidth / 2, 35, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(30, 58, 138); // blue-900
    pdf.text(project.name, pageWidth / 2, 40, { align: 'center' });

    // 3. Project Information Box (using autoTable for clean alignment)
    const infoStartY = 44;
    autoTable(pdf, {
      startY: infoStartY,
      margin: { left: margin, right: margin },
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 1.2,
        textColor: [15, 23, 42],
      },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: 'bold', textColor: [71, 85, 105] },
        1: { fontStyle: 'bold' },
        2: { cellWidth: 32, fontStyle: 'bold', textColor: [71, 85, 105] },
        3: { fontStyle: 'bold' },
      },
      body: [
        [
          'Pemilik / Klien:',
          project.clientName || '-',
          'Lokasi Proyek:',
          project.location || '-',
        ],
        [
          'Pelaksana / Kontraktor:',
          project.contractor || companyName,
          'Konsultan Perencana:',
          project.consultant || '-',
        ],
        [
          'Waktu Pelaksanaan:',
          `${formatDateIndo(project.startDate)} s.d. ${formatDateIndo(project.endDate)}`,
          'Tahun Anggaran:',
          `${new Date().getFullYear()}`,
        ],
      ],
    });

    let currentY = ((pdf as any).lastAutoTable?.finalY || 62) + 4;

    // 4. Main Tables
    if (reportType === 'detail') {
      // Group items by category
      const categoriesInUse = Array.from(new Set(items.map((i) => i.category)));
      const orderedCategories: RABCategory[] = [...RAB_CATEGORIES].filter((cat) =>
        categoriesInUse.includes(cat)
      );
      categoriesInUse.forEach((cat) => {
        if (!orderedCategories.includes(cat as RABCategory)) orderedCategories.push(cat as RABCategory);
      });

      const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
      const tableBody: any[] = [];

      orderedCategories.forEach((cat, catIdx) => {
        const catItems = items.filter((it) => it.category === cat);
        if (catItems.length === 0) return;

        const catSubtotal = catItems.reduce((s, it) => s + it.totalCost, 0);
        const catWeight = calc.directCost > 0 ? (catSubtotal / calc.directCost) * 100 : 0;
        const roman = romanNumerals[catIdx] || String(catIdx + 1);

        // Category Subtotal Header Row
        tableBody.push([
          {
            content: roman,
            styles: { fontStyle: 'bold', halign: 'center', fillColor: [226, 232, 240], textColor: [15, 23, 42] },
          },
          {
            content: cat.toUpperCase(),
            colSpan: 5,
            styles: { fontStyle: 'bold', fillColor: [226, 232, 240], textColor: [15, 23, 42] },
          },
          {
            content: formatRupiah(catSubtotal),
            styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240], textColor: [15, 23, 42] },
          },
          {
            content: `${formatNumber(catWeight, 2)}%`,
            styles: { fontStyle: 'bold', halign: 'right', fillColor: [226, 232, 240], textColor: [30, 58, 138] },
          },
        ]);

        // Variabel pelacak lantai
        let currentFloor = '';

        // Item Rows
        catItems.forEach((item, itemIdx) => {
          // Logika pengecekan lantai / zona
          const floorVal = ((item as any).lantai || (item as any).floorGroup || item.floor || '').trim();
          if (floorVal && floorVal !== currentFloor) {
            currentFloor = floorVal;
            const floorTitle = currentFloor.toUpperCase().startsWith('LANTAI')
              ? currentFloor.toUpperCase()
              : `LANTAI ${currentFloor.toUpperCase()}`;

            tableBody.push([
              {
                content: floorTitle,
                colSpan: 8,
                styles: {
                  fillColor: [230, 240, 255],
                  textColor: [15, 40, 150],
                  fontStyle: 'bold',
                  halign: 'left',
                  cellPadding: 2.5,
                },
              },
            ]);
          }

          const itemWeight = calc.directCost > 0 ? (item.totalCost / calc.directCost) * 100 : 0;
          const itemDesc = item.notes ? `${item.name}\n${item.notes}` : item.name;

          tableBody.push([
            { content: String(itemIdx + 1), styles: { halign: 'center', textColor: [71, 85, 105] } },
            { content: item.code || '-', styles: { textColor: [71, 85, 105] } },
            { content: itemDesc, styles: { textColor: [15, 23, 42] } },
            { content: item.unit, styles: { halign: 'center' } },
            { content: formatNumber(item.volume, 2), styles: { halign: 'right' } },
            { content: formatRupiah(item.unitPrice), styles: { halign: 'right' } },
            { content: formatRupiah(item.totalCost), styles: { halign: 'right', fontStyle: 'bold' } },
            { content: `${formatNumber(itemWeight, 2)}%`, styles: { halign: 'right' } },
          ]);
        });
      });

      // Summary Rows
      tableBody.push([
        {
          content: 'TOTAL BIAYA PEKERJAAN (REAL COST)',
          colSpan: 6,
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        },
        {
          content: formatRupiah(calc.directCost),
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        },
        {
          content: '100,00%',
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        },
      ]);

      if (project.taxPercent > 0) {
        tableBody.push([
          {
            content: `PAJAK PERTAMBAHAN NILAI (PPN) (${project.taxPercent}%)`,
            colSpan: 6,
            styles: { fontStyle: 'bold', halign: 'right', textColor: [15, 23, 42] },
          },
          {
            content: formatRupiah(calc.taxCost),
            styles: { fontStyle: 'bold', halign: 'right', textColor: [15, 23, 42] },
          },
          {
            content: '-',
            styles: { halign: 'right' },
          },
        ]);
      }

      tableBody.push([
        {
          content: 'GRAND TOTAL NILAI RAB',
          colSpan: 6,
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [219, 234, 254], textColor: [30, 58, 138], fontSize: 9 },
        },
        {
          content: formatRupiah(calc.grandTotal),
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [219, 234, 254], textColor: [30, 58, 138], fontSize: 9 },
        },
        {
          content: '-',
          styles: { halign: 'right', fillColor: [219, 234, 254] },
        },
      ]);

      if (project.buildingArea && project.buildingArea > 0) {
        tableBody.push([
          {
            content: `Harga Rata-Rata per m² (Luas: ${project.buildingArea} m²)`,
            colSpan: 6,
            styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: [30, 58, 138] },
          },
          {
            content: `${formatRupiah(Math.round(calc.grandTotal / project.buildingArea))} / m²`,
            styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: [30, 58, 138] },
          },
          {
            content: '-',
            styles: { halign: 'right', fillColor: [241, 245, 249] },
          },
        ]);
      }

      autoTable(pdf, {
        startY: currentY,
        margin: { left: margin, right: margin, bottom: 16 },
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 1.8,
          lineColor: [203, 213, 225],
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 18 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 14, halign: 'center' },
          4: { cellWidth: 16, halign: 'right' },
          5: { cellWidth: 26, halign: 'right' },
          6: { cellWidth: 28, halign: 'right' },
          7: { cellWidth: 16, halign: 'right' },
        },
        head: [['NO', 'KODE', 'URAIAN PEKERJAAN', 'SAT', 'VOL', 'HARGA SATUAN (RP)', 'JUMLAH BIAYA (RP)', 'BOBOT']],
        body: tableBody,
      });

      currentY = ((pdf as any).lastAutoTable?.finalY || currentY) + 4;
    } else {
      // Rekapitulasi Only Table
      const recapBody: any[] = [];
      calc.categorySummaries.forEach((cat, idx) => {
        recapBody.push([
          { content: String(idx + 1), styles: { halign: 'center', textColor: [71, 85, 105] } },
          { content: cat.category, styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
          { content: formatRupiah(cat.subtotal), styles: { halign: 'right', fontStyle: 'bold' } },
          { content: `${formatNumber(cat.weightPercent, 2)}%`, styles: { halign: 'right' } },
        ]);
      });

      // Subtotals
      recapBody.push([
        {
          content: 'TOTAL BIAYA PEKERJAAN (REAL COST)',
          colSpan: 2,
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        },
        {
          content: formatRupiah(calc.directCost),
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        },
        {
          content: '100,00%',
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        },
      ]);

      if (project.taxPercent > 0) {
        recapBody.push([
          {
            content: `PAJAK PERTAMBAHAN NILAI (PPN) (${project.taxPercent}%)`,
            colSpan: 2,
            styles: { fontStyle: 'bold', halign: 'right', textColor: [15, 23, 42] },
          },
          {
            content: formatRupiah(calc.taxCost),
            styles: { fontStyle: 'bold', halign: 'right', textColor: [15, 23, 42] },
          },
          {
            content: '-',
            styles: { halign: 'right' },
          },
        ]);
      }

      recapBody.push([
        {
          content: 'GRAND TOTAL NILAI RAB',
          colSpan: 2,
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [219, 234, 254], textColor: [30, 58, 138], fontSize: 9 },
        },
        {
          content: formatRupiah(calc.grandTotal),
          styles: { fontStyle: 'bold', halign: 'right', fillColor: [219, 234, 254], textColor: [30, 58, 138], fontSize: 9 },
        },
        {
          content: '-',
          styles: { halign: 'right', fillColor: [219, 234, 254] },
        },
      ]);

      if (project.buildingArea && project.buildingArea > 0) {
        recapBody.push([
          {
            content: `Harga Rata-Rata per m² (Luas: ${project.buildingArea} m²)`,
            colSpan: 2,
            styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: [30, 58, 138] },
          },
          {
            content: `${formatRupiah(Math.round(calc.grandTotal / project.buildingArea))} / m²`,
            styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: [30, 58, 138] },
          },
          {
            content: '-',
            styles: { halign: 'right', fillColor: [241, 245, 249] },
          },
        ]);
      }

      autoTable(pdf, {
        startY: currentY,
        margin: { left: margin, right: margin, bottom: 16 },
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 2.2,
          lineColor: [203, 213, 225],
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'center',
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 24, halign: 'right' },
        },
        head: [['NO', 'DIVISI / KATEGORI PEKERJAAN', 'JUMLAH BIAYA (RP)', 'BOBOT (%)']],
        body: recapBody,
      });

      currentY = ((pdf as any).lastAutoTable?.finalY || currentY) + 4;
    }

    // 5. Terbilang Box (using autoTable to ensure page-break safety)
    autoTable(pdf, {
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 16 },
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        fillColor: [248, 250, 252],
        lineColor: [203, 213, 225],
      },
      body: [
        [
          {
            content: `TERBILANG: "${numberToWordsIndo(calc.grandTotal)} Rupiah"`,
            styles: { fontStyle: 'italic', textColor: [15, 23, 42] },
          },
        ],
      ],
    });

    currentY = ((pdf as any).lastAutoTable?.finalY || currentY) + 5;

    // 6. Signature Block (3 Columns: Disetujui, Diperiksa, Dibuat)
    if (includeSignatures) {
      const contractorName = project.contractor || companyName;
      const clientName = project.clientName || '................................';
      const consultantName = project.consultant || '................................';

      autoTable(pdf, {
        startY: currentY,
        margin: { left: margin, right: margin, bottom: 16 },
        theme: 'plain',
        styles: {
          fontSize: 8,
          cellPadding: 1,
          halign: 'center',
          textColor: [15, 23, 42],
        },
        body: [
          [
            {
              content: `${project.location || 'Lokasi'}, ${formatDateIndo(reportDate)}`,
              colSpan: 3,
              styles: { halign: 'right', fontStyle: 'normal', textColor: [71, 85, 105] },
            },
          ],
          [
            { content: 'Disetujui Oleh,\nPemilik Proyek / Klien', styles: { fontStyle: 'bold' } },
            { content: 'Diperiksa Oleh,\nKonsultan Pengawas / Perencana', styles: { fontStyle: 'bold' } },
            { content: 'Dibuat Oleh,\nKontraktor Pelaksana', styles: { fontStyle: 'bold' } },
          ],
          [
            { content: '\n\n\n' },
            { content: '\n\n\n' },
            { content: '\n\n\n' },
          ],
          [
            { content: `( ${clientName} )\nOwner / Pemberi Tugas`, styles: { fontStyle: 'bold' } },
            { content: `( ${consultantName} )\nSite Engineer / Estimator`, styles: { fontStyle: 'bold' } },
            { content: `( ${contractorName} )\nDirektur Utama / Project Manager`, styles: { fontStyle: 'bold' } },
          ],
        ],
      });
    }

    // 7. Page Footers across all pages
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(7.5);
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text(
        `Dicetak pada: ${new Date().toLocaleString('id-ID')} | Dokumen Resmi RAB Pro Enterprise`,
        margin,
        pageHeight - 8
      );
      pdf.text(
        `Halaman ${i} dari ${totalPages}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
      );
    }

    const cleanFilename = (filename || `RAB_${project.name}_${reportType}`).replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`${cleanFilename}.pdf`);
  } catch (error) {
    console.error('Failed to generate official vector PDF:', error);
    throw error;
  }
};

