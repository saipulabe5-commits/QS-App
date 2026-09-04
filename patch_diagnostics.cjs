const fs = require('fs');
let content = fs.readFileSync('src/components/diagnostics/DiagnosticsModal.tsx', 'utf8');

// Ensure BugMonitorView is imported
if (!content.includes('BugMonitorView')) {
  content = content.replace(/import \{ AILogger/g, "import { BugMonitorView } from './BugMonitorView';\nimport { AILogger");
}

if (!content.includes('bugs')) {
  content = content.replace(/useState<'boot' \| 'storage' \| 'financial' \| 'system' \| 'ai'>\('boot'\)/g, "useState<'boot' | 'storage' | 'financial' | 'system' | 'ai' | 'bugs'>('boot')");
  
  content = content.replace(/\{ id: 'ai', label: 'AI Operations', icon: Bot \},/g, "{ id: 'ai', label: 'AI Operations', icon: Bot }, { id: 'bugs', label: 'Bug Monitor', icon: AlertTriangle },");
  
  content = content.replace(/\{activeTab === 'ai' && renderAILogs\(\)\}/g, "{activeTab === 'ai' && renderAILogs()}\n{activeTab === 'bugs' && <BugMonitorView />}");
}

fs.writeFileSync('src/components/diagnostics/DiagnosticsModal.tsx', content);
