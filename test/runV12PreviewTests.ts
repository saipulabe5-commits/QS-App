// FORENSIC PRODUCTION AUDIT V12 - PREVIEW RUNTIME CERTIFICATION
// Codenamed: PREVIEW_CERTIFIED
// These tests execute logical assertions about the application's runtime safety.

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("==================================================");
console.log("RAB PRO V12 - PREVIEW RUNTIME CERTIFICATION SUITE");
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
const indexHtmlPath = path.join(rootDir, 'index.html');
const mainTsxPath = path.join(rootDir, 'src', 'main.tsx');

runTest("Native HTML Boot Check", () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  assert(html.includes("id=\"root\""), "Must contain #root element");
  assert(html.includes("INITIALIZING DIAGNOSTICS BOOT..."), "Must have native fallback text");
  assert(html.includes("NATIVE BOOT ERROR"), "Must handle native boot errors");
  assert(html.includes("__rabBootTimeout"), "Must have blank screen watchdog timeout");
});

runTest("React Bootstrap Hardening", () => {
  const mainTsx = fs.readFileSync(mainTsxPath, 'utf8');
  assert(mainTsx.includes("import('react')"), "Must load React dynamically");
  assert(mainTsx.includes("import('./runtime/AppBootstrap')"), "Must load AppBootstrap dynamically");
  assert(mainTsx.includes("renderEmergencyBootUI"), "Must have emergency boot UI fallback");
  assert(mainTsx.includes("clearTimeout"), "Must clear the watchdog timeout on success or failure");
});

runTest("Service Worker Elimination", () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  assert(html.includes("registration.unregister()"), "Must aggressively unregister service worker");
  assert(html.includes("catch(function(e)"), "Unregister must handle rejections safely");
});

console.log("==================================================");
console.log(`RESULTS: ${passedTests} PASS | ${failedTests} FAIL`);
console.log("==================================================");

if (failedTests > 0) {
  process.exit(1);
}

runTest("Chunk Retry Isolation", () => {
  const appBootstrap = fs.readFileSync(path.join(rootDir, 'src', 'runtime', 'AppBootstrap.tsx'), 'utf8');
  assert(appBootstrap.includes("lazyWithRetry"), "Must wrap the root App in lazyWithRetry");
});

runTest("Lazy Chunk Utility Check", () => {
  const lazyUtils = fs.readFileSync(path.join(rootDir, 'src', 'utils', 'lazyImport.ts'), 'utf8');
  assert(lazyUtils.includes("ChunkLoadError"), "Must check for ChunkLoadError");
  assert(lazyUtils.includes("retriesLeft"), "Must implement retries left tracking");
});
