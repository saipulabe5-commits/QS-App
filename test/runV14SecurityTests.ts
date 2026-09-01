import assert from 'assert';

console.log("==================================================");
console.log("RAB PRO V14 - MAXIMUM SECURITY ZERO TRUST TESTS");
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

async function testSecurity() {
  await runTest("Registration should be disabled (404 Not Found)", async () => {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "saipulabe@gmail.com", password: "NewPassword123!" })
    });
    // It should be 404 because we removed the endpoint
    assert.strictEqual(res.status, 404, `Should return 404 Not Found, got ${res.status}`);
  });

  await runTest("Login with wrong password should fail (401)", async () => {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "saipulabe@gmail.com", password: "wrong_password" })
    });
    assert.strictEqual(res.status, 401, `Should return 401 Unauthorized, got ${res.status}`);
  });

  await runTest("Login with correct default password should succeed", async () => {
    const correctPassword = process.env.ADMIN_INITIAL_PASSWORD || "Bismillah_01";
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "saipulabe@gmail.com", password: correctPassword })
    });
    assert.strictEqual(res.status, 200, `Should return 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.token, "Should issue a token");
  });

  await runTest("GET /api/auth/me without token should fail", async () => {
    const res = await fetch("http://localhost:3000/api/auth/me", {
      method: "GET"
    });
    assert.strictEqual(res.status, 401, `Should return 401 Unauthorized, got ${res.status}`);
  });

  await runTest("GET /api/auth/me with forged token should fail", async () => {
    const res = await fetch("http://localhost:3000/api/auth/me", {
      method: "GET",
      headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" }
    });
    assert.strictEqual(res.status, 401, `Should return 401 Unauthorized, got ${res.status}`);
  });
  
  await runTest("POST /api/auth/reset-password should fail with invalid code", async () => {
    const res = await fetch("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "saipulabe@gmail.com", resetCode: "112233", newPassword: "password123" })
    });
    assert.strictEqual(res.status, 400, `Should return 400 Bad Request, got ${res.status}`);
  });

  console.log("==================================================");
  console.log(`RESULTS: ${passed} PASS | ${failed} FAIL`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

testSecurity();
