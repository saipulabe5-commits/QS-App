const fs = require('fs');
let content = fs.readFileSync('src/components/rab/RABView.tsx', 'utf8');

// 1. Add Import
content = content.replace(
  "import { QuickRABBuilderModal } from './QuickRABBuilderModal';",
  "import { QuickRABBuilderModal } from './QuickRABBuilderModal';\nimport { FinancialReviewModal } from '../ai/FinancialReviewModal';"
);

// 2. Add State
content = content.replace(
  "const [isQuickBuilderOpen, setIsQuickBuilderOpen] = useState(false);",
  "const [isQuickBuilderOpen, setIsQuickBuilderOpen] = useState(false);\n  const [isFinancialReviewOpen, setIsFinancialReviewOpen] = useState(false);"
);

// 3. Add Modal at the bottom
content = content.replace(
  "    </div>\n  );\n};",
  `      {/* Financial Review Modal */}
      {isFinancialReviewOpen && (
        <FinancialReviewModal
          isOpen={isFinancialReviewOpen}
          onClose={() => setIsFinancialReviewOpen(false)}
          project={selectedProject}
          items={projectRABItems}
          calculation={calc}
        />
      )}
    </div>
  );
};`
);

fs.writeFileSync('src/components/rab/RABView.tsx', content);
console.log('Fixed RABView');
