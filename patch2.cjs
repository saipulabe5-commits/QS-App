const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /console\.log\(\`\[EMAIL DISPATCH\] Password recovery email dispatched successfully to: \$\{toEmail\} \| PIN: \$\{code\}\`\);/g,
  'console.log(`[EMAIL DISPATCH] Password recovery email dispatched successfully to: ${toEmail.replace(/(.{2}).*(@.*)/, "$1***$2")}`);'
);

fs.writeFileSync('server.ts', content);
