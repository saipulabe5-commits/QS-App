import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { exportToPDF } from '../../utils/pdfGenerator';
import { useApp } from '../../context/AppContext';

interface PdfExportButtonProps {
  elementId: string;
  filename: string;
  title: string;
  isLandscape?: boolean;
}

export const PdfExportButton: React.FC<PdfExportButtonProps> = ({ elementId, filename, title, isLandscape }) => {
  const [isExporting, setIsExporting] = useState(false);
  const { selectedProject, showToast } = useApp();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToPDF({
        elementId,
        filename,
        title,
        isLandscape,
        projectName: selectedProject?.name,
      });
      showToast('PDF berhasil disimpan.', 'success');
    } catch (error) {
      showToast('Gagal membuat PDF.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      data-html2canvas-ignore="true"
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm no-print"
      title="Ekspor ke PDF"
    >
      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-rose-500" />}
      <span className="hidden sm:inline">{isExporting ? 'Memproses...' : 'Cetak PDF'}</span>
    </button>
  );
};
