const fs = require('fs');
const glob = require('glob');

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/<button[^>]*>/g);
  if (matches) {
    matches.forEach(m => {
      if (!m.includes('onClick=') && !m.includes('type="submit"')) {
        console.log("No action button in", file, ":", m);
      }
    });
  }
}

const getFiles = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(getFiles(file));
    } else { 
      if(file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

getFiles('src').forEach(processFile);
