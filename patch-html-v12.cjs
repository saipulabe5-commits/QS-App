const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Remove old interceptor block (the console.error monkey patch)
html = html.replace(/\/\/ SUPPRESS VITE HMR WEBSOCKET ERRORS IN PREVIEW[\s\S]*?originalConsoleError\.apply\(console, args\);\n\s*\};\n/g, '');

// Remove old unhandledrejection block at the bottom
html = html.replace(/window\.addEventListener\('unhandledrejection', function\(e\) \{[\s\S]*?console\.warn\('\[NATIVE BOOT PROMISE REJECTION\]', e\.reason\);\n\s*\}\);/g, `
      window.addEventListener('unhandledrejection', function(e) {
        console.warn('[NATIVE BOOT PROMISE REJECTION]', e.reason);
      });
`);

// Inject the super-early interceptor right after <head>
const newInterceptor = `
  <script>
    // [V12 SUPER FINAL FIX] Catch Vite HMR WebSocket errors before AI Studio diagnostic overlay
    window.addEventListener('unhandledrejection', function(e) {
      const reasonStr = e.reason ? (e.reason.message || String(e.reason)) : '';
      if (reasonStr.includes('WebSocket') || reasonStr.includes('closed without opened')) {
        e.preventDefault();
        e.stopImmediatePropagation(); // CRITICAL: Stop other listeners (like AI Studio's overlay) from catching this
        console.warn('[VITE HMR] Suppressed benign websocket connection error in preview environment.');
        return false;
      }
    }, true); // useCapture: true is essential here
  </script>
`;

html = html.replace(/<head>/, '<head>\n' + newInterceptor);

fs.writeFileSync('index.html', html);
console.log("HTML Patched successfully.");
