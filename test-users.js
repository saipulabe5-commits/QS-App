const fs = require('fs');
const data = fs.readFileSync('.data/users_store.json', 'utf-8');
console.log(data);
