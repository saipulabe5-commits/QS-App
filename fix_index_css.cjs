const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

// Remove the appended stuff if I ran it twice
content = content.replace(/\/\* Rapid Zero-Cost Dark Mode \*\/[\s\S]*/, "");

content += `
/* Rapid Zero-Cost Dark Mode */
html.dark {
  filter: invert(1) hue-rotate(180deg);
}
html.dark img, 
html.dark object, 
html.dark video,
html.dark .no-invert {
  filter: invert(1) hue-rotate(180deg);
}
`;

fs.writeFileSync('src/index.css', content);
