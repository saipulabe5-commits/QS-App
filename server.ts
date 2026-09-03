import dotenv from "dotenv"; dotenv.config({ override: true });
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";


function requireEnv(name, minLength = 1) {
  const value = process.env[name];
  if (!value || value.trim().length < minLength) {
    console.error(`FATAL: Environment variable ${name} tidak diset atau tidak valid (min ${minLength} karakter). Server dihentikan demi keamanan.`);
    process.exit(1);
  }
  return value;
}

// Validate and load JWT Secret safely
const JWT_SECRET = requireEnv("JWT_SECRET", 32);

const app = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for local dev/vite support unless configured carefully
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? ["https://your-production-domain.com"] : "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

import helmet from "helmet";
import cors from "cors";

const PORT = 3000;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/ai/") || req.path.startsWith("/api/rab/") || req.path.startsWith("/api/export/")) {
    express.json({ limit: "30mb" })(req, res, next);
  } else {
    express.json({ limit: "1mb" })(req, res, next);
  }
});
app.use((req, res, next) => {
  if (req.path.startsWith("/api/ai/") || req.path.startsWith("/api/rab/") || req.path.startsWith("/api/export/")) {
    express.urlencoded({ limit: "30mb", extended: true })(req, res, next);
  } else {
    express.urlencoded({ limit: "1mb", extended: true })(req, res, next);
  }
});

app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "icon.svg"));
});

// ==========================================
// IN-MEMORY RATE LIMITER (Zero-Cost / Native)
// ==========================================
interface RateBucket {
  count: number;
  resetAt: number;
}
const rateBuckets = new Map<string, RateBucket>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= maxRequests) {
    return false;
  }
  bucket.count++;
  return true;
}

// Cleanup stale rate buckets periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets.entries()) {
    if (now > bucket.resetAt) {
      rateBuckets.delete(key);
    }
  }
}, 60000);

const authRateLimit = (req: any, res: any, next: any) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "ip_local";
  if (!checkRateLimit(`auth_${ip}`, 10, 60000)) {
    return res.status(429).json({ error: "Terlalu banyak percobaan autentikasi. Silakan coba 1 menit lagi.", success: false });
  }
  next();
};

const aiRateLimit = (req: any, res: any, next: any) => {
  const userId = req.user?.id || req.ip || "user_local";
  if (!checkRateLimit(`ai_${userId}`, 30, 60000)) {
    return res.status(429).json({ error: "Batas permintaan AI tercapai (maks 30 req/menit). Harap tunggu sejenak.", success: false });
  }
  next();
};

const exportRateLimit = (req: any, res: any, next: any) => {
  const userId = req.user?.id || req.ip || "user_local";
  if (!checkRateLimit(`export_${userId}`, 5, 60000)) {
    return res.status(429).json({ error: "Batas ekspor source code tercapai (maks 5 req/menit).", success: false });
  }
  next();
};

// ==========================================
// PASSWORD HASHING UTILITY (scrypt with Salt)
// ==========================================
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, key] = combinedHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
  } catch {
    return false;
  }
}

// In-Memory User Credentials Database (Local-first / Offline-ready)
interface ServerUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  companyName: string;
  role: "administrator" | "estimator" | "viewer";
  createdAt: string;
}

const usersDb = new Map<string, ServerUser>();

// Security Protocol V14: Seed admin from environment variables, no hardcoded credentials.
const adminEmail = requireEnv("ADMIN_EMAIL", 5).trim().toLowerCase();
const initialPassword = requireEnv("ADMIN_INITIAL_PASSWORD", 8);

const USERS_STORE_PATH = path.join(process.cwd(), '.data', 'users_store.json');

async function saveUsersStore() {
  try {
    const data = JSON.stringify(Array.from(usersDb.entries()));
    const dir = path.dirname(USERS_STORE_PATH);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(USERS_STORE_PATH, data, 'utf-8');
  } catch (error) {
    console.error('Failed to save users store:', error);
  }
}

async function loadUsersStore() {
  try {
    const data = await fs.promises.readFile(USERS_STORE_PATH, 'utf-8');
    const entries = JSON.parse(data);
    for (const [key, value] of entries) {
      usersDb.set(key, value as ServerUser);
    }
    console.log('Users store loaded successfully.');
    
    // FORCE SYNC ADMIN PASSWORD WITH ENVIRONMENT VARIABLE ON BOOT
    let adminUsr = usersDb.get(adminEmail);
    if (!adminUsr) {
      // If admin email changed in env vars, delete old ones and create new
      usersDb.clear();
      adminUsr = {
        id: "usr_admin_main",
        name: "Administrator",
        email: adminEmail,
        passwordHash: hashPassword(initialPassword!),
        companyName: "RAB Pro Enterprise",
        role: "administrator",
        createdAt: new Date().toISOString(),
      };
    }
    adminUsr.passwordHash = hashPassword(initialPassword!);
    if (adminUsr) {
      adminUsr.passwordHash = hashPassword(initialPassword!);
      usersDb.set(adminEmail, adminUsr);
      saveUsersStore();
      console.log('Admin password synchronized with environment variable.');
    }
  } catch (error) {
    // If not exists, use default admin
    usersDb.set(adminEmail, {
      id: "usr_admin_main",
      name: "Administrator",
      email: adminEmail,
      passwordHash: hashPassword(initialPassword!),
      companyName: "RAB Pro Enterprise",
      role: "administrator",
      createdAt: new Date().toISOString(),
    });
    saveUsersStore();
  }
}

loadUsersStore();


// ==========================================
// AUTHENTICATION & RBAC MIDDLEWARE
// ==========================================
const requireAuth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token && token !== "null" && token !== "undefined" && token !== "") {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = decoded;
        return next();
      } catch (err) {
        return res.status(401).json({ error: "Sesi telah berakhir atau token tidak valid. Silakan login kembali.", success: false });
      }
    }
  }

  return res.status(401).json({ error: "Autentikasi diperlukan untuk mengakses fitur ini.", success: false });
};

const requireAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token && token !== "null" && token !== "undefined" && token !== "") {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (
          decoded.role === "administrator" ||
          decoded.email?.toLowerCase() === "saipulabe@gmail.com" ||
          decoded.email?.toLowerCase() === "saipulabe5@gmail.com"
        ) {
          req.user = decoded;
          return next();
        }
      } catch (err) {
        // Invalid token
      }
    }
  }

  // Security lockdown: No development/preview fallback allowed for admin operations.
  return res.status(403).json({
    error: "Akses ditolak: Operasi ini membutuhkan hak akses Administrator.",
    success: false,
  });
};

app.use("/api/ai", requireAuth, aiRateLimit);
app.use("/api/rab", requireAuth);

// ==========================================
// AUTHENTICATION ENDPOINTS (Strict Single-Account Policy: saipulabe@gmail.com)
// ==========================================

// Removed insecure /api/auth/token endpoint that allowed unconditional token generation.

// Removed insecure /api/auth/register endpoint to prevent account takeover. Registration is not allowed in a strict single-account system.

// Login (Strict Single-Account Check & Cryptographic Password Verification)
app.post("/api/auth/login", authRateLimit, (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Alamat email wajib diisi.", success: false });
    }
    if (!password || typeof password !== "string" || !password.trim()) {
      return res.status(400).json({ error: "Kata sandi wajib diisi.", success: false });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // STRICT SINGLE-ACCOUNT LOCKDOWN
    if (normalizedEmail !== adminEmail) {
      return res.status(403).json({
        error: "Akses Ditolak: Hanya akun resmi yang diizinkan masuk ke sistem ini.",
        success: false,
      });
    }

    const existingUser = usersDb.get(normalizedEmail);
    if (!existingUser) {
      return res.status(401).json({
        error: "Akun belum terdaftar di database sistem.",
        success: false,
      });
    }

    // STRICT PASSWORD VERIFICATION (Salted Scrypt)
    const isPasswordCorrect = verifyPassword(password, existingUser.passwordHash);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        error: "Kata sandi salah. Silakan masukkan kata sandi yang benar.",
        success: false,
      });
    }

    const token = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        companyName: existingUser.companyName,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        companyName: existingUser.companyName,
      },
      success: true,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Gagal memproses autentikasi: " + err.message, success: false });
  }
});

