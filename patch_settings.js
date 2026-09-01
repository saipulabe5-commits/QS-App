const fs = require('fs');
const content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const replacement = `  const updateSettings = (updates: Partial<CompanySettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      
      // Cascade global OHP changes to all AHSP Master Data
      if (
        (updates.defaultOverhead !== undefined && updates.defaultOverhead !== prev.defaultOverhead) ||
        (updates.defaultProfit !== undefined && updates.defaultProfit !== prev.defaultProfit)
      ) {
        setAhspItems((prevAhsp) => {
          return prevAhsp.map(ahsp => {
            const subtotal = ahsp.components.reduce((sum, c) => sum + (c.totalCost || c.coefficient * c.unitPrice || 0), 0);
            const oh = subtotal * (newSettings.defaultOverhead / 100);
            const pr = subtotal * (newSettings.defaultProfit / 100);
            const newUnitPrice = subtotal + oh + pr;
            
            return {
              ...ahsp,
              overheadPercent: newSettings.defaultOverhead,
              profitPercent: newSettings.defaultProfit,
              unitPrice: newUnitPrice
            };
          });
        });
      }
      return newSettings;
    });
    showToast('Pengaturan Disimpan', 'Pengaturan perusahaan berhasil diperbarui dan diterapkan.', 'success');
  };`;

const updated = content.replace(/  const updateSettings = \(updates: Partial<CompanySettings>\) => \{\n    setSettings\(\(prev\) => \(\{ \.\.\.prev, \.\.\.updates \}\)\);\n    showToast\('Pengaturan Disimpan', 'Pengaturan perusahaan berhasil diperbarui\.', 'success'\);\n  \};/, replacement);

fs.writeFileSync('src/context/AppContext.tsx', updated);
console.log('Patched updateSettings successfully.');
