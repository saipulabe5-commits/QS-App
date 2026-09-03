const fs = require('fs');

function processFile(file, regex) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.match(regex)) {
    content = content.replace(regex, '<div\n                      aria-hidden="true"\n                      className=$1\n                    >');
    fs.writeFileSync(file, content);
    console.log("Fixed wrapper button in", file);
  }
}

processFile('src/components/ahsp/AHSPView.tsx', /<button\s+type="button"\s+className=([^>]+)\s*>/);
processFile('src/components/scurve/GanttChartView.tsx', /<button\s+type="button"\s+className=([^>]+)\s*>/);

