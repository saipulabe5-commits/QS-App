const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
  /window\.addEventListener\('unhandledrejection', function\(e\) \{[\s\S]*?\}\);/,
  `window.addEventListener('unhandledrejection', function(e) {
        // Suppress Vite HMR WebSocket errors in preview
        const reasonStr = e.reason ? (e.reason.message || e.reason.toString()) : '';
        if (reasonStr.includes('WebSocket') || reasonStr.includes('closed without opened')) {
          console.warn('[VITE HMR] Suppressed benign websocket connection error in preview environment.');
          e.preventDefault(); // Stop it from appearing as "Unhandled Rejection"
          return;
        }
        console.warn('[NATIVE BOOT PROMISE REJECTION]', e.reason);
      });`
);

fs.writeFileSync('index.html', html);
