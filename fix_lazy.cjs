const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

const toLazy = [
  'InspectorPanel',
  'CommandBar',
  'ProjectSwitcherModal',
  'KeyboardShortcutsModal',
  'DiagnosticsModal'
];

toLazy.forEach(component => {
  const regex = new RegExp(`import { ${component} } from '.\/components\/.*?';`, 'g');
  const match = app.match(regex);
  if (match) {
    const path = match[0].split("'")[1];
    app = app.replace(regex, `const ${component} = lazyWithRetry(() => import('${path}').then(m => ({ default: m.${component} })));`);
  }
});

fs.writeFileSync('src/App.tsx', app);
console.log("App.tsx updated to lazy load modals and panels");