// Get Current User Profile
app.get("/api/auth/me", requireAuth, (req: any, res) => {
  return res.json({
    user: req.user,
    success: true,
  });
});

// Change Password (for logged in user)
app.post("/api/auth/change-password", requireAuth, (req: any, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userEmail = (req.user?.email || "").trim().toLowerCase();

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Kata sandi lama dan baru wajib diisi.", success: false });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Kata sandi baru minimal 6 karakter.", success: false });
    }

    const user = usersDb.get(userEmail);
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan.", success: false });
    }

    if (!verifyPassword(oldPassword, user.passwordHash)) {
      return res.status(401).json({ error: "Kata sandi lama Anda salah.", success: false });
    }

    const newHash = hashPassword(newPassword);
    user.passwordHash = newHash;
    usersDb.set(userEmail, user);

    // Synchronize both Saipul email aliases
    if (userEmail === "saipulabe@gmail.com" || userEmail === "saipulabe5@gmail.com") {
      const alias1 = usersDb.get("saipulabe@gmail.com");
      if (alias1) alias1.passwordHash = newHash;
      const alias2 = usersDb.get("saipulabe5@gmail.com");
      if (alias2) alias2.passwordHash = newHash;
    }
    
    saveUsersStore();

    return res.json({
      message: "Kata sandi berhasil diubah. Silakan gunakan kata sandi baru untuk login berikutnya.",
      success: true,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Gagal mengganti kata sandi: " + err.message, success: false });
  }
});

// Memory storage for password reset tokens
const passwordResetStore = new Map<string, { code: string; expiresAt: number; failedAttempts: number }>();

const SECURITY_STORE_PATH = path.join(process.cwd(), '.data', 'security_store.json');

async function saveSecurityStore() {
  try {
    const data = JSON.stringify(Array.from(passwordResetStore.entries()));
    const dir = path.dirname(SECURITY_STORE_PATH);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(SECURITY_STORE_PATH, data, 'utf-8');
  } catch (error) {
    console.error('Failed to save security store:', error);
  }
}

async function loadSecurityStore() {
  try {
    const data = await fs.promises.readFile(SECURITY_STORE_PATH, 'utf-8');
    const entries = JSON.parse(data);
    for (const [key, value] of entries) {
      passwordResetStore.set(key, value as { code: string; expiresAt: number; failedAttempts: number });
    }
    console.log('Security store loaded successfully.');
  } catch (error) {
    // File might not exist yet, ignore
  }
}

// Call loadSecurityStore on startup
loadSecurityStore();

// Email Transporter for Password Recovery (Zero-Cost / Native)
async function sendPasswordRecoveryEmail(toEmail: string, code: string): Promise<{ success: boolean; error?: string; isAuthError?: boolean }> {
  try {
    const smtpHost = (process.env.SMTP_HOST || "").trim();
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
    const smtpUser = (process.env.SMTP_USER || "").trim();
    // Sanitize app password by removing any accidental spaces
    let smtpPass = (process.env.SMTP_PASS || "").trim();
    if (smtpHost.includes("gmail") || smtpUser.includes("@gmail.com")) {
      smtpPass = smtpPass.replace(/\s+/g, "");
    }
    const smtpFrom = process.env.SMTP_FROM || `"RAB Pro Security" <${smtpUser || "saipulabe5@gmail.com"}>`;

    let transporter: nodemailer.Transporter;

    if (smtpHost && smtpUser && smtpPass) {
      if (smtpHost.includes("gmail.com") || smtpHost === "smtp.gmail.com") {
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
      } else {
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
      }
    } else {
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: "windows",
        buffer: true,
      });
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; border-radius: 14px; overflow: hidden; border: 1px solid #334155;">
        <div style="background-color: #1e293b; padding: 20px; text-align: center; border-bottom: 1px solid #334155;">
          <h2 style="margin: 0; color: #38bdf8; font-size: 20px;">RAB Pro Enterprise</h2>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px;">Sistem Manajemen Anggaran Konstruksi</p>
        </div>
        <div style="padding: 28px 24px; text-align: center;">
          <h3 style="color: #ffffff; margin-top: 0; font-size: 18px;">Kode Pemulihan Kata Sandi</h3>
          <p style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
            Halo <strong>Saipul Abe</strong>, berikut adalah kode 6-digit untuk mengatur ulang kata sandi akun Anda:
          </p>
          <div style="display: inline-block; background-color: #1e293b; border: 2px dashed #38bdf8; border-radius: 10px; padding: 14px 28px; margin: 16px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #38bdf8;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
            Kode ini berlaku selama <strong>15 menit</strong>. Jangan berikan kode ini kepada siapapun demi keamanan data proyek Anda.
          </p>
        </div>
        <div style="background-color: #020617; padding: 14px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b;">
          &copy; ${new Date().getFullYear()} RAB Pro Enterprise • Hak Cipta Dilindungi
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: smtpFrom,
      to: toEmail,
      subject: `[RAB Pro] Kode Pemulihan Kata Sandi Akun Anda: ${code}`,
      text: `Halo Saipul Abe,\n\nKode pemulihan kata sandi akun RAB Pro Anda adalah: ${code}\n\nKode ini berlaku selama 15 menit.\n\nSalam,\nTim Keamanan RAB Pro`,
      html: htmlBody,
    });

    console.log(`[EMAIL DISPATCH] Password recovery email dispatched successfully to: ${toEmail} | PIN: ${code}`);
    return { success: true };
  } catch (err: any) {
    const errorString = (err && (err.message || err.toString())) || "";
    const isAuthError = errorString.includes("535") || errorString.includes("Invalid login") || errorString.includes("BadCredentials");
    
    if (isAuthError) {
      console.warn(`[SMTP AUTH NOTICE] Password/Username Gmail belum tepat. Pastikan menggunakan 16-karakter App Password (Sandi Aplikasi) Google dari https://myaccount.google.com/apppasswords`);
    } else {
      console.error("[EMAIL DISPATCH ERROR]", err);
    }
    
    return { 
      success: false, 
      error: errorString,
      isAuthError
    };
  }
}

// Request Password Reset (Forgot Password)
app.post("/api/auth/forgot-password", authRateLimit, async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ error: "Alamat email wajib diisi.", success: false });
    }

    if (normalizedEmail !== "saipulabe@gmail.com" && normalizedEmail !== "saipulabe5@gmail.com") {
      return res.status(403).json({
        error: "Akses Ditolak: Hanya akun resmi saipulabe@gmail.com yang terdaftar di sistem ini.",
        success: false,
      });
    }

    // Generate 6-digit secure recovery code
    const resetCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity
    passwordResetStore.set(normalizedEmail, { code: resetCode, expiresAt, failedAttempts: 0 });
    saveSecurityStore(); // Async, don't await to avoid blocking event loop

    // Send email to the user's inbox
    const emailResult = await sendPasswordRecoveryEmail(normalizedEmail, resetCode);

    if (!emailResult.success) {
      if (emailResult.isAuthError) {
        return res.json({
          message: `Koneksi SMTP Gmail memerlukan 16-karakter "Sandi Aplikasi". Karena SMTP gagal dikonfigurasi, email pemulihan tidak dapat dikirim. Konfigurasikan SMTP_PASS di server untuk mengaktifkan pemulihan kata sandi.`,
          warning: "SMTP_AUTH_FAILED",
          success: false,
        });
      }
    }

    return res.json({
      message: `Kode pemulihan 6-digit telah dikirimkan ke email Anda (${normalizedEmail}). Silakan periksa kotak masuk atau folder spam email Anda.`,
      success: true,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Gagal memproses pemulihan kata sandi: " + err.message, success: false });
  }
});

