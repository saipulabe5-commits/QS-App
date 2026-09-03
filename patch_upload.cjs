const fs = require('fs');
let code = fs.readFileSync('src/components/drawings/DrawingUploadModal.tsx', 'utf8');

// Change single file state to array
code = code.replace(
  "const [fileData, setFileData] = useState",
  "const [filesData, setFilesData] = useState<{name: string, url: string, size: number, type: string}[]>([]);\n  const [fileData, setFileData] = useState"
);

// We will just create a "Bulk Analyze" modal/button in DrawingAnalysisView instead of doing it in upload modal, 
// because DrawingAnalysisView has a gallery of uploaded drawings.
