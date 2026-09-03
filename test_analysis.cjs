const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const http = require('http');

async function main() {
  const pdfDoc = await PDFDocument.create();
  for(let i=1; i<=5; i++) {
    const page = pdfDoc.addPage([200, 200]);
    page.drawText(`HALAMAN PDF ${i}`, { x: 10, y: 150, size: 20 });
    page.drawText(`Dimensi Pipa Beton: ${i}000 mm`, { x: 10, y: 100, size: 15 });
  }
  const pdfBytes = await pdfDoc.save();
  const pdfBase64 = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`;

  const loginBody = JSON.stringify({ email: "saipulabe@gmail.com", password: "RabPro#2026Secure!" });
  
  const loginReq = http.request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
  }, (loginRes) => {
    let loginData = '';
    loginRes.on('data', chunk => loginData += chunk);
    loginRes.on('end', () => {
      const token = JSON.parse(loginData).token;
      
      const body = JSON.stringify({
        drawingId: "pdf-test",
        fileName: "test-multipage.pdf",
        drawingTitle: "Test PDF 5 Halaman",
        fileType: "application/pdf",
        imageData: pdfBase64,
        projectName: "Test Project",
        forceTwoPass: false
      });

      const req = http.request('http://localhost:3000/api/ai/analyze-drawing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Authorization': `Bearer ${token}`
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log("\n--- HASIL ANALISA PDF 5 HALAMAN ---");
          console.log(data);
        });
      });
      req.write(body);
      req.end();
    });
  });
  loginReq.write(loginBody);
  loginReq.end();
}
main();