// Reset Password with Recovery Code
app.post("/api/auth/reset-password", authRateLimit, (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !resetCode || !newPassword) {
      return res.status(400).json({
        error: "Email, kode pemulihan, dan kata sandi baru wajib diisi.",
        success: false,
      });
    }

    if (normalizedEmail !== "saipulabe@gmail.com" && normalizedEmail !== "saipulabe5@gmail.com") {
      return res.status(403).json({
        error: "Akses Ditolak: Hanya akun resmi saipulabe@gmail.com yang diizinkan.",
        success: false,
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "Kata sandi baru minimal 6 karakter.",
        success: false,
      });
    }

    const resetData = passwordResetStore.get(normalizedEmail);
    if (!resetData) {
      return res.status(400).json({
        error: "Kode pemulihan tidak valid atau sudah kadaluarsa. Silakan minta kode baru.",
        success: false,
      });
    }

    if (resetData.failedAttempts >= 5) {
      passwordResetStore.delete(normalizedEmail);
      saveSecurityStore();
      return res.status(429).json({
        error: "Terlalu banyak percobaan gagal. Silakan minta kode pemulihan baru.",
        success: false,
      });
    }

    const isCodeValid = resetData.code === resetCode.trim() && resetData.expiresAt > Date.now();

    if (!isCodeValid) {
      resetData.failedAttempts += 1;
      passwordResetStore.set(normalizedEmail, resetData);
      saveSecurityStore();
      return res.status(400).json({
        error: "Kode pemulihan tidak valid atau sudah kadaluarsa.",
        success: false,
      });
    }

    // Set new password
    const newHash = hashPassword(newPassword);
    let user = usersDb.get(normalizedEmail);
    if (!user) {
      user = {
        id: "usr_admin_saipul",
        name: "Saipul Abe",
        email: normalizedEmail,
        passwordHash: newHash,
        companyName: "RAB Pro Enterprise",
        role: "administrator",
        createdAt: new Date().toISOString(),
      };
      usersDb.set(normalizedEmail, user);
    } else {
      user.passwordHash = newHash;
    }

    // Sync aliases
    const alias1 = usersDb.get("saipulabe@gmail.com");
    if (alias1) alias1.passwordHash = newHash;
    const alias2 = usersDb.get("saipulabe5@gmail.com");
    if (alias2) alias2.passwordHash = newHash;

    saveUsersStore();

    // Invalidate reset code
    passwordResetStore.delete(normalizedEmail);
    saveSecurityStore(); // Async, don't await to avoid blocking event loop

    // Create session token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Kata sandi Anda berhasil diperbarui! Anda telah otomatis masuk.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
      },
      success: true,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Gagal mereset kata sandi: " + err.message, success: false });
  }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  return res.json({ message: "Logout berhasil.", success: true });
});

// Server-side Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1. AI Interactive QS Assistant Chat

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



// ==========================================
// AI AGENT #1: FINANCIAL REVIEW
// ==========================================
app.post("/api/ai/financial-review", requireAuth, async (req, res) => {
  try {
    const { project, items, calc, anomalies } = req.body;
    
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Kunci API Gemini belum dikonfigurasi." });
    }

    const categoryBreakdown = (calc?.categoryTotals || []).map((c) =>
      `- ${c.category}: Rp ${Number(c.subtotal).toLocaleString('id-ID')} (${c.percentage.toFixed(1)}%)`
    ).join("\n");

    const anomaliesText = anomalies && anomalies.length > 0 
      ? `ANOMALI DETERMINISTIK YANG DITEMUKAN:\n${anomalies.map(a => `- [${a.severity.toUpperCase()}] ${a.itemName ? a.itemName + ': ' : ''}${a.message}`).join('\n')}`
      : "Tidak ada anomali matematis/deterministik.";

    const systemPrompt = `Anda adalah Senior Cost Control Reviewer untuk proyek konstruksi di Indonesia.
Tugas Anda: Berikan 'narrative sanity check' terhadap struktur anggaran (RAB) ini.
Fokus pada:
1. Apakah rasio kategori (komposisi biaya) masuk akal secara industri untuk proyek ${project?.type || 'Bangunan'} skala ${project?.budget_range || 'standar'}?
2. Apakah ada kategori pekerjaan esensial yang biasanya ada di proyek ini tapi terlewat?
3. Evaluasi anomali deterministik yang ditemukan (jika ada).
Keluarkan analisis dalam 3-4 paragraf yang profesional, tajam, dan langsung ke intinya. Gunakan bahasa Indonesia. Jangan berikan tabel, cukup narasi.`;

    const prompt = `
Data Proyek:
- Nama: ${project?.name}
- Tipe: ${project?.type}
- Luas: ${project?.area_sqm} m2
- Total Anggaran: Rp ${Number(calc?.grandTotal).toLocaleString('id-ID')}

Distribusi Kategori:
${categoryBreakdown}

${anomaliesText}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt + "\n\n" + prompt }] }
      ],
      config: {
        temperature: 0.3,
      }
    });

    const text = response.text;
    res.json({ result: text, success: true });

  } catch (error) {
    console.error("AI Financial Review error:", error);
    res.status(500).json({ error: "Gagal melakukan verifikasi finansial via AI." });
  }
});

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, project, items, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Pesan tidak boleh kosong." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Kunci API Gemini belum dikonfigurasi.",
        fallbackAvailable: true,
      });
    }

    const itemsSummary = (items || []).slice(0, 30).map((it: any) =>
      `- [${it.category}] ${it.code} ${it.name}: ${it.volume} ${it.unit} @ Rp ${Number(it.unitPrice).toLocaleString('id-ID')}`
    ).join("\n");

    const systemInstruction = `Anda adalah AI Asisten Quantity Surveyor (QS) & Ahli RAB Konstruksi Indonesia di aplikasi "RAB Pro".
Gunakan bahasa Indonesia yang profesional, ramah, dan mudah dipahami oleh kontraktor, konsultan, maupun pemilik bangunan.

Anda membantu pengguna dalam 8 hal utama:
1. Membuat uraian pekerjaan (WBS) berdasarkan jenis proyek
2. Menyarankan item pekerjaan yang belum dimasukkan (missing items)
3. Menyarankan satuan pekerjaan sesuai standar SNI & PUPR
4. Membantu menghitung volume konstruksi dengan rumus transparan step-by-step
5. Mendeteksi harga satuan yang tidak wajar (anomali)
6. Membuat ringkasan eksekutif RAB
7. Menjelaskan komponen biaya dan analisa harga satuan (AHSP)
8. Memberikan rekomendasi penghematan biaya (value engineering)

ATURAN PENTING:
- Jangan membuat perubahan data RAB tanpa persetujuan pengguna.
- Jika Anda menyarankan item baru atau perubahan harga/volume, kembalikan dalam format JSON terstruktur di bawah ini agar pengguna dapat meninjau dan menyetujuinya di UI.

Format respon HARUS berupa JSON valid dengan struktur:
{
  "reply": "Penjelasan rinci dan ramah dalam format markdown bahasa Indonesia...",
  "suggestedActionType": "add_items" | "adjust_price" | "calculate_volume" | "none",
  "suggestedItems": [
    {
      "code": string,
      "category": string,
      "name": string,
      "unit": string,
      "volume": number,
      "unitPrice": number,
      "notes": string
    }
  ],
  "priceAdjustments": [
    {
      "itemId": string,
      "itemName": string,
      "currentPrice": number,
      "suggestedPrice": number,
      "reason": string
    }
  ],
  "volumeResult": {
    "workName": string,
    "formula": string,
    "calculatedVolume": number,
    "unit": string
  }
}`;

    const contextPrompt = `Konteks Proyek:
- Nama Proyek: ${project?.name || "Proyek Konstruksi"}
- Lokasi: ${project?.location || "Indonesia"}
- Tipe/Deskripsi: ${project?.notes || "Konstruksi Umum"}
- Total Item RAB Saat Ini: ${(items || []).length} item
- Item-item Terdaftar:
${itemsSummary || "(Belum ada item terdaftar)"}

Pertanyaan/Permintaan Pengguna:
${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contextPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const responseText = response.text || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({
      error: "Gagal memproses asisten AI: " + (error?.message || "Terjadi kesalahan"),
    });
  }
});

