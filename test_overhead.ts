import { calculateProjectFinancials } from './src/utils/calculations';
console.log(calculateProjectFinancials([{ volume: 100, unitPrice: 50000, totalCost: 5000000 }], { overheadPercent: 7, profitPercent: 10, taxPercent: 11 }).overheadConfig);
