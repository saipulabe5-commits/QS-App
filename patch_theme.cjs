const fs = require('fs');

// 1. AppContext: Add isDarkMode
let context = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
if (!context.includes('isDarkMode')) {
  context = context.replace(
    "isSafeMode: boolean;",
    "isSafeMode: boolean;\n  isDarkMode: boolean;\n  toggleDarkMode: () => void;"
  );
  context = context.replace(
    "const [isSafeMode, setIsSafeMode] = useState(false);",
    "const [isSafeMode, setIsSafeMode] = useState(false);\n  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');\n  const toggleDarkMode = () => {\n    setIsDarkMode(prev => {\n      const next = !prev;\n      localStorage.setItem('theme', next ? 'dark' : 'light');\n      if (next) document.documentElement.classList.add('dark');\n      else document.documentElement.classList.remove('dark');\n      return next;\n    });\n  };\n  useEffect(() => {\n    if (isDarkMode) document.documentElement.classList.add('dark');\n    else document.documentElement.classList.remove('dark');\n  }, []);"
  );
  context = context.replace(
    "    isSafeMode,",
    "    isSafeMode,\n    isDarkMode,\n    toggleDarkMode,"
  );
  fs.writeFileSync('src/context/AppContext.tsx', context);
}

// 2. MacToolbar: Add Toggle Button
let toolbar = fs.readFileSync('src/components/layout/MacToolbar.tsx', 'utf8');
if (!toolbar.includes('toggleDarkMode')) {
  toolbar = toolbar.replace(
    "const { user, logout } = useApp();",
    "const { user, logout, isDarkMode, toggleDarkMode } = useApp();\n  const Moon = require('lucide-react').Moon;\n  const Sun = require('lucide-react').Sun;"
  );
  
  const themeButton = `
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
            title="Toggle Dark/Light Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
`;
  toolbar = toolbar.replace(
    "{/* Offline Indicator */}",
    themeButton + "\n          {/* Offline Indicator */}"
  );
  fs.writeFileSync('src/components/layout/MacToolbar.tsx', toolbar);
}

// 3. App.tsx: Make main background responsive to dark mode
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(
  'className="flex flex-col h-screen bg-slate-100 text-slate-900 overflow-hidden antialiased select-none font-sans"',
  'className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden antialiased select-none font-sans transition-colors"'
);
fs.writeFileSync('src/App.tsx', app);

console.log("Theme context patched");