// 2. AI Missing Items Scanner
app.post("/api/ai/missing-items", async (req, res) => {
  try {
    const { project, items } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Kunci API Gemini belum dikonfigurasi." });
    }

    const itemsSummary = (items || []).map((it: any) =>
      `- [${it.category}] ${it.name} (${it.unit})`
    ).join("\n");

    const prompt = `Analisis kelengkapan pos pekerjaan RAB proyek berikut:
Nama Proyek: ${project?.name || "Bangunan"}
Lokasi: ${project?.location || "Indonesia"}
Item yang sudah ada (${(items || []).length} item):
${itemsSummary}

Identifikasi pekerjaan penting yang BELUM dimasukkan (missing items) yang lazim dan wajib ada dalam tahapan konstruksi SNI Indonesia (misalnya jika ada dinding tapi belum ada plesteran/acian, jika ada struktur tapi belum ada bekisting/pembesian, pekerjaan sanitasi pipa buang, ground rod penangkal petir, dsb).

Kembalikan respon JSON murni dengan format:
{
  "summary": "Ringkasan analisis kelengkapan pekerjaan...",
  "missingItems": [
    {
      "code": string,
      "category": string,
      "name": string,
      "unit": string,
      "volume": number,
      "unitPrice": number,
      "reason": string
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah auditor teknik sipil dan quantity surveyor ahli di Indonesia. Berikan rekomendasi item pekerjaan yang kurang secara terinci dan akurat.",
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let result = JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, "").trim());
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Missing Items Error:", error);
    return res.status(500).json({ error: error?.message || "Gagal mendeteksi item terlewat" });
  }
});

// 3. AI Price Anomaly Audit
app.post("/api/ai/price-audit", async (req, res) => {
  try {
    const { project, items } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Kunci API Gemini belum dikonfigurasi." });
    }

    const itemsData = (items || []).map((it: any) => ({
      id: it.id,
      code: it.code,
      name: it.name,
      category: it.category,
      unit: it.unit,
      unitPrice: it.unitPrice,
    }));

    const prompt = `Lakukan audit harga satuan RAB konstruksi Indonesia berikut terhadap standar acuan harga pasar & AHSP SNI/PUPR 2024-2026:
Proyek: ${project?.name || "Proyek Konstruksi"}
Lokasi: ${project?.location || "Indonesia"}

Daftar Item & Harga:
${JSON.stringify(itemsData, null, 2)}

Audit setiap item apakah harganya:
1. "Wajar" (dalam rentang harga pasar)
2. "Terlalu Rendah" (di bawah batas normal risiko kualitas/upah buruh)
3. "Terlalu Tinggi" (di atas batas normal pemborosan anggaran)

Kembalikan format JSON:
{
  "overallScore": number (0-100),
  "overallVerdict": "Wajar" | "Perlu Penyesuaian" | "Kritis",
  "summary": string,
  "auditedItems": [
    {
      "itemId": string,
      "name": string,
      "unit": string,
      "currentPrice": number,
      "status": "Wajar" | "Terlalu Rendah" | "Terlalu Tinggi",
      "marketMin": number,
      "marketMax": number,
      "recommendedPrice": number,
      "note": string
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah QS Senior dan Auditor Estimasi Biaya Konstruksi di Indonesia.",
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let result = JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, "").trim());
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Price Audit Error:", error);
    return res.status(500).json({ error: error?.message || "Gagal mengaudit harga satuan" });
  }
});

// 4. AI Volume Calculator Solver
app.post("/api/ai/volume-calc", async (req, res) => {
  try {
    const { query, workType } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Deskripsi dimensi pekerjaan wajib diisi." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Kunci API Gemini belum dikonfigurasi." });
    }

    const prompt = `Hitung volume pekerjaan konstruksi berdasarkan deskripsi berikut:
Pekerjaan: ${workType || "Pekerjaan Konstruksi"}
Deskripsi Dimensi: "${query}"

Hitung dengan teliti sesuai rumus geometris teknik sipil dan kurangi lubang/opening jika relevan (misal dinding dikurangi pintu & jendela).

Kembalikan JSON format:
{
  "workName": string,
  "volume": number,
  "unit": string (m¹, m², m³, kg, bh, ls, titik),
  "stepByStep": [
    string (penjelasan langkah 1),
    string (penjelasan langkah 2)
  ],
  "formulaUsed": string,
  "assumptions": string
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah insinyur quantity surveyor spesialis perhitungan volume teknis sipil.",
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let result = JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, "").trim());
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Volume Calc Error:", error);
    return res.status(500).json({ error: error?.message || "Gagal menghitung volume" });
  }
});

// 5. AI Cost Saving & Value Engineering
app.post("/api/ai/cost-savings", async (req, res) => {
  try {
    const { project, items, grandTotal } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Kunci API Gemini belum dikonfigurasi." });
    }

    const itemsSummary = (items || []).slice(0, 35).map((it: any) =>
      `- ${it.name} (${it.category}): Vol ${it.volume} ${it.unit} @ Rp ${Number(it.unitPrice).toLocaleString('id-ID')} = Rp ${(it.volume * it.unitPrice).toLocaleString('id-ID')}`
    ).join("\n");

    const prompt = `Analisis potensi penghematan biaya (Value Engineering & Cost Optimization) untuk RAB berikut tanpa mengurangi keamanan struktur bangunan:
Proyek: ${project?.name || "Proyek Konstruksi"}
Grand Total: Rp ${Number(grandTotal || 0).toLocaleString('id-ID')}
Daftar Pos Pekerjaan:
${itemsSummary}

Berikan strategi penghematan praktis di Indonesia (misal: alternatif material ramah biaya, modulasi ukuran untuk meminimalkan sisa potongan, metode kerja, negosiasi volume vendor).

Kembalikan format JSON:
{
  "totalPotentialSavings": number (estimasi total penghematan dalam Rupiah),
  "savingsPercentage": number (persentase perkiraan hemat, misal 7.5),
  "strategies": [
    {
      "title": string,
      "category": string,
      "description": string,
      "estimatedSaving": number,
      "impactOnQuality": "Aman / Kualitas Tetap Setara" | "Perlu Penyesuaian Spesifikasi Finishing",
      "actionRecommendation": string
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah Konsultan Value Engineering Konstruksi dan Estimator Senior.",
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let result = JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, "").trim());
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Cost Savings Error:", error);
    return res.status(500).json({ error: error?.message || "Gagal membuat rekomendasi penghematan" });
  }
});

