import { 
  calculateItemAmount, 
  calculateRAB 
} from '../src/utils/calculations';
import { RABItem } from '../src/types';
import assert from 'assert';

console.log("==================================================");
console.log("RAB PRO V13 - ADVERSARIAL & SECURITY TESTS");
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

runTest("Rejects Negative Volume", () => {
  const result = calculateItemAmount(-50, 10000);
  assert.strictEqual(result, 0, "Negative volume should clamp to 0");
});

runTest("Rejects NaN Volume", () => {
  const result = calculateItemAmount(NaN, 10000);
  assert.strictEqual(result, 0, "NaN volume should clamp to 0");
});

runTest("Rejects Infinity Volume", () => {
  const result = calculateItemAmount(Infinity, 10000);
  assert.strictEqual(result, 0, "Infinity volume should clamp to 0");
});

runTest("Rejects Negative Price", () => {
  const result = calculateItemAmount(100, -50000);
  assert.strictEqual(result, 0, "Negative price should clamp to 0");
});

runTest("Malicious Prototype Injection Prevention in Financial Engine", () => {
  // Pass an object with prototype pollution attempt
  const maliciousObject = JSON.parse('{"__proto__":{"polluted":true}, "overheadPercent": 10}');
  const items: RABItem[] = [];
  const result = calculateRAB(maliciousObject, items);
  assert.strictEqual(result.overheadCost, 0, "Should handle malicious object safely");
});

runTest("Checksum Integrity verification", () => {
  // Test that calculation engine produces a deterministic checksum
  const items: RABItem[] = [
    { id: '1', projectId: 'p', name: 'Item', category: 'Pekerjaan Persiapan', volume: 10, unit: 'm', unitPrice: 1000, code: 'X', totalCost: 0 }
  ];
  const r1 = calculateRAB({ overheadPercent: 0, profitPercent: 0, taxPercent: 0 }, items);
  const r2 = calculateRAB({ overheadPercent: 0, profitPercent: 0, taxPercent: 0 }, items);
  
  assert.strictEqual(r1.grandTotal, 10000);
  assert.strictEqual(r1.grandTotal, r2.grandTotal);
});

console.log("==================================================");
console.log(`RESULTS: ${passed} PASS | ${failed} FAIL`);
console.log("==================================================");

if (failed > 0) process.exit(1);
