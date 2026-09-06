import re

with open('server.ts', 'r') as f:
    content = f.read()

# Add OWNER_EMAIL and OWNER_EMAIL_ALIAS definition after ADMIN_EMAIL
owner_env = """
const OWNER_EMAIL = requireEnv("OWNER_EMAIL", 5).trim().toLowerCase();
const OWNER_EMAIL_ALIAS = process.env.OWNER_EMAIL_ALIAS ? process.env.OWNER_EMAIL_ALIAS.trim().toLowerCase() : OWNER_EMAIL;
"""

content = content.replace('const adminEmail = requireEnv("ADMIN_EMAIL", 5).trim().toLowerCase();', 
    'const adminEmail = requireEnv("ADMIN_EMAIL", 5).trim().toLowerCase();\n' + owner_env.strip())

# Replace saipulabe@gmail.com and saipulabe5@gmail.com
# We have `if (userEmail === "saipulabe@gmail.com" || userEmail === "saipulabe5@gmail.com") {`
# to `if (userEmail === OWNER_EMAIL || userEmail === OWNER_EMAIL_ALIAS) {`

content = content.replace('userEmail === "saipulabe@gmail.com" || userEmail === "saipulabe5@gmail.com"', 'userEmail === OWNER_EMAIL || userEmail === OWNER_EMAIL_ALIAS')
content = content.replace('usersDb.get("saipulabe@gmail.com")', 'usersDb.get(OWNER_EMAIL)')
content = content.replace('usersDb.get("saipulabe5@gmail.com")', 'usersDb.get(OWNER_EMAIL_ALIAS)')

content = content.replace('normalizedEmail !== "saipulabe@gmail.com" && normalizedEmail !== "saipulabe5@gmail.com"', 'normalizedEmail !== OWNER_EMAIL && normalizedEmail !== OWNER_EMAIL_ALIAS')

# Now fix the error messages
content = re.sub(r'Hanya akun resmi saipulabe@gmail\.com yang', 'Hanya akun resmi ${OWNER_EMAIL} yang', content)
# But wait, it's inside a string literal, we need template literal for error messages if it has variable.
content = re.sub(r'"Akses Ditolak: Hanya akun resmi saipulabe@gmail\.com yang terdaftar di sistem ini\."', '`Akses Ditolak: Hanya akun resmi ${OWNER_EMAIL} yang terdaftar di sistem ini.`', content)
content = re.sub(r'"Akses Ditolak: Hanya akun resmi saipulabe@gmail\.com yang diizinkan\."', '`Akses Ditolak: Hanya akun resmi ${OWNER_EMAIL} yang diizinkan.`', content)

# Check for other mentions
# const ADMIN_USER_CONTEXT = { ... email: "saipulabe@gmail.com" }
content = content.replace('email: "saipulabe@gmail.com"', 'email: OWNER_EMAIL')

# SMTP_FROM
# we probably don't need to touch SMTP_FROM if it doesn't use the hardcoded one.
# Let's check: grep SMTP_FROM server.ts

with open('server.ts', 'w') as f:
    f.write(content)