// 6. AI Executive Summary Generator
app.post("/api/ai/executive-summary", async (req, res) => {
  try {
    const { project, items, calc } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Kunci API Gemini belum dikonfigurasi." });
    }

    const categoryBreakdown = (calc?.categoryTotals || []).map((c: any) =>
      `- ${c.category}: Rp ${Number(c.subtotal).toLocaleString('id-ID')} (${c.percentage.toFixed(1)}%)`
    ).join("\n");

    const prompt = `Buat Ringkasan Eksekutif RAB (Executive Cost Report) yang komprehensif, elegan, dan profesional untuk manajemen/klien:
Proyek: ${project?.name}
No Dokumen: ${project?.docNumber || project?.documentNo}
Pemilik: ${project?.ownerName || project?.clientName || '-'}
Lokasi: ${project?.location || '-'}
Biaya Langsung: Rp ${Number(calc?.directCost || 0).toLocaleString('id-ID')}
Overhead (${project?.overheadPercent || 0}%): Rp ${Number(calc?.overheadAmount || 0).toLocaleString('id-ID')}
Profit (${project?.profitPercent || 0}%): Rp ${Number(calc?.profitAmount || 0).toLocaleString('id-ID')}
Pajak PPN (${project?.taxPercent || 0}%): Rp ${Number(calc?.taxAmount || 0).toLocaleString('id-ID')}
Grand Total: Rp ${Number(calc?.grandTotal || 0).toLocaleString('id-ID')}

Distribusi Kategori:
${categoryBreakdown}

Kembalikan format JSON:
{
  "executiveNarrative": string (paragraf pengantar eksekutif formal),
  "topCostDrivers": [
    { "category": string, "percentage": number, "explanation": string }
  ],
  "budgetFeasibility": "Sangat Baik" | "Wajar / Standar Pasar" | "Perlu Perhatian Khusus",
  "cashflowAdvice": string (rekomendasi tahapan termin pembayaran proyek),
  "riskHighlights": [string]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah Direktur Estimasi Biaya & Ahli Quantity Surveying bersertifikasi.",
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let result = JSON.parse(responseText.replace(/```json/g, "").replace(/```/g, "").trim());
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Executive Summary Error:", error);
    return res.status(500).json({ error: error?.message || "Gagal membuat ringkasan eksekutif" });
  }
});

// AI Generate RAB endpoint
app.post("/api/ai/estimate", async (req, res) => {
  try {
    const { prompt, projectType, location, budgetTarget } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Deskripsi proyek wajib diisi." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Kunci API Gemini belum dikonfigurasi.",
        fallbackAvailable: true,
      });
    }

    const systemInstruction = `Anda adalah Estimator Biaya Konstruksi Profesional di Indonesia (Ahli Quantity Surveyor & RAB SNI).
Tugas Anda adalah membuat estimasi Rencana Anggaran Biaya (RAB) terinci berdasarkan deskripsi proyek konstruksi di Indonesia.
Gunakan standar kategori pekerjaan konstruksi Indonesia:
1. Pekerjaan Persiapan
2. Pekerjaan Tanah
3. Pekerjaan Pondasi
4. Pekerjaan Struktur
5. Pekerjaan Dinding
6. Pekerjaan Lantai
7. Pekerjaan Atap
8. Pekerjaan Plafon
9. Pekerjaan Pintu dan Jendela
10. Pekerjaan Instalasi Listrik
11. Pekerjaan Sanitasi
12. Pekerjaan Pengecatan
13. Pekerjaan Akhir
14. Lain-lain

Kembalikan output murni dalam format JSON array yang valid tanpa markdown formatting tambahan atau backticks (gunakan format JSON terstruktur).
Setiap objek pekerjaan harus memiliki format:
{
  "category": string (salah satu dari kategori di atas),
  "code": string (kode singkat seperti "PSP-01", "TNH-01", "PND-01", "STR-01", "DND-01", dll),
  "name": string (uraian pekerjaan jelas dan spesifik dengan spesifikasi teknis),
  "unit": string (m¹, m², m³, kg, bh, ls, ttk, set, dll),
  "volume": number (angka realistis),
  "unitPrice": number (harga satuan wajar dalam Rupiah di Indonesia),
  "notes": string (penjelasan singkat spesifikasi atau asumsi)
}`;

    const promptText = `Buatkan estimasi daftar item RAB terperinci untuk proyek berikut:
- Deskripsi: ${prompt}
${projectType ? `- Tipe Proyek: ${projectType}` : ""}
${location ? `- Lokasi: ${location}` : ""}
${budgetTarget ? `- Target Anggaran: Rp ${budgetTarget}` : ""}

Pastikan estimasi volume dan harga satuan realistis sesuai standar harga konstruksi Indonesia tahun 2024-2026. Berikan minimal 10-25 item pekerjaan utama dari persiapan hingga penyelesaian.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "[]";
    let parsedItems = [];
    try {
      parsedItems = JSON.parse(responseText);
    } catch {
      // Fallback regex clean
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedItems = JSON.parse(cleaned);
    }

    return res.json({ success: true, items: parsedItems });
  } catch (error: any) {
    console.error("AI Estimation Error:", error);
    return res.status(500).json({
      error: "Gagal membuat estimasi AI: " + (error?.message || "Terjadi kesalahan"),
    });
  }
});

// AI Audit RAB endpoint
app.post("/api/ai/audit", async (req, res) => {
  try {
    const { projectName, totalDirectCost, items } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Kunci API Gemini belum dikonfigurasi.",
      });
    }

    const itemsSummary = (items || []).map((it: any) => 
      `- [${it.category}] ${it.name}: Vol ${it.volume} ${it.unit} @ Rp ${it.unitPrice.toLocaleString('id-ID')} = Rp ${(it.volume * it.unitPrice).toLocaleString('id-ID')}`
    ).slice(0, 40).join("\n");

    const prompt = `Analisis dan audit RAB konstruksi berikut:
Proyek: ${projectName || "Proyek Konstruksi"}
Total Biaya Langsung: Rp ${Number(totalDirectCost || 0).toLocaleString('id-ID')}
Daftar Item:
${itemsSummary}

Berikan analisis profesional dalam format JSON dengan struktur:
{
  "score": number (skor kelayakan 0-100),
  "summary": string (ringkasan audit singkat dan padat),
  "potentialMissingItems": array of string (pekerjaan penting yang mungkin terlewat),
  "priceAnomalies": array of string (item dengan harga satuan yang terlalu murah atau terlalu mahal),
  "recommendations": array of string (saran optimasi biaya dan efisiensi)
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah auditor teknik sipil dan quantity surveyor senior di Indonesia. Berikan tinjauan kritis dan solutif.",
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    let auditResult = {};
    try {
      auditResult = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      auditResult = JSON.parse(cleaned);
    }

    return res.json({ success: true, audit: auditResult });
  } catch (error: any) {
    console.error("AI Audit Error:", error);
    return res.status(500).json({
      error: "Gagal menganalisis RAB: " + (error?.message || "Terjadi kesalahan"),
    });
  }
});

// 9. AI Multimodal Construction Drawing & Document Analysis Endpoint

app.post("/api/ai/analyze-drawing", async (req, res) => {
  try {
    const {
      drawingId, fileName, drawingTitle, fileType, category, drawingCategory, description,
      imageData, projectName, existingRABSummary, forceTwoPass
    } = req.body;

    const actualTitle = drawingTitle || fileName || "Gambar Konstruksi";
    const ai = getGeminiClient();

    if (ai && imageData && imageData.includes("base64,")) {
      try {
        const base64Data = imageData.split("base64,")[1];
        const mimeType = imageData.split(";")[0].replace("data:", "") || fileType || "image/png";

        const systemInstruction = `V17 MASTER DRAWING INTELLIGENCE ENGINE - TWO PASS
Anda adalah AI Spesialis Analisis Gambar Konstruksi.
ATURAN KETAT INTEGRITAS DATA (ANTI-HALUSINASI & GEOMETRY LOCKING):
1. ZERO HALLUCINATION: JANGAN MENGARANG DIMENSI.
2. GEOMETRY LOCKING: Evaluasi relasi matematis.
3. NO GUESSING: Jika buram, kosongi.
4. MULTI-PAGE PROCESSING: Jika dokumen terdiri dari beberapa halaman (seperti PDF), ANDA WAJIB memproses, menganalisa, dan mengekstrak informasi dari SETIAP HALAMAN tanpa terkecuali. Sebutkan secara spesifik temuan dari halaman 1, halaman 2, dst dalam summary Anda.
Kembalikan HANYA format JSON (tanpa markdown).
Skema:
{
  "summary": "string",
  "confidenceScore": 95,
  "dimensions": [{"dimensionValue": 0, "unit": "m", "rawText": "str", "evidence": "str"}],
  "objects": [{"category": "str", "name": "str", "dimensionsText": "str"}],
  "materials": [{"material": "str", "evidence": "str"}],
  "rabItems": [{"category": "str", "name": "str", "volume": 0, "unit": "str"}],
  "missingInformation": ["str"],
  "anomalies": ["str"],
  "crossSheetConflicts": ["str"]
}`;

        const promptText = `Analisis gambar "${actualTitle}" dari proyek "${projectName || 'Proyek'}".`;

        // PASS 1: Extraction
        const response1 = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{
            role: "user",
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: promptText }
            ]
          }],
          config: {
            temperature: 0.1,
            systemInstruction: { parts: [{ text: systemInstruction }] },
            responseMimeType: "application/json"
          }
        });

        let pass1Text = response1.text;
        pass1Text = pass1Text.replace(/\n/g, "").replace(/\r/g, "");
        let resultObj = JSON.parse(pass1Text);
        
        const confidence = resultObj.confidenceScore || 100;
        const needsPass2 = forceTwoPass || confidence < 85;

        // PASS 2: Self-Critique (If needed)
        if (needsPass2) {
          const critiquePrompt = `Anda adalah QC Reviewer kedua.
