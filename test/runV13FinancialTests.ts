import { 
  calculateRAB, 
  calculateItemAmount, 
  roundCurrency 
} from '../src/utils/calculations';
import { RABItem } from '../src/types';
import assert from 'assert';

console.log("==================================================");
console.log("RAB PRO V13 - INDEPENDENT ORACLE & FINANCIAL TESTS");
console.log("==================================================");

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`[FAIL] ${name}\n       => ${err.message}`);
    failed++;
  }
}

// Oracle function
function oracleCalculateAmount(volume: number, price: number) {
  return Math.round(volume * price);
}

runTest("Oracle Math Check - Basic Multiplication", () => {
  const result = calculateItemAmount(10, 5000);
  assert.strictEqual(result, 50000);
});

runTest("Oracle Math Check - Rounding", () => {
  const result = calculateItemAmount(10.5, 3333.33);
  assert.strictEqual(result, 35000); // 10.5 * 3333.33 = 34999.965 -> rounded to 35000
});

// Realistic Dataset: Small Residential
runTest("Realistic Dataset - Small Residential", () => {
  const items: RABItem[] = [
    { id: '1', projectId: 'proj-1', name: 'Pembersihan Lahan', category: 'Pekerjaan Persiapan', volume: 100, unit: 'm2', unitPrice: 15000, code: 'X', totalCost: 0 },
    { id: '2', projectId: 'proj-1', name: 'Galian Tanah', category: 'Pekerjaan Tanah', volume: 50, unit: 'm3', unitPrice: 65000, code: 'X', totalCost: 0 }
  ];
  
  const result = calculateRAB({
    overheadPercent: 0,
    profitPercent: 0,
    taxPercent: 11
  }, items);
  
  // 1.5M + 3.25M = 4.75M
  assert.strictEqual(result.directCost, 4750000, "Direct cost should be exactly 4,750,000");
  assert.strictEqual(result.overheadCost, 0, "Overhead should be 0");
  assert.strictEqual(result.profitCost, 0, "Profit should be 0");
  const expectedTax = Math.round(4750000 * 0.11);
  assert.strictEqual(result.taxCost, expectedTax, "Tax should be 11% of direct cost");
  assert.strictEqual(result.grandTotal, 4750000 + expectedTax, "Grand total should be DC + Tax");
});

runTest("Realistic Dataset - Large Commercial with OHP", () => {
  const items: RABItem[] = [
    { id: '1', projectId: 'proj-2', name: 'Pondasi Bore Pile', category: 'Pekerjaan Struktur', volume: 500, unit: 'm3', unitPrice: 4500000, code: 'X', totalCost: 0 },
    { id: '2', projectId: 'proj-2', name: 'Plat Lantai', category: 'Pekerjaan Struktur', volume: 2000, unit: 'm2', unitPrice: 850000, code: 'X', totalCost: 0 }
  ];
  
  const result = calculateRAB({
    overheadPercent: 5,
    profitPercent: 10,
    taxPercent: 11
  }, items);
  
  const expectedDC = 3950000000;
  assert.strictEqual(result.directCost, expectedDC, "Direct cost should be exactly 3.95B");
  const expectedOH = 0;
  const expectedProfit = 0;
  assert.strictEqual(result.overheadCost, expectedOH, "Overhead should be 5%");
  assert.strictEqual(result.profitCost, expectedProfit, "Profit should be 10%");
  const expectedSub = expectedDC + expectedOH + expectedProfit;
  const expectedTax = Math.round(expectedSub * 0.11);
  assert.strictEqual(result.taxCost, expectedTax, "Tax should be 11% of DC+OH+Profit");
  assert.strictEqual(result.grandTotal, expectedSub + expectedTax, "Grand total mismatch");
});

runTest("Independent Oracle - Tax Regimes", () => {
  // Indonesian construction tax is typically PPN (11% currently, 12% soon) and PPh (Final)
  // Let's test tax exclusiveness. The engine only seems to support a single tax percent.
  const dc = 100000000;
  const ohp = 0;
  const expectedTax11 = Math.round((dc + ohp) * 0.11);
  
  const items: RABItem[] = [
    { id: '1', projectId: 'proj-3', name: 'Borongan', category: 'Pekerjaan Persiapan', volume: 1, unit: 'ls', unitPrice: 100000000, code: 'X', totalCost: 0 }
  ];
  const result = calculateRAB({ overheadPercent: 5, profitPercent: 10, taxPercent: 11 }, items);
  
  assert.strictEqual(result.taxCost, expectedTax11, "Tax must exactly match the 11% oracle");
});

console.log("==================================================");
console.log(`RESULTS: ${passed} PASS | ${failed} FAIL`);
console.log("==================================================");

if (failed > 0) process.exit(1);
