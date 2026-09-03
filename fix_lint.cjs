const fs = require('fs');
let types = fs.readFileSync('src/types.ts', 'utf8');
if (!types.includes('ProjectCalculation')) {
  types += `\nexport interface ProjectCalculation {
  subtotal: number;
  overheadValue: number;
  profitValue: number;
  ppnValue: number;
  grandTotal: number;
  totalMaterial?: number;
  totalLabor?: number;
  totalEquipment?: number;
}\n`;
  fs.writeFileSync('src/types.ts', types);
}