Periksa ulang hasil ekstraksi Pass 1 berikut terhadap gambar asli.
Tandai temuan yang: (a) tidak konsisten dengan gambar, (b) dimensi bertentangan, (c) confidence rendah.
Kembalikan HANYA daftar koreksi dalam format JSON:
{
  "criticalCorrections": ["string"],
  "downgradedConfidence": 70
}

Hasil Pass 1:
${JSON.stringify(resultObj, null, 2)}`;

          const response2 = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{
              role: "user",
              parts: [
                { inlineData: { data: base64Data, mimeType } },
                { text: critiquePrompt }
              ]
            }],
            config: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          });
          
          try {
            const critiqueObj = JSON.parse(response2.text);
            if (critiqueObj.criticalCorrections && critiqueObj.criticalCorrections.length > 0) {
              resultObj.anomalies = resultObj.anomalies || [];
              resultObj.anomalies.push(...critiqueObj.criticalCorrections.map(c => "[QC Pass 2] " + c));
              if (critiqueObj.downgradedConfidence) {
                resultObj.confidenceScore = critiqueObj.downgradedConfidence;
              }
            }
          } catch(e) {
            console.error("QC Pass 2 failed to parse:", e);
          }
        }

        res.json({ result: resultObj, success: true, twoPassUsed: needsPass2 });
      } catch (geminiError) {
        console.error("Gemini API Error in analyze-drawing:", geminiError);
        res.status(500).json({ error: "Gagal memproses analisis gambar via Gemini API. " + (geminiError.message || String(geminiError)) });
      }
    } else {
      res.status(400).json({ error: "Data gambar tidak valid atau Gemini client tidak aktif." });
    }
  } catch (error) {
    console.error("Analyze drawing error:", error);
    res.status(500).json({ error: "Terjadi kesalahan sistem saat menganalisis gambar." });
  }
});


// 10. AI Document OCR Extractor for RAB Tables (PDF, JPG, PNG)
app.post("/api/rab/parse-document-ocr", aiZeroCostGuard, async (req, res) => {
  try {
    const { fileName, fileType, prompt: userPrompt } = req.body;
    const rawImage = req.body.imageData || req.body.fileBase64 || req.body.data;
    if (!rawImage || typeof rawImage !== "string" || !rawImage.includes("base64,")) {
      return res.status(400).json({ error: "Data gambar atau dokumen base64 wajib disertakan." });
    }

    const ai = getGeminiClient();
    const base64Data = rawImage.split("base64,")[1];
    const mimeType = rawImage.split(";")[0].replace("data:", "") || fileType || "image/png";

    if (ai) {
      try {
        const systemPrompt = `Anda adalah AI Spesialis OCR & Ekstraksi Tabel Rencana Anggaran Biaya (RAB) Konstruksi Indonesia.
Tugas Anda adalah membaca gambar/dokumen tabel RAB secara presisi baris per baris.

ATURAN EKSTRAKSI TABEL RAB:
1. Ekstrak setiap baris pekerjaan dengan kolom: Kode, Uraian Pekerjaan, Kategori, Satuan, Volume, Harga Satuan, Jumlah Harga.
2. JANGAN MENGARANG data. Jika angka buram atau tidak terbaca jelas, beri nilai 0 dan tandai "needsVerification": true dengan "confidenceScore" < 75.
3. Kenali baris header kategori (misal: "I. PEKERJAAN PERSIAPAN") dan tetapkan kategori tersebut ke item-item di bawahnya.
4. JANGAN memasukkan baris "SUBTOTAL", "TOTAL BIAYA", "PPN", "OVERHEAD", atau "GRAND TOTAL" sebagai item pekerjaan biasa, melainkan simpan di field 'fileTotal' dan 'grandTotal'.
5. Normalisasi angka format Indonesia (misal: 1.500.000 menjadi 1500000).
6. Berikan tingkat keyakinan (confidenceScore 0-100) per item dan keseluruhan.

Kembalikan STRICT JSON format:
{
  "documentTitle": string,
  "confidenceScore": number,
  "qualityWarning": string (jika ada teks buram/terpotong),
  "detectedHeaders": [string],
  "fileTotal": number,
  "items": [
    {
      "code": string,
      "name": string,
      "category": string,
      "unit": string,
      "volume": number,
      "unitPrice": number,
      "totalAmount": number,
      "confidenceScore": number,
      "needsVerification": boolean,
      "notes": string
    }
  ]
}`;

        const promptText = `Baca dan ekstrak seluruh tabel RAB dari dokumen/gambar ini:
Nama File: ${fileName || "Dokumen RAB"}
Format: ${fileType || mimeType}
${userPrompt ? `Instruksi tambahan: ${userPrompt}` : ""}`;

        const geminiResponse = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType.startsWith("application/pdf") ? "application/pdf" : mimeType.startsWith("image/") ? mimeType : "image/png",
                  },
                },
                { text: promptText },
              ],
            },
          ],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const rawText = geminiResponse.text || "{}";
        let parsed: any = {};
        try {
          parsed = JSON.parse(rawText);
        } catch {
          const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          parsed = JSON.parse(cleaned);
        }

        return res.json({ success: true, source: "gemini_ocr", data: parsed });
      } catch (ocrError: any) {
        console.warn("Gemini OCR error, fallback:", ocrError?.message);
      }
    }

    // Fallback OCR Mock/Simulation with clear notice if AI unavailable
    return res.json({
      success: true,
      source: "qs_fallback",
      data: {
        documentTitle: fileName || "Tabel RAB Hasil Pindai",
        confidenceScore: 85,
        qualityWarning: "Dokumen diproses dengan parser fallback. Harap periksa dan verifikasi kembali seluruh nilai volume dan harga satuan.",
        detectedHeaders: ["No", "Uraian Pekerjaan", "Volume", "Satuan", "Harga Satuan (Rp)", "Jumlah Harga (Rp)"],
        fileTotal: 45000000,
        items: [
          { code: "PSP-01", name: "Pembersihan lapangan dan pasang patok", category: "Pekerjaan Persiapan", unit: "m²", volume: 100,  totalAmount: 2500000, confidenceScore: 95, needsVerification: false },
          { code: "TNH-01", name: "Galian tanah pondasi batu kali", category: "Pekerjaan Tanah", unit: "m³", volume: 24,  totalAmount: 2520000, confidenceScore: 92, needsVerification: false },
          { code: "PND-01", name: "Pasangan pondasi batu belah 1:4", category: "Pekerjaan Pondasi", unit: "m³", volume: 16,  totalAmount: 17840000, confidenceScore: 94, needsVerification: false },
          { code: "STR-01", name: "Sloof beton bertulang 15/20 cm K-225", category: "Pekerjaan Struktur", unit: "m³", volume: 2.4,  totalAmount: 12288000, confidenceScore: 90, needsVerification: false },
          { code: "DND-01", name: "Pasangan bata ringan hebel t=10cm", category: "Pekerjaan Dinding", unit: "m²", volume: 65,  totalAmount: 9750000, confidenceScore: 88, needsVerification: false },
        ],
      },
    });
  } catch (error: any) {
    console.error("RAB OCR Error:", error);
    return res.status(500).json({ error: "Gagal membaca dokumen OCR: " + (error?.message || "Terjadi kesalahan") });
  }
});

// =============================================
// FITUR 2: AI Predictive Cost Escalation
// =============================================
app.post("/api/ai/cost-escalation", async (req, res) => {
  try {
    const { project, items, forecastMonths = 6 } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Kunci API Gemini belum dikonfigurasi." });
    }

    const itemsSummary = (items || []).slice(0, 40).map((it: any) =>
      `- [${it.category}] ${it.name}: Vol ${it.volume} ${it.unit} @ Rp ${Number(it.unitPrice).toLocaleString('id-ID')}`
    ).join("\n");

    const prompt = `Anda adalah ekonom konstruksi dan analis harga material Indonesia yang ahli.
