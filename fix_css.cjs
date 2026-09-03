const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

// Remove the filter invert trick
css = css.replace(/html\.dark \{[\s\S]*?hue-rotate\(180deg\);\n\}/g, '');
css = css.replace(/html\.dark img,[\s\S]*?hue-rotate\(180deg\);\n\}/g, '');

const macVariables = `
:root[data-theme="dark"], .dark {
  --bg-window: #1E1E1E;
  --bg-sidebar: rgba(40, 40, 40, 0.85);
  --bg-elevated: #2C2C2E;
  --bg-elevated-hover: #3A3A3C;
  --bg-input: #1C1C1E;
  --bg-titlebar: rgba(30, 30, 30, 0.72);

  --text-primary: rgba(255, 255, 255, 0.92);
  --text-secondary: rgba(235, 235, 245, 0.60);
  --text-tertiary: rgba(235, 235, 245, 0.38);
  --text-disabled: rgba(235, 235, 245, 0.25);

  --border-primary: rgba(255, 255, 255, 0.10);
  --border-subtle: rgba(255, 255, 255, 0.06);

  --accent-blue: #0A84FF;
  --accent-blue-hover: #409CFF;
  --system-red: #FF453A;
  --system-green: #32D74B;
  --system-yellow: #FFD60A;
  --system-orange: #FF9F0A;
  --system-purple: #BF5AF2;

  --sidebar-selected-bg: rgba(10, 132, 255, 0.22);
  --sidebar-selected-text: #FFFFFF;
  --sidebar-selected-border: rgba(10, 132, 255, 0.5);

  --traffic-red: #FF5F57;
  --traffic-yellow: #FEBC2E;
  --traffic-green: #28C840;

  --shadow-elevated: 0 0 0 0.5px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
  --shadow-modal: 0 0 0 0.5px rgba(255,255,255,0.08), 0 25px 50px rgba(0,0,0,0.55);
}

:root[data-theme="light"], :root:not(.dark) {
  --bg-window: #F5F5F7;
  --bg-sidebar: rgba(246, 246, 246, 0.85);
  --bg-elevated: #FFFFFF;
  --bg-elevated-hover: #F2F2F2;
  --bg-input: #FFFFFF;
  --bg-titlebar: rgba(246, 246, 246, 0.72);

  --text-primary: rgba(0, 0, 0, 0.90);
  --text-secondary: rgba(60, 60, 67, 0.60);
  --text-tertiary: rgba(60, 60, 67, 0.38);
  --text-disabled: rgba(60, 60, 67, 0.25);

  --border-primary: rgba(0, 0, 0, 0.10);
  --border-subtle: rgba(0, 0, 0, 0.06);

  --accent-blue: #007AFF;
  --accent-blue-hover: #0063CC;
  --system-red: #FF3B30;
  --system-green: #34C759;
  --system-yellow: #FFCC00;
  --system-orange: #FF9500;
  --system-purple: #AF52DE;

  --sidebar-selected-bg: rgba(0, 122, 255, 0.12);
  --sidebar-selected-text: #007AFF;
  --sidebar-selected-border: rgba(0, 122, 255, 0.35);

  --traffic-red: #FF5F57;
  --traffic-yellow: #FEBC2E;
  --traffic-green: #28C840;

  --shadow-elevated: 0 0 0 0.5px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
  --shadow-modal: 0 0 0 0.5px rgba(0,0,0,0.05), 0 25px 50px rgba(0,0,0,0.25);
}

@layer base {
  body {
    background-color: var(--bg-window) !important;
    color: var(--text-primary) !important;
  }
}
`;

css = css + '\n' + macVariables;
fs.writeFileSync('src/index.css', css);
console.log("CSS Updated");
