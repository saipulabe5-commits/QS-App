const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

// Fix DashboardView
app = app.replace(
  /default:\s*return <DashboardView \/>;/g,
  `default:\n        return (\n          <Suspense fallback={<ViewFallback label="Memuat Dasbor..." />}>\n            <DashboardView />\n          </Suspense>\n        );`
);

// Fix InspectorPanel
app = app.replace(
  /<InspectorPanel[\s\S]*?\/>/g,
  `<Suspense fallback={null}>\n        $&      </Suspense>`
);

// Fix StatusBar (Wait, is StatusBar lazy? No, we only made InspectorPanel, CommandBar, ProjectSwitcherModal, KeyboardShortcutsModal, DiagnosticsModal lazy)

// Fix CommandBar
app = app.replace(
  /<CommandBar[\s\S]*?\/>/g,
  `<Suspense fallback={null}>\n      $&    </Suspense>`
);

// Fix ProjectSwitcherModal
app = app.replace(
  /<ProjectSwitcherModal[\s\S]*?\/>/g,
  `<Suspense fallback={null}>\n      $&    </Suspense>`
);

// Fix KeyboardShortcutsModal
app = app.replace(
  /<KeyboardShortcutsModal[\s\S]*?\/>/g,
  `<Suspense fallback={null}>\n      $&    </Suspense>`
);

// Fix DiagnosticsModal
app = app.replace(
  /<DiagnosticsModal[\s\S]*?\/>/g,
  `<Suspense fallback={null}>\n      $&    </Suspense>`
);

fs.writeFileSync('src/App.tsx', app);
console.log("App.tsx Suspense wrappers added.");