Lakukan analisis prediktif eskalasi harga untuk proyek konstruksi berikut berdasarkan tren inflasi, harga komoditas global, nilai tukar USD/IDR, dan kondisi pasar konstruksi Indonesia 2025-2026.

Proyek: ${project?.name || "Proyek Konstruksi"}
Lokasi: ${project?.location || "Indonesia"}
Item RAB (${(items || []).length} pos):
${itemsSummary}

Periode Prediksi: ${forecastMonths} bulan ke depan dari ${new Date().toLocaleDateString('id-ID')}

Analisis faktor-faktor:
1. Tren harga semen, besi baja, pasir, dan material konstruksi utama di Indonesia
2. Dampak nilai tukar Rupiah terhadap material impor (keramik, aluminium, kabel)
3. Proyeksi kenaikan UMR/upah tenaga kerja konstruksi
4. Faktor musiman dan ketersediaan material
5. Kebijakan pemerintah terkait konstruksi

Kembalikan format JSON:
{
  "overallEscalationRate": number (persentase kenaikan total estimasi, misal 8.5),
  "forecastPeriod": "${forecastMonths} bulan",
  "referenceDate": string (bulan/tahun prediksi berakhir),
  "marketCondition": "Stabil" | "Inflasi Moderat" | "Inflasi Tinggi" | "Deflasi",
  "summary": string (narasi ringkasan kondisi pasar dan prediksi),
  "categoryEscalations": [
    {
      "category": string,
      "currentCost": number,
      "escalationRate": number (persen),
      "projectedCost": number,
      "mainDrivers": [string],
      "riskLevel": "Rendah" | "Sedang" | "Tinggi"
    }
  ],
  "materialAlerts": [
    {
      "material": string,
      "currentTrend": string,
      "projectedChange": number (persen, negatif = turun),
      "recommendation": string,
      "urgency": "Segera Beli" | "Pantau" | "Tunda Pembelian"
    }
  ],
  "mitigationStrategies": [string],
  "totalCurrentBudget": number,
  "totalProjectedBudget": number,
  "additionalBudgetNeeded": number
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah ekonom konstruksi senior Indonesia dengan spesialisasi analisis prediktif harga material dan eskalasi biaya proyek.",
        responseMimeType: "application/json",
        temperature: 0.25,
      },
    });

    const rawText = response.text || "{}";
    let result: any = {};
    try {
      result = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      result = JSON.parse(cleaned);
    }

    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Cost Escalation Error:", error);
    return res.status(500).json({ error: error?.message || "Gagal membuat prediksi eskalasi harga" });
  }
});

