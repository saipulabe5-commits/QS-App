# Add to server.ts
cat << 'SERVER_LOG' >> src/server_bugTracker_patch.js
// We need to inject this into server.ts

const fs = require('fs');

let serverContent = fs.readFileSync('server.ts', 'utf8');

const bugLoggerStr = `
import fsSync from 'fs';
interface BugLogEntry {
  id: string;
  timestamp: string;
  source: 'client' | 'server';
  severity: 'error' | 'warning' | 'info';
  category: 'runtime' | 'network' | 'react-error-boundary' | 'unhandled-rejection' | 'api-failure' | 'build' | 'other';
  message: string;
  stack?: string;
  route?: string;
  userEmail?: string;
  requestUrl?: string;
  requestMethod?: string;
  responseStatus?: number;
  metadata?: Record<string, any>;
}

const SERVER_BUG_LOG_PATH = path.join(__dirname, '.data/bug_log_server.json');

function initServerBugLog() {
  if (!fsSync.existsSync(path.join(__dirname, '.data'))) {
    fsSync.mkdirSync(path.join(__dirname, '.data'), { recursive: true });
  }
  if (!fsSync.existsSync(SERVER_BUG_LOG_PATH)) {
    fsSync.writeFileSync(SERVER_BUG_LOG_PATH, JSON.stringify([]));
  }
}

function logServerBug(entryData: Omit<BugLogEntry, 'id' | 'timestamp' | 'source'>) {
  try {
    initServerBugLog();
    const entry: BugLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      source: 'server',
      ...entryData
    };
    const data = JSON.parse(fsSync.readFileSync(SERVER_BUG_LOG_PATH, 'utf8'));
    data.unshift(entry);
    if (data.length > 1000) data.length = 1000;
    fsSync.writeFileSync(SERVER_BUG_LOG_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to log server bug:', err);
  }
}

// Global API to fetch bugs
app.get('/api/bugs', (req, res) => {
  try {
    initServerBugLog();
    const data = JSON.parse(fsSync.readFileSync(SERVER_BUG_LOG_PATH, 'utf8'));
    res.json({ success: true, serverBugs: data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to read server bugs' });
  }
});

app.post('/api/bugs/clear', (req, res) => {
  try {
    initServerBugLog();
    fsSync.writeFileSync(SERVER_BUG_LOG_PATH, JSON.stringify([]));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to clear server bugs' });
  }
});
`;

if (!serverContent.includes('logServerBug')) {
  // Inject after standard imports
  serverContent = serverContent.replace("const PORT = process.env.PORT || 3000;", "const PORT = process.env.PORT || 3000;\n" + bugLoggerStr);
  
  // Inject global error handler before app.listen
  const globalErrorHandler = `
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logServerBug({
    category: 'runtime',
    severity: 'error',
    message: err.message || String(err),
    stack: err.stack,
    requestUrl: req.url,
    requestMethod: req.method
  });
  next(err);
});
  `;
  serverContent = serverContent.replace("if (process.env.NODE_ENV !== 'production') {", globalErrorHandler + "\nif (process.env.NODE_ENV !== 'production') {");
  
  // Inject catching of API failures where status is set (4xx/5xx)
  // Let's do a simple monkey-patch of res.status to catch it.
  const middleware = `
app.use((req, res, next) => {
  const originalStatus = res.status;
  res.status = function(code) {
    if (code >= 400 && code < 600) {
      logServerBug({
        category: 'api-failure',
        severity: 'error',
        message: \`HTTP \${code} on \${req.method} \${req.url}\`,
        requestUrl: req.url,
        requestMethod: req.method,
        responseStatus: code
      });
    }
    return originalStatus.apply(this, arguments as any);
  };
  next();
});
`;
  serverContent = serverContent.replace("app.use(express.json({ limit: '50mb' }));", "app.use(express.json({ limit: '50mb' }));\n" + middleware);

  fs.writeFileSync('server.ts', serverContent);
}
SERVER_LOG
node src/server_bugTracker_patch.js
