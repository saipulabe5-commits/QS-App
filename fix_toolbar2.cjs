const fs = require('fs');
let content = fs.readFileSync('src/components/layout/MacToolbar.tsx', 'utf8');

// Revert the wrong import
content = content.replace(
  "import {\n  Moon,\n  Sun, useApp } from '../../context/AppContext';",
  "import { useApp } from '../../context/AppContext';"
);

// Add to lucide-react import
content = content.replace(
  "  Sliders,\n} from 'lucide-react';",
  "  Sliders,\n  Moon,\n  Sun,\n} from 'lucide-react';"
);

fs.writeFileSync('src/components/layout/MacToolbar.tsx', content);
console.log('Fixed MacToolbar again');
