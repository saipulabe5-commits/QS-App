import glob
import re

files = [
    'src/components/dashboard/DashboardView.tsx',
    'src/components/dashboard/StatCards.tsx',
    'src/components/dashboard/CostBreakdownChart.tsx',
    'src/components/dashboard/CategoryBreakdownCard.tsx',
    'src/components/dashboard/RecentProjectsSection.tsx',
    'src/components/ahsp/AHSPView.tsx',
    'src/components/ahsp/AHSPModal.tsx',
    'src/components/settings/SettingsView.tsx',
    'src/components/settings/SourceCodeExportModal.tsx',
    'src/components/scurve/SCurvePlanView.tsx',
    'src/components/scurve/SCurveActualView.tsx',
    'src/components/scurve/SCurveComparisonView.tsx',
    'src/components/scurve/GanttChartView.tsx',
    'src/components/rab/RABView.tsx',
    'src/components/rab/RABTable.tsx',
    'src/components/rab/RABItemModal.tsx',
    'src/components/rab/RABSummaryCard.tsx',
    'src/components/rab/QuickRABBuilderModal.tsx',
    'src/components/drawings/DrawingAnalysisView.tsx',
    'src/components/drawings/DrawingUploadModal.tsx',
    'src/components/drawings/DrawingItemEditModal.tsx',
    'src/components/calculator/VolumeCalculatorView.tsx',
    'src/components/reports/ReportView.tsx',
    'src/components/projects/ProjectListView.tsx',
    'src/components/projects/ProjectModal.tsx',
    'src/components/ai/RABAssistantModal.tsx',
    'src/components/ai/AIEstimatorModal.tsx',
    'src/components/ai/ReviewApprovalModal.tsx',
    'src/components/ai/FinancialReviewModal.tsx',
    'src/components/database/PriceDatabaseView.tsx',
    'src/components/database/PriceItemModal.tsx',
]

# We need to find all containers with static light bg or static dark bg.
# A container has a static light bg if it has bg-blue-50, bg-emerald-50, bg-amber-50, bg-rose-50,
# bg-indigo-50, bg-sky-50, bg-emerald-100, bg-blue-100, bg-amber-100, bg-white, bg-slate-50, etc. WITHOUT dark:bg-...
# Let's inspect each file and see what static containers exist and what child elements they have.

print("Starting scan for static containers...")
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Search for occurrences of static light bg:
    # Look for tags with bg-(color)-(50|100|white) without dark:bg
    # And check if inside them (or within 500 characters) there are dark:text- or text-[var(--text
    matches = re.finditer(r'<[a-zA-Z0-9]+[^>]*className=[\'\"{]([^\'\">}]+)[\'\"}][^>]*>', content)
    for m in matches:
        cls = m.group(1)
        # Check if static light
        if re.search(r'\b(bg-(?:blue|emerald|amber|rose|indigo|sky|emerald|slate|gray|yellow|green|purple|teal|cyan|orange|red)-(?:50|100))\b', cls) and not 'dark:bg-' in cls and not 'dark:from-' in cls:
            pos = m.start()
            # print snippet
            snippet = content[pos:pos+400]
            if 'dark:text-' in snippet or 'text-[var(--text' in snippet:
                print(f"=== [STATIC LIGHT] {fpath} ===")
                print(snippet[:300].strip())
                print("-----------------------------------")
        
        # Check if static dark (e.g. bg-slate-900, bg-slate-950, bg-indigo-950, bg-gray-900, from-slate-900) without dark:bg and without bg-white
        if re.search(r'\b(bg-(?:slate|gray|indigo|blue)-(?:900|950)|from-(?:slate|gray|indigo|blue)-(?:900|950))\b', cls) and not 'dark:bg-' in cls and not re.search(r'\b(bg-white|bg-slate-50|bg-gray-50)\b', cls):
            pos = m.start()
            snippet = content[pos:pos+400]
            # check if snippet contains text-slate-600/700/800/900 without dark:
            if re.search(r'(?<!dark:)\btext-(slate|gray)-(600|700|800|900)\b', snippet):
                print(f"=== [STATIC DARK] {fpath} ===")
                print(snippet[:300].strip())
                print("-----------------------------------")
