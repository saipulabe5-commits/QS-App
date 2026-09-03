const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '..', 'server.ts');
const content = fs.readFileSync(serverFile, 'utf-8');

let errors = [];

// Check JWT_SECRET
const jwtMatch = content.match(/const\s+JWT_SECRET\s*=\s*requireEnv\(['"]JWT_SECRET['"],\s*(\d+)\);/);
if (!jwtMatch) {
  errors.push("JWT_SECRET requireEnv call not found or malformed.");
} else if (parseInt(jwtMatch[1], 10) < 32) {
  errors.push(`JWT_SECRET length is less than 32. Found: ${jwtMatch[1]}`);
}

// Check ADMIN_INITIAL_PASSWORD
const pwdMatch = content.match(/const\s+initialPassword\s*=\s*requireEnv\(['"]ADMIN_INITIAL_PASSWORD['"],\s*(\d+)\);/);
if (!pwdMatch) {
  errors.push("ADMIN_INITIAL_PASSWORD requireEnv call not found or malformed.");
} else if (parseInt(pwdMatch[1], 10) < 8) {
  errors.push(`ADMIN_INITIAL_PASSWORD length is less than 8. Found: ${pwdMatch[1]}`);
}

if (errors.length > 0) {
  console.error("❌ Environment validation tests FAILED:");
  errors.forEach(e => console.error("  - " + e));
  process.exit(1);
} else {
  console.log("✅ Environment validation tests PASSED (JWT_SECRET >= 32, ADMIN_INITIAL_PASSWORD >= 8).");
}
