const fs = require('fs');
let code = fs.readFileSync('src/components/drawings/DrawingUploadModal.tsx', 'utf8');

if (code.includes('type="file"')) {
  code = code.replace(
    /type="file"\s*accept="[^"]+"\s*className="hidden"\s*onChange=\{\(e\) => \{/g,
    'type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => {'
  );
  
  code = code.replace(
    /if \(e\.target\.files && e\.target\.files\.length > 0\) \{[\s\S]*?handleFile\(e\.target\.files\[0\]\);[\s\S]*?\}/,
    'if (e.target.files && e.target.files.length > 0) { Array.from(e.target.files).forEach(f => handleFile(f)); }'
  );
  
  code = code.replace(
    "const handleFile = (file: File) => {",
    "const handleFile = async (file: File) => {"
  );
  
  fs.writeFileSync('src/components/drawings/DrawingUploadModal.tsx', code);
  console.log("Patched multiple upload");
}
