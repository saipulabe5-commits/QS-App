const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "3. NO GUESSING: Jika buram, kosongi.",
  "3. NO GUESSING: Jika buram, kosongi.\n4. MULTI-PAGE PROCESSING: Jika dokumen terdiri dari beberapa halaman (seperti PDF), ANDA WAJIB memproses, menganalisa, dan mengekstrak informasi dari SETIAP HALAMAN tanpa terkecuali. Sebutkan secara spesifik temuan dari halaman 1, halaman 2, dst dalam summary Anda."
);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts");