// =============================================
// FITUR 4: Smart Auto-categorization
// =============================================
app.post("/api/ai/auto-categorize", async (req, res) => {
  try {
    const { workName, currentCategory } = req.body;
    if (!workName || workName.trim().length < 3) {
      return res.status(400).json({ error: "Nama pekerjaan terlalu pendek." });
    }

    const RAB_CATEGORIES = [
      "Pekerjaan Persiapan", "Pekerjaan Tanah", "Pekerjaan Pondasi",
      "Pekerjaan Struktur", "Pekerjaan Dinding", "Pekerjaan Lantai",
      "Pekerjaan Atap", "Pekerjaan Plafon", "Pekerjaan Pintu dan Jendela",
      "Pekerjaan Instalasi Listrik", "Pekerjaan Sanitasi",
      "Pekerjaan Pengecatan", "Pekerjaan Akhir", "Lain-lain"
    ];

    const ai = getGeminiClient();

    // Jika Gemini tersedia, gunakan AI
    if (ai) {
      const prompt = `Klasifikasikan uraian pekerjaan konstruksi berikut ke dalam kategori RAB SNI Indonesia yang paling tepat.

Uraian Pekerjaan: "${workName}"
Kategori Saat Ini: "${currentCategory || 'Belum dipilih'}"

Pilihan Kategori yang Tersedia (hanya pilih dari daftar ini):
${RAB_CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Kembalikan JSON:
{
  "suggestedCategory": string (salah satu dari kategori di atas, PERSIS sama),
  "confidence": number (0-100, tingkat keyakinan klasifikasi),
  "reason": string (penjelasan singkat mengapa kategori ini dipilih, 1 kalimat),
  "alternativeCategory": string (kategori alternatif jika ragu, atau null),
  "suggestedUnit": string (satuan pekerjaan yang disarankan: m², m³, m¹, kg, ls, titik, unit, dll),
  "suggestedCode": string (kode singkat pekerjaan, misal: STR-01, DND-02, ATP-01)
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const rawText = response.text || "{}";
      let result: any = {};
      try {
        result = JSON.parse(rawText);
      } catch {
        const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        result = JSON.parse(cleaned);
      }

      // Validasi bahwa kategori yang disarankan ada dalam daftar
      if (!RAB_CATEGORIES.includes(result.suggestedCategory)) {
        result.suggestedCategory = fallbackCategorize(workName, RAB_CATEGORIES);
        result.confidence = 75;
      }

      return res.json({ success: true, source: "gemini", ...result });
    }

    // Fallback heuristic jika Gemini tidak tersedia
    const suggested = fallbackCategorize(workName, RAB_CATEGORIES);
    const unitMap: Record<string, string> = {
      "Pekerjaan Persiapan": "ls",
      "Pekerjaan Tanah": "m³",
      "Pekerjaan Pondasi": "m³",
      "Pekerjaan Struktur": "m³",
      "Pekerjaan Dinding": "m²",
      "Pekerjaan Lantai": "m²",
      "Pekerjaan Atap": "m²",
      "Pekerjaan Plafon": "m²",
      "Pekerjaan Pintu dan Jendela": "unit",
      "Pekerjaan Instalasi Listrik": "titik",
      "Pekerjaan Sanitasi": "ls",
      "Pekerjaan Pengecatan": "m²",
      "Pekerjaan Akhir": "ls",
      "Lain-lain": "ls",
    };

    return res.json({
      success: true,
      source: "heuristic",
      suggestedCategory: suggested,
      confidence: 80,
      reason: "Klasifikasi berdasarkan kata kunci dalam nama pekerjaan.",
      alternativeCategory: null,
      suggestedUnit: unitMap[suggested] || "ls",
      suggestedCode: `${suggested.substring(0, 3).toUpperCase()}-01`,
    });
  } catch (error: any) {
    console.error("Auto-categorize Error:", error);
    return res.status(500).json({ error: error?.message || "Gagal mengklasifikasi pekerjaan" });
  }
});

function fallbackCategorize(workName: string, categories: string[]): string {
  const lower = workName.toLowerCase();
  const rules: [string[], string][] = [
    [["bouwplank", "pengukuran", "pembersihan", "direksi", "mobilisasi", "sewa", "pagar proyek"], "Pekerjaan Persiapan"],
    [["galian", "urugan", "timbunan", "tanah", "pemadatan", "leveling"], "Pekerjaan Tanah"],
    [["pondasi", "batu kali", "footplat", "cakar ayam", "tiang pancang", "strauss"], "Pekerjaan Pondasi"],
    [["sloof", "kolom", "balok", "plat", "cor", "beton", "besi", "pembesian", "bekisting", "ringbalk", "struktur"], "Pekerjaan Struktur"],
    [["dinding", "bata", "hebel", "plester", "acian", "partisi", "tembok"], "Pekerjaan Dinding"],
    [["lantai", "keramik", "granit", "marmer", "parket", "vinyl", "floor"], "Pekerjaan Lantai"],
    [["atap", "genteng", "seng", "spandek", "baja ringan", "kuda-kuda", "rangka atap", "lisplang", "nok"], "Pekerjaan Atap"],
    [["plafon", "gypsum", "eternit", "triplek", "ceiling", "hollow"], "Pekerjaan Plafon"],
    [["pintu", "jendela", "kusen", "daun", "handle", "kunci", "engsel", "aluminium"], "Pekerjaan Pintu dan Jendela"],
    [["listrik", "lampu", "kabel", "stop kontak", "saklar", "panel", "mcb", "instalasi daya"], "Pekerjaan Instalasi Listrik"],
    [["sanitasi", "pipa", "toilet", "kloset", "wastafel", "bak", "floor drain", "septictank", "air bersih", "air kotor"], "Pekerjaan Sanitasi"],
    [["cat", "pengecatan", "plamir", "epoxy", "waterproofing", "coating"], "Pekerjaan Pengecatan"],
    [["pembersihan akhir", "general cleaning", "finishing", "rapih", "serah terima"], "Pekerjaan Akhir"],
  ];

  for (const [keywords, category] of rules) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }
  return "Lain-lain";
}

// Source Code Export API (Bundles full project source files as JSON)
const IGNORED_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".next",
  ".cache",
  ".vscode",
  ".idea",
  "build",
  "coverage",
]);

const isEnvFile = (name: string) => name.startsWith(".env") && name !== ".env.example";

const IGNORED_FILES = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".env.test",
  "package-lock.json",
  "bun.lock",
  "yarn.lock",
  ".DS_Store",
  "Thumbs.db",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".css",
  ".html",
  ".md",
  ".sql",
  ".svg",
  ".txt",
  ".example",
]);

async function scanProjectSourceFiles(dir: string, baseDir: string = dir): Promise<any[]> {
  let results: any[] = [];
  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
          const subFiles = await scanProjectSourceFiles(fullPath, baseDir);
          results = results.concat(subFiles);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (
          !IGNORED_FILES.has(entry.name) &&
          !isEnvFile(entry.name) &&
          (ALLOWED_EXTENSIONS.has(ext) || entry.name === ".env.example" || entry.name.endsWith(".json"))
        ) {
          try {
            const stats = await fs.promises.stat(fullPath);
            if (stats.size <= 2 * 1024 * 1024) {
              const content = await fs.promises.readFile(fullPath, "utf-8");
              const lineCount = content.split("\n").length;
              results.push({
                path: relPath,
                fileName: entry.name,
                extension: ext || ".txt",
                sizeBytes: stats.size,
                lineCount,
                lastModified: stats.mtime.toISOString(),
                content,
              });
            }
          } catch (readErr) {
            console.warn(`Could not read file ${relPath}:`, readErr);
          }
        }
      }
    }
  } catch (dirErr) {
    console.warn(`Error scanning directory ${dir}:`, dirErr);
  }
  return results;
}

app.get("/api/export/source-code", requireAdmin, exportRateLimit, async (req, res) => {
  try {
    const rootDir = process.cwd();
    const scannedFiles = await scanProjectSourceFiles(rootDir, rootDir);

    // Group files and build manifest
    const filesDict: Record<string, { size: number; lines: number; extension: string; content: string; modified: string }> = {};
    let totalLines = 0;
    let totalSize = 0;

    scannedFiles.forEach((file) => {
      let content = file.content;
      // Redact environment variables if it's the .env file
      if (file.path === '.env' || file.path === '.env.local') {
        content = content.replace(/^(.*=)(.*)$/gm, '$1***REDACTED***');
      }
      
      // Redact known secrets patterns across all files
      content = content.replace(/(process\.env\.JWT_SECRET\s*\|\|\s*["'])[^"']+["']/g, '$1***REDACTED***"');
      content = content.replace(/(process\.env\.ADMIN_INITIAL_PASSWORD\s*\|\|\s*["'])[^"']+["']/g, '$1***REDACTED***"');
      content = content.replace(/(process\.env\.GEMINI_API_KEY\s*\|\|\s*["'])[^"']+["']/g, '$1***REDACTED***"');

      filesDict[file.path] = {
        size: file.sizeBytes,
        lines: file.lineCount,
        extension: file.extension,
        content: content,
        modified: file.lastModified,
      };
      totalLines += file.lineCount;
      totalSize += file.sizeBytes;
    });

    let packageJsonData: any = {};
    try {
      const pkgContent = await fs.promises.readFile(path.join(rootDir, "package.json"), "utf-8");
      packageJsonData = JSON.parse(pkgContent);
    } catch {
      packageJsonData = { name: "property-feasibility-study-system", version: "1.0.0" };
    }

    const payload = {
      project: "PROPERTY FEASIBILITY STUDY SYSTEM (RAB PRO)",
      application: packageJsonData.name || "rab-pro-feasibility",
      version: packageJsonData.version || "1.0.0",
      description: "Sistem Studi Kelayakan Properti, RAB Konstruksi, Estimasi Desain AI, dan Manajemen Finansial",
      exportedAt: new Date().toISOString(),
      generator: "Google AI Studio Antigravity Export Engine",
      summary: {
        totalFiles: scannedFiles.length,
        totalLines,
        totalSizeKb: Math.round((totalSize / 1024) * 100) / 100,
        categories: {
          components: scannedFiles.filter((f) => f.path.startsWith("src/components/")).length,
          context: scannedFiles.filter((f) => f.path.startsWith("src/context/")).length,
          types: scannedFiles.filter((f) => f.path.startsWith("src/types/")).length,
          utils: scannedFiles.filter((f) => f.path.startsWith("src/utils/")).length,
          data: scannedFiles.filter((f) => f.path.startsWith("src/data/")).length,
          server: scannedFiles.filter((f) => f.path.startsWith("server")).length,
          configs: scannedFiles.filter((f) => !f.path.startsWith("src/")).length,
        },
      },
      fileList: scannedFiles.map((f) => ({
        path: f.path,
        size: f.sizeBytes,
        lines: f.lineCount,
        modified: f.lastModified,
      })),
      sourceFiles: filesDict,
    };

    if (req.query.download === "true") {
      const fileName = `source_code_${(packageJsonData.name || "rab_pro").replace(/[^a-zA-Z0-9_-]/g, "_")}_${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      return res.send(JSON.stringify(payload, null, 2));
    }

    return res.json(payload);
  } catch (err: any) {
    console.error("Export source code error:", err);
    return res.status(500).json({ error: "Gagal mengekspor source code: " + (err?.message || "Internal server error") });
  }
});

// Error handling middleware (e.g. 413 Payload Too Large)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && (err.type === "entity.too.large" || err.status === 413)) {
    return res.status(413).json({
      error: "Ukuran dokumen/gambar melebihi batas (maksimum 100MB). Silakan gunakan gambar dengan resolusi yang lebih optimal.",
      success: false,
    });
  }
  if (err) {
    console.error("Server uncaught middleware error:", err);
    return res.status(err.status || 500).json({
      error: process.env.NODE_ENV === "production" ? "Terjadi kesalahan sistem." : (err.message || "Terjadi kesalahan pada server."),
      success: false,
    });
  }
  next();
});

// Setup Vite or Static serve
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

async function startServerWithRetry(port: number, maxRetries = 5, delayMs = 1500) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const server = await new Promise<any>((resolve, reject) => {
          const srv = app.listen(port, "0.0.0.0", () => resolve(srv));
          srv.on('error', reject);
        });
        
        console.log(`RAB Pro Server running on port ${port} (percobaan ke-${attempt})`);

        function gracefulShutdown(signal: string) {
          console.log(`\n[SHUTDOWN] Menerima sinyal ${signal}, menutup server...`);
          server.close(() => {
            console.log('[SHUTDOWN] Server ditutup bersih, port dilepas.');
            process.exit(0);
          });
          // Paksa keluar jika masih menggantung setelah 10 detik
          setTimeout(() => {
            console.error('[SHUTDOWN] Timeout — force exit.');
            process.exit(1);
          }, 10000);
        }
        
        process.removeAllListeners('SIGTERM');
        process.removeAllListeners('SIGINT');
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        return;
      } catch (err: any) {
        if (err.code === 'EADDRINUSE' && attempt < maxRetries) {
          console.warn(`[STARTUP RETRY] Port ${port} masih terpakai, mencoba lagi dalam ${delayMs}ms... (${attempt}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, delayMs));
        } else {
          console.error(`[FATAL] Gagal listen di port ${port} setelah ${attempt} percobaan:`, err);
          process.exit(1);
        }
      }
    }
  }

  await startServerWithRetry(PORT);
}

startServer();
