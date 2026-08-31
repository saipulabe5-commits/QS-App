/**
 * Format angka ke format mata uang Rupiah Indonesia
 * Contoh: 1250000 -> "Rp 1.250.000"
 */
export function formatRupiah(amount: number, decimalPlaces: number = 0): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const parts = absAmount.toFixed(decimalPlaces).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1] ? `,${parts[1]}` : '';

  return `${isNegative ? '- ' : ''}Rp ${integerPart}${decimalPart}`;
}

/**
 * Format angka umum Indonesia (titik untuk ribuan, koma untuk desimal)
 * Contoh: 1250.5 -> "1.250,5"
 */
export function formatNumber(num: number, decimalPlaces: number = 2): string {
  if (isNaN(num) || num === null || num === undefined) {
    return '0';
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Jika integer murni dan tidak dipaksa desimal, tampilkan integer
  const parts = absNum.toFixed(decimalPlaces).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Hilangkan trailing zero jika ada desimal
  let decimalPart = parts[1] ? parts[1].replace(/0+$/, '') : '';
  if (decimalPart) {
    decimalPart = `,${decimalPart}`;
  }

  return `${isNegative ? '-' : ''}${integerPart}${decimalPart}`;
}

export function numberToWordsIndo(n: number): string {
  return terbilang(n);
}

/**
 * Konversi angka ke kalimat Terbilang dalam Bahasa Indonesia
 * Contoh: 1250000 -> "Satu Juta Dua Ratus Lima Puluh Ribu Rupiah"
 */
export function terbilang(n: number): string {
  if (isNaN(n) || n === 0) return 'Nol Rupiah';

  const angka = Math.floor(Math.abs(n));
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function spell(x: number): string {
    if (x < 12) {
      return bilangan[x];
    } else if (x < 20) {
      return spell(x - 10) + ' Belas';
    } else if (x < 100) {
      return spell(Math.floor(x / 10)) + ' Puluh ' + spell(x % 10);
    } else if (x < 200) {
      return 'Seratus ' + spell(x - 100);
    } else if (x < 1000) {
      return spell(Math.floor(x / 100)) + ' Ratus ' + spell(x % 100);
    } else if (x < 2000) {
      return 'Seribu ' + spell(x - 1000);
    } else if (x < 1000000) {
      return spell(Math.floor(x / 1000)) + ' Ribu ' + spell(x % 1000);
    } else if (x < 1000000000) {
      return spell(Math.floor(x / 1000000)) + ' Juta ' + spell(x % 1000000);
    } else if (x < 1000000000000) {
      return spell(Math.floor(x / 1000000000)) + ' Miliar ' + spell(x % 1000000000);
    } else if (x < 1000000000000000) {
      return spell(Math.floor(x / 1000000000000)) + ' Triliun ' + spell(x % 1000000000000);
    }
    return '';
  }

  const result = spell(angka).replace(/\s+/g, ' ').trim();
  return `${result} Rupiah`;
}

/**
 * Format tanggal Indonesia
 * Contoh: "2026-08-27" -> "27 Agustus 2026"
 */
export function formatDateIndo(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const bulan = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];

    const day = date.getDate();
    const month = bulan[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}
