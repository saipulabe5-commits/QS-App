import os
import re

def fix_content(content):
    
    # FinancialReviewModal.tsx:95
    # <h4 className={`text-sm font-semibold ${anomaly.severity === 'fatal' ? 'text-rose-800 dark:text-rose-300' : 'text-amber-800' } >
    # it should be `}>` at the end
    content = content.replace("text-amber-800' } >", "text-amber-800' }>")
    content = content.replace("text-rose-800' } >", "text-rose-800' }>")
    
    # Also I should check if there are other ` } >` in the whole codebase
    content = re.sub(r"([a-zA-Z0-9\-]+)'\s*}\s*>", r"\1' }>", content)

    # In AHSPModal.tsx
    # <motion.divErrors: ["error TS17008: JSX element 'motion.div' has no corresponding closing tag."]
    # Wait, the closing tag error might be because we have broken `{` inside strings.
    # Ah! ReviewApprovalModal.tsx:483
    # <span className={`... text-rose-800`> -> fixed to `text-rose-800' }>`
    # Let's check `ReviewApprovalModal.tsx` around line 483 manually if possible.
    
    return content

changed = 0
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            new_content = fix_content(content)
            if new_content != content:
                with open(path, 'w') as f:
                    f.write(new_content)
                changed += 1

print(f"Fixed remaining broken strings in {changed} files.")
