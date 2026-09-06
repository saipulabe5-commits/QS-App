import os
import re

def fix_content(content):
    
    # AHSPModal has: 'bg-emerald-100 text-emerald-800: 'bg-amber-100 text-amber-800' }`}
    content = content.replace("'bg-emerald-100 text-emerald-800: 'bg-amber-100 text-amber-800'", "'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'")
    
    # ErrorBoundary has: console.warn('Reset storage failed' : ', e);
    content = content.replace("'Reset storage failed' : ', e);", "'Reset storage failed:', e);")

    # AIEstimatorModal has: headers: { 'Content-Type: 'application/json' },
    content = content.replace("'Content-Type: 'application/json'", "'Content-Type' : 'application/json'")
    
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
