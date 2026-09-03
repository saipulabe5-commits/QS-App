const fs = require('fs');
const glob = require('glob'); // use standard fs approach

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const regex1 = /<button type="button" className="(w-3\.5 h-3\.5 rounded-full bg-\[\#(?:FFBD2E|27C93F|FF5F56)\].*?)"><\/button>/g;
  if(content.match(regex1)) {
    content = content.replace(regex1, '<div className="$1"></div>');
    changed = true;
  }
  
  // same without type="button"
  const regex2 = /<button className="(w-3\.5 h-3\.5 rounded-full bg-\[\#(?:FFBD2E|27C93F|FF5F56)\].*?)"><\/button>/g;
  if(content.match(regex2)) {
    content = content.replace(regex2, '<div className="$1"></div>');
    changed = true;
  }

  if(changed) {
    fs.writeFileSync(file, content);
    console.log("Fixed dummy buttons in", file);
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
