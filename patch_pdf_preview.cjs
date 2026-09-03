const fs = require('fs');

let content = fs.readFileSync('src/components/drawings/DrawingAnalysisView.tsx', 'utf8');

// Line 270
content = content.replace(
  /<img\s*src=\{drawing\.fileUrl\}\s*alt=\{drawing\.title\}\s*className="w-full h-full object-cover"\s*\/>/m,
  `{drawing.fileUrl?.includes('application/pdf') ? (
                          <object data={drawing.fileUrl} type="application/pdf" className="w-full h-full object-cover overflow-hidden pointer-events-none" />
                        ) : (
                          <img
                            src={drawing.fileUrl}
                            alt={drawing.title}
                            className="w-full h-full object-cover"
                          />
                        )}`
);

// Line 383
content = content.replace(
  /<img\s*src=\{activeDrawing\.fileUrl\}\s*alt=\{activeDrawing\.title\}\s*className="w-full h-full object-cover group-hover:scale-105 transition-transform"\s*\/>/m,
  `{activeDrawing.fileUrl?.includes('application/pdf') ? (
                      <object data={activeDrawing.fileUrl} type="application/pdf" className="w-full h-full object-cover group-hover:scale-105 transition-transform pointer-events-none" />
                    ) : (
                      <img
                        src={activeDrawing.fileUrl}
                        alt={activeDrawing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    )}`
);

// Line 462
content = content.replace(
  /<img\s*src=\{activeDrawing\.fileUrl\}\s*alt=\{activeDrawing\.title\}\s*style=\{\{\s*transform: \`scale\(\$\{zoomLevel\}\)\`,\s*transformOrigin: 'center center',\s*transition: 'transform 0\.2s ease',\s*\}\}\s*className="max-h-\[320px\] w-auto object-contain rounded-md shadow-md"\s*\/>/m,
  `{activeDrawing.fileUrl?.includes('application/pdf') ? (
                    <object 
                      data={activeDrawing.fileUrl} 
                      type="application/pdf"
                      className="w-full h-full min-h-[320px] rounded-md shadow-md"
                    />
                  ) : (
                    <img
                      src={activeDrawing.fileUrl}
                      alt={activeDrawing.title}
                      style={{
                        transform: \`scale(\${zoomLevel})\`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.2s ease',
                      }}
                      className="max-h-[320px] w-auto object-contain rounded-md shadow-md"
                    />
                  )}`
);

// Line 939
content = content.replace(
  /<img src=\{previewModalUrl\} alt="Preview" className="max-w-full h-auto object-contain rounded-lg" \/>/m,
  `{previewModalUrl?.includes('application/pdf') ? (
                <object data={previewModalUrl} type="application/pdf" className="w-full h-[70vh] rounded-lg" />
              ) : (
                <img src={previewModalUrl} alt="Preview" className="max-w-full h-auto object-contain rounded-lg" />
              )}`
);

fs.writeFileSync('src/components/drawings/DrawingAnalysisView.tsx', content);
console.log('Patched DrawingAnalysisView to support PDF display');
