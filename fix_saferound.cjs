const fs = require('fs');

let calcContent = fs.readFileSync('src/utils/calculations.ts', 'utf8');
if (!calcContent.includes('export function safeRound')) {
  calcContent = calcContent.replace(
    "export function roundHalfUp(value: number, decimals: number = 2): number {",
    "export function safeRound(value: number, decimals: number = 2): number {\n  if (isNaN(value)) return 0;\n  const factor = Math.pow(10, decimals);\n  return Math.round((value + Number.EPSILON) * factor) / factor;\n}\n\nexport function roundHalfUp(value: number, decimals: number = 2): number {"
  );
  fs.writeFileSync('src/utils/calculations.ts', calcContent);
}

let ahspContent = fs.readFileSync('src/components/ahsp/AHSPModal.tsx', 'utf8');

// Import safeRound
if (!ahspContent.includes('safeRound')) {
  ahspContent = ahspContent.replace(
    "import { X, Plus, Trash2, Save, FileText, ArrowLeft, Loader2, Info } from 'lucide-react';",
    "import { X, Plus, Trash2, Save, FileText, ArrowLeft, Loader2, Info } from 'lucide-react';\nimport { safeRound } from '../../utils/calculations';"
  );
  
  // Replace the calculation variables.
  // Currently they are probably something like:
  // const totalMaterial = ...
  // Let's find exactly how they are calculated.
}
fs.writeFileSync('src/components/ahsp/AHSPModal.tsx', ahspContent);
console.log("Injected safeRound definition and import");
