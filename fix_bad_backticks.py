import os
import re

def fix_content(content):
    # Oh! `text-amber-800\`` is broken because of my first script maybe? Or just a missing quote.
    # `'text-amber-800\`` should be `'text-amber-800'`
    # We look for a string literal that ends with a backtick instead of a quote.
    # Like `'text-amber-800`'>` -> wait it's `'text-amber-800\`` => we want `'text-amber-800'`
    
    # Or maybe it is: `: 'text-amber-800`'>`
    content = re.sub(r"'\s*([a-zA-Z0-9\-]+)`\s*}", r"' \1' }", content)
    content = re.sub(r"([a-zA-Z0-9\-]+)`\s*}", r"\1' }", content)
    
    # Also I noticed FinancialReviewModal.tsx:95
    # `<h4 className={`text-sm font-semibold ${anomaly.severity === 'fatal' ? 'text-rose-800 dark:text-rose-300' : 'text-amber-800`' }>`
    # The string is `'text-amber-800`'` which should be `'text-amber-800' }`
    content = content.replace("text-amber-800`'", "text-amber-800' }")
    content = content.replace("text-rose-800`'>", "text-rose-800' }> ")
    
    content = re.sub(r"([a-zA-Z0-9\-]+)`\s*'", r"\1' }", content)
    
    # Let's fix missing closing tags? Wait, if we fix the JSX expressions then closing tags issue might go away.
    # 'text-rose-800`'> -> `'text-rose-800' }>`
    content = re.sub(r"([a-zA-Z0-9\-]+)`\s*>", r"\1' }>", content)

    # Let's see what else `ReviewApprovalModal.tsx:483`: `bg-rose-100 text-rose-800`>`
    content = content.replace("text-rose-800`>", "text-rose-800' }>")

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

print(f"Fixed backticks in {changed} files.")
