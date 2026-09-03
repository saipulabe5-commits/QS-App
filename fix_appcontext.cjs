const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// 1. Add to AppContextType
if (!content.includes('isDarkMode: boolean;')) {
  content = content.replace(
    "  isDbBooting: boolean;",
    "  isDbBooting: boolean;\n  isDarkMode: boolean;\n  toggleDarkMode: () => void;"
  );
}

// 2. Add state
if (!content.includes('const [isDarkMode, setIsDarkMode]')) {
  content = content.replace(
    "const [isDbBooting, setIsDbBooting] = useState<boolean>(false);",
    "const [isDbBooting, setIsDbBooting] = useState<boolean>(false);\n  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {\n    if (typeof window !== 'undefined') {\n      return localStorage.getItem('rabpro_theme') === 'dark';\n    }\n    return false;\n  });\n\n  const toggleDarkMode = () => {\n    setIsDarkMode(prev => !prev);\n  };"
  );
}

// 3. Add useEffect to apply class and save to localStorage
if (!content.includes('localStorage.setItem(\'rabpro_theme\', isDarkMode ? \'dark\' : \'light\');')) {
  content = content.replace(
    "  // Save changes to IDB & LocalStorage debounce",
    "  useEffect(() => {\n    if (isDarkMode) {\n      document.documentElement.classList.add('dark');\n    } else {\n      document.documentElement.classList.remove('dark');\n    }\n    localStorage.setItem('rabpro_theme', isDarkMode ? 'dark' : 'light');\n  }, [isDarkMode]);\n\n  // Save changes to IDB & LocalStorage debounce"
  );
}

// 4. Add to Provider value
if (!content.includes('toggleDarkMode,')) {
  content = content.replace(
    "    isDbBooting,\n",
    "    isDbBooting,\n    isDarkMode,\n    toggleDarkMode,\n"
  );
}

fs.writeFileSync('src/context/AppContext.tsx', content);
console.log("AppContext updated");
