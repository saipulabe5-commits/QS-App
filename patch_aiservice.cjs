const fs = require('fs');
let code = fs.readFileSync('src/services/aiService.ts', 'utf8');

if (!code.includes("AILogger")) {
  code = code.replace(
    "import { geminiInteractionsService }", 
    "import { AILogger } from '../utils/AILogger';\nimport { geminiInteractionsService }"
  );
  
  // financialReview
  code = code.replace(
    "async financialReview(project: any, items: any[], calc: any, anomalies: any[]): Promise<string> {\n    try {\n      const prompt = `",
    `async financialReview(project: any, items: any[], calc: any, anomalies: any[]): Promise<string> {
    const startTime = Date.now();
    try {
      const prompt = \``
  );
  
  code = code.replace(
    "const result = await geminiInteractionsService.generateContent(prompt, true);",
    "const result = await geminiInteractionsService.generateContent(prompt, true);\n      AILogger.log({ agentName: 'FINANCIAL_REVIEW', targetId: project.id, status: 'success', durationMs: Date.now() - startTime, message: 'AI Financial Review completed', details: { itemsAnalyzed: items.length, resultPreview: result.substring(0, 150) + '...' } });"
  );
  
  code = code.replace(
    "throw new Error('Gagal mendapatkan hasil dari Gemini AI');\n    }\n  }",
    "throw new Error('Gagal mendapatkan hasil dari Gemini AI');\n    } catch (e) {\n      AILogger.log({ agentName: 'FINANCIAL_REVIEW', targetId: project?.id || 'unknown', status: 'error', durationMs: Date.now() - startTime, message: e.message || 'Error running AI', details: null });\n      throw e;\n    }\n  }"
  );

  // analyzeDrawing
  code = code.replace(
    "async analyzeDrawing(base64Image: string, mimeType: string, drawingType: string): Promise<any> {",
    "async analyzeDrawing(base64Image: string, mimeType: string, drawingType: string): Promise<any> {\n    const startTime = Date.now();"
  );
  code = code.replace(
    "return parsed;",
    "AILogger.log({ agentName: 'DRAWING_VERIFY_PASS2', targetId: drawingType, status: 'success', durationMs: Date.now() - startTime, message: 'Multi-modal analysis & Pass 2 Critique completed', details: { type: drawingType, elementsFound: parsed.elements?.length || 0 } });\n      return parsed;"
  );
  code = code.replace(
    "throw new Error('Gagal menganalisis gambar: ' + (error as Error).message);\n    }\n  }",
    "AILogger.log({ agentName: 'DRAWING_VERIFY_PASS2', targetId: drawingType, status: 'error', durationMs: Date.now() - startTime, message: (error as Error).message, details: null });\n      throw new Error('Gagal menganalisis gambar: ' + (error as Error).message);\n    }\n  }"
  );

  fs.writeFileSync('src/services/aiService.ts', code);
  console.log("Patched aiService.ts");
}
