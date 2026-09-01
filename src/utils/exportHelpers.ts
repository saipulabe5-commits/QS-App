import { Project, RABItem, RABCalculationResult, PriceItem } from '../types';
import { formatNumber } from './formatters';

/**
 * Ekspor data RAB proyek ke format CSV yang kompatibel dengan Microsoft Excel
 */
export function exportRABToCSV(
  project: Project,
  items: RABItem[],
  calc: RABCalculationResult
): void {
  const rows: string[][] = [
    ['RENCANA ANGGARAN BIAYA (RAB) PROYEK'],
    ['Nama Proyek', project.name],
    ['Nomor Dokumen', project.documentNo],
    ['Pemilik Proyek', project.clientName],
    ['Lokasi Proyek', project.location],
    ['Kontraktor', project.contractor || '-'],
    ['Konsultan', project.consultant || '-'],
    ['Tanggal', new Date().toLocaleDateString('id-ID')],
    [],
    [
      'No',
      'Kode',
      'Uraian Pekerjaan',
      'Kategori',
      'Satuan',
      'Volume',
      'Harga Satuan (Rp)',
      'Jumlah Biaya (Rp)',
      'Bobot (%)',
      'Keterangan',
    ],
  ];

  // Group items by category
  const categories = Array.from(new Set(items.map((i) => i.category)));

  let rowCounter = 1;
  categories.forEach((cat) => {
    const catItems = items.filter((i) => i.category === cat);
    const catSubtotal = catItems.reduce((s, i) => s + i.totalCost, 0);
    const catWeight = calc.directCost > 0 ? (catSubtotal / calc.directCost) * 100 : 0;

    // Header Kategori
    rows.push(['', '', `[${cat.toUpperCase()}]`, '', '', '', '', String(catSubtotal), formatNumber(catWeight, 2) + '%', 'SUBTOTAL KATEGORI']);

    catItems.forEach((item) => {
      const itemWeight = calc.directCost > 0 ? (item.totalCost / calc.directCost) * 100 : 0;
      rows.push([
        String(rowCounter++),
        item.code,
        `"${item.name.replace(/"/g, '""')}"`,
        item.category,
        item.unit,
        String(item.volume),
        String(item.unitPrice),
        String(item.totalCost),
        formatNumber(itemWeight, 2) + '%',
        `"${(item.notes || '').replace(/"/g, '""')}"`,
      ]);
    });
  });

  // Summary footer
  rows.push([]);
  rows.push(['', '', 'A. Total Biaya Langsung', '', '', '', '', String(calc.directCost)]);
  if (project.taxPercent > 0) {
    rows.push(['', '', `B. Pajak PPN (${project.taxPercent}%)`, '', '', '', '', String(calc.taxCost)]);
  }
  rows.push(['', '', project.taxPercent > 0 ? 'GRAND TOTAL RAB (A + B)' : 'GRAND TOTAL RAB', '', '', '', '', String(calc.grandTotal)]);
  if (project.buildingArea) {
    rows.push(['', '', `Harga Rata-Rata per m2 (Luas: ${project.buildingArea} m2)`, '', '', '', '', String(Math.round(calc.grandTotal / project.buildingArea))]);
  }

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `RAB_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Ekspor Database Harga ke format CSV
 */
export function exportPriceDatabaseToCSV(items: PriceItem[]): void {
  const rows: string[][] = [
    ['Kode', 'Nama Item', 'Jenis', 'Kategori', 'Satuan', 'Harga Satuan (Rp)', 'Sumber', 'Tanggal Pembaruan'],
  ];

  items.forEach((item) => {
    rows.push([
      item.code,
      `"${item.name.replace(/"/g, '""')}"`,
      item.type,
      `"${item.category.replace(/"/g, '""')}"`,
      item.unit,
      String(item.price),
      `"${item.source.replace(/"/g, '""')}"`,
      item.updatedAt,
    ]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Master_Database_Harga_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Parsing teks CSV harga menjadi array PriceItem
 */
export function parsePriceCSV(csvText: string): Omit<PriceItem, 'id' | 'userId'>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const results: Omit<PriceItem, 'id' | 'userId'>[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser handling quotes
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null && matches.length < 8) {
      let val = match[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      matches.push(val.trim());
      if (regex.lastIndex >= line.length) break;
    }

    if (matches.length >= 5) {
      const [code, name, typeRaw, category, unit, priceRaw, source] = matches;
      const type =
        typeRaw === 'labor' || typeRaw === 'upah' || typeRaw === 'tenaga'
          ? 'labor'
          : typeRaw === 'equipment' || typeRaw === 'alat'
          ? 'equipment'
          : 'material';

      const price = Number(priceRaw ? priceRaw.replace(/[^0-9.-]+/g, '') : 0) || 0;

      results.push({
        code: code || `IMP-${i}`,
        name: name || 'Item Impor',
        type,
        category: category || 'Umum',
        unit: unit || 'bh',
        price,
        source: source || 'Import CSV',
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}
