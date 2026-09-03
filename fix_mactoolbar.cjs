const fs = require('fs');
let content = fs.readFileSync('src/components/layout/MacToolbar.tsx', 'utf8');

if (!content.includes('import { Moon, Sun } from \'lucide-react\';') && !content.includes('Moon,') && !content.includes('Sun,')) {
    content = content.replace(
      "  Sliders,\n} from 'lucide-react';",
      "  Sliders,\n  Moon,\n  Sun,\n} from 'lucide-react';"
    );
}

if (!content.includes('toggleDarkMode')) {
  content = content.replace(
    "    logout,\n    showToast,\n  } = useApp();",
    "    logout,\n    isDarkMode,\n    toggleDarkMode,\n    showToast,\n  } = useApp();"
  );
}

if (!content.includes('title="Toggle Dark/Light Mode"')) {
  content = content.replace(
    "          {/* Offline Indicator */}",
    "          {/* Theme Toggle */}\n          <button\n            onClick={toggleDarkMode}\n            className=\"p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors\"\n            title=\"Toggle Dark/Light Mode\"\n          >\n            {isDarkMode ? <Sun className=\"w-4 h-4\" /> : <Moon className=\"w-4 h-4\" />}\n          </button>\n\n          {/* Offline Indicator */}"
  );
}

fs.writeFileSync('src/components/layout/MacToolbar.tsx', content);
console.log("MacToolbar updated");
