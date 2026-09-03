const fs = require('fs');
let content = fs.readFileSync('src/components/layout/MacToolbar.tsx', 'utf8');

// Add the Moon/Sun import
content = content.replace(
  "import {",
  "import {\n  Moon,\n  Sun,"
);

// Add to useApp destructuring
content = content.replace(
  "    logout,",
  "    logout,\n    isDarkMode,\n    toggleDarkMode,"
);

fs.writeFileSync('src/components/layout/MacToolbar.tsx', content);
console.log('Fixed MacToolbar');
