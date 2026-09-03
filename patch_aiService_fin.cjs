const fs = require('fs');
let content = fs.readFileSync('src/services/aiService.ts', 'utf8');

const newMethod = `
  async financialReview(project: any, items: any[], calc: any, anomalies: any[]): Promise<string> {
    const response = await fetch('/api/ai/financial-review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ project, items, calc, anomalies }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Batas pemakaian AI gratis harian (Zero-Cost Safeguard) telah tercapai.');
      }
      throw new Error('Gagal melakukan financial review via AI');
    }

    const data = await response.json();
    return data.result;
  }
`;

content = content.replace('export const aiService = {', 'export const aiService = {\n' + newMethod);
fs.writeFileSync('src/services/aiService.ts', content);
