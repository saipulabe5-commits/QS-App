const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const requireEnvCode = `
function requireEnv(name, minLength = 1) {
  const value = process.env[name];
  if (!value || value.trim().length < minLength) {
    console.error(\`FATAL: Environment variable \${name} tidak diset atau tidak valid (min \${minLength} karakter). Server dihentikan demi keamanan.\`);
    process.exit(1);
  }
  return value;
}
`;

// Insert requireEnv after imports
content = content.replace('// Validate and load JWT Secret safely', requireEnvCode + '\n// Validate and load JWT Secret safely');

// Replace JWT_SECRET
content = content.replace(/const JWT_SECRET = process\.env\.JWT_SECRET;\nif \(\!JWT_SECRET \) \{\n  console\.error\(.*\);\n  process\.exit\(1\);\n\}/, 'const JWT_SECRET = requireEnv("JWT_SECRET", 32);');

// Replace ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD
content = content.replace(/const adminEmail = \(process\.env\.ADMIN_EMAIL \|\| ".*?"\)\.trim\(\)\.toLowerCase\(\);/, 'const adminEmail = requireEnv("ADMIN_EMAIL", 5).trim().toLowerCase();');
content = content.replace(/const initialPassword = process\.env\.ADMIN_INITIAL_PASSWORD;\nif \(\!initialPassword \|\| initialPassword\.length < 8\) \{\n  console\.error\(.*\);\n  process\.exit\(1\);\n\}/, 'const initialPassword = requireEnv("ADMIN_INITIAL_PASSWORD", 8);');

// Replace alias emails
content = content.replace(/const aliasEmail = "saipulabe5@gmail\.com";/, 'const aliasEmail = "alias_tidak_dipakai_lagi@gmail.com";');
content = content.replace(/if \(adminEmail === "saipulabe@gmail\.com"\)/, 'if (false)');

// Fix login strict check
content = content.replace(/if \(normalizedEmail !== "saipulabe@gmail\.com" && normalizedEmail !== "saipulabe5@gmail\.com"\)/, 'if (normalizedEmail !== adminEmail)');
content = content.replace(/Hanya satu akun tunggal resmi \(saipulabe@gmail\.com\) yang diizinkan/, 'Hanya akun resmi yang diizinkan');

fs.writeFileSync('server.ts', content);
console.log('Patched server.ts env vars');
