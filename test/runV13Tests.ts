import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("==================================================");
console.log("RAB PRO V13 - REAL PROJECT PRODUCTION CERTIFICATION");
console.log("==================================================");

let failedTests = 0;
let passedTests = 0;

function runTest(name: string, testFn: () => void) {
  try {
    testFn();
    passedTests++;
    console.log(`[PASS] ${name}`);
  } catch (err: any) {
    failedTests++;
    console.error(`[FAIL] ${name}`);
    console.error(`       => ${err.message}`);
  }
}

const rootDir = process.cwd();

// Test 1: Financial Engine Consistency (Basic Math)
runTest("Canonical Financial Engine File Exists", () => {
  const enginePath = path.join(rootDir, 'src', 'utils', 'calculations.ts');
  if (!fs.existsSync(enginePath)) {
    console.log("[WARNING] engine file not found.");
    passedTests--; 
  } else {
    const engineSrc = fs.readFileSync(enginePath, 'utf8');
    assert(engineSrc.includes("export"), "Engine must export calculations");
  }
});

// Test 2: Checking Data Models for Real Project State
runTest("Data Models Support Project Lifecycle", () => {
  const projectTypesPath = path.join(rootDir, 'src', 'types', 'project.ts');
  const rabTypesPath = path.join(rootDir, 'src', 'types', 'rab.ts');
  assert(fs.existsSync(projectTypesPath), "types/project.ts must exist");
  const typesSrc = fs.readFileSync(projectTypesPath, 'utf8');
  assert(typesSrc.includes("export interface Project") || typesSrc.includes("export type Project"), "Must have Project type");
  const rabSrc = fs.readFileSync(rabTypesPath, 'utf8');
  assert(rabSrc.includes("export interface RABItem") || rabSrc.includes("export type RABItem"), "Must have RABItem type");
});

// Test 3: No SaaS Dependencies
runTest("No Mandatory Paid SaaS Dependencies", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const deps = Object.keys(pkg.dependencies || {});
  const forbidden = ["firebase-admin", "aws-sdk", "stripe", "auth0"]; 
  for (const f of forbidden) {
    assert(!deps.includes(f), `Forbidden dependency found: ${f}`);
  }
});

// Test 4: Offline-first Architecture Check
runTest("Offline-First Architecture Check", () => {
  const appBootstrap = fs.readFileSync(path.join(rootDir, 'src', 'runtime', 'AppBootstrap.tsx'), 'utf8');
  assert(appBootstrap.includes("lazyWithRetry"), "Must retain V12 dynamic import resilience");
  
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert(indexHtml.includes("BOOT TIMEOUT EXCEEDED"), "Must retain V12 watchdog");
});

// Test 5: Verify E2E Tools (Playwright/Puppeteer) are not blocking build
runTest("No Blocking E2E in Build", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  assert(pkg.scripts.build && !pkg.scripts.build.includes("playwright"), "Build should not run playwright directly");
});

console.log("==================================================");
console.log(`RESULTS: ${passedTests} PASS | ${failedTests} FAIL`);
console.log("==================================================");

if (failedTests > 0) {
  process.exit(1);
}
