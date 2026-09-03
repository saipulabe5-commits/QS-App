import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const guardCode = `
// ==========================================
// ZERO-COST SAFEGUARD: GLOBAL AI RATE LIMITER
// ==========================================
const AI_QUOTA_FILE = path.join(process.cwd(), '.data', 'ai_usage.json');
const MAX_DAILY_REQUESTS = 1000; // Free tier buffer (Gemini Flash free tier is 1500/day)

async function checkAndIncrementAIQuota() {
  const today = new Date().toISOString().split('T')[0];
  let usage = { date: today, count: 0 };
  
  try {
    if (fs.existsSync(AI_QUOTA_FILE)) {
      const data = JSON.parse(await fs.promises.readFile(AI_QUOTA_FILE, 'utf8'));
      if (data.date === today) {
        usage = data;
      }
    }
  } catch (e) {
    console.error('Error reading AI quota:', e);
  }
  
  if (usage.count >= MAX_DAILY_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  
  usage.count += 1;
  
  try {
    const dir = path.dirname(AI_QUOTA_FILE);
    if (!fs.existsSync(dir)) await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(AI_QUOTA_FILE, JSON.stringify(usage));
  } catch (e) {
    console.error('Error writing AI quota:', e);
  }
  
  return { allowed: true, remaining: MAX_DAILY_REQUESTS - usage.count };
}

const aiZeroCostGuard = async (req, res, next) => {
  const quota = await checkAndIncrementAIQuota();
  if (!quota.allowed) {
    return res.status(429).json({
      error: "Batas pemakaian AI gratis harian (Zero-Cost Safeguard) telah tercapai. Silakan coba lagi besok.",
      success: false
    });
  }
  res.setHeader('X-AI-Quota-Remaining', quota.remaining);
  next();
};

app.use('/api/ai/*', aiZeroCostGuard);

`;

content = content.replace('app.post("/api/ai/chat",', guardCode + '\napp.post("/api/ai/chat",');
fs.writeFileSync('server.ts', content);
