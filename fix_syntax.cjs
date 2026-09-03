const fs = require('fs');
let content = fs.readFileSync('src/services/aiService.ts', 'utf8');

content = content.replace(
  "  }\n\n  // 1. Interactive Chat\n  async sendChatMessage(",
  "  },\n\n  // 1. Interactive Chat\n  async sendChatMessage("
);

fs.writeFileSync('src/services/aiService.ts', content);
console.log('Fixed aiService.ts syntax');
