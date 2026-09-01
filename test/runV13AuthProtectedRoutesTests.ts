import assert from 'assert';

console.log("==================================================");
console.log("RAB PRO V13 - PROTECTED ROUTES SECURITY TESTS");
console.log("==================================================");

let passed = 0;
let failed = 0;

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`[FAIL] ${name}\n       => ${err.message}`);
    failed++;
  }
}

async function testProtectedRoutes() {
  await runTest("requireAuth without token should fail", async () => {
    const res = await fetch("http://localhost:3000/api/auth/change-password", {
      method: "POST"
    });
    assert.strictEqual(res.status, 401, "Should return 401 Unauthorized");
  });

  await runTest("requireAdmin without token should fail (tests removal of isPreviewOrLocal bypass)", async () => {
    const res = await fetch("http://localhost:3000/api/export/source-code", {
      method: "GET",
      headers: { "sec-fetch-dest": "empty" }
    });
    assert.strictEqual(res.status, 403, "Should return 403 Forbidden due to security lockdown");
  });

  await runTest("requireAuth with forged JWT should fail", async () => {
    const res = await fetch("http://localhost:3000/api/auth/change-password", {
      method: "POST",
      headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" }
    });
    assert.strictEqual(res.status, 401, "Should return 401 Unauthorized");
  });

  console.log("==================================================");
  console.log(`RESULTS: ${passed} PASS | ${failed} FAIL`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

testProtectedRoutes();
