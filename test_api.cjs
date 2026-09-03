const http = require('http');

const postData = JSON.stringify({
  drawingId: 'test-123',
  fileName: 'denah_rumah_minimalis.pdf',
  fileType: 'application/pdf',
  imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  category: 'Denah',
  forceTwoPass: true
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/ai/analyze-drawing',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("RESPONSE:", data);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
