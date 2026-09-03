import { runDeterministicAudit } from '../src/services/financialAuditAgent';

async function testFinancialAudit() {
  console.log("Running AI Financial Agent Deterministic Test...");
  const dummyProject = { id: "p1", name: "Test Project", type: "Rumah", budget_range: "standar" } as any;
  const dummyItems = [
    { id: "i1", name: "Galian Tanah", category: "Persiapan", volume: 0, unitPrice: 50000, unit: "m3" }, // Zero volume -> fatal
    { id: "i2", name: "Beton", category: "Struktur", volume: 10, unitPrice: 0, unit: "m3" }, // Zero price -> fatal
    { id: "i3", name: "Beton", category: "Struktur", volume: 5, unitPrice: 100000, unit: "m3" }, // Duplicate -> warning
  ] as any;
  
  const dummyCalc = {
    subtotal: 500000,
    overheadCost: 50000,
    profitCost: 50000,
    grandTotal: 500000 // Inconsistent grandTotal (should be 600000) -> fatal
  } as any;

  const result = runDeterministicAudit(dummyProject, dummyItems, dummyCalc);
  console.log("Anomalies detected:");
  result.anomalies.forEach(a => console.log(`- [${a.severity}] ${a.type}: ${a.message}`));
  
  const hasZeroVolume = result.anomalies.some(a => a.type === 'zero_volume');
  const hasOHInconsistency = result.anomalies.some(a => a.type === 'oh_profit_inconsistency');
  const hasDuplicate = result.anomalies.some(a => a.type === 'duplicate_item');

  if (hasZeroVolume && hasOHInconsistency && hasDuplicate) {
    console.log("✅ Regression Test for OH&P Bug PASSED! Financial agent successfully caught the inconsistency.");
    return true;
  } else {
    console.log("❌ Regression Test FAILED! Agent missed anomalies.");
    return false;
  }
}

async function run() {
  console.log("==================================================");
  console.log("RAB PRO V17 - END-TO-END INTEGRATION TESTS");
  console.log("==================================================");
  let passed = 0;
  
  if (await testFinancialAudit()) passed++;
  
  console.log("==================================================");
  console.log(`RESULTS: ${passed} PASS | ${1 - passed} FAIL`);
  console.log("Integration Test Suite Completed.");
  console.log("==================================================");
}

run();
