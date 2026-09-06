import os
import re

def fix_content(content):
    
    # FinancialReviewModal.tsx:92
    # bg-rose-50 dark:bg-rose-500/15 border-rose-100 dark:border-rose-500/30: 'bg-amber-50 border-amber-100' } }>
    content = content.replace("border-rose-100 dark:border-rose-500/30: 'bg-amber-50 border-amber-100'", "border-rose-100 dark:border-rose-500/30' : 'bg-amber-50 border-amber-100'")
    content = content.replace("text-rose-600: 'text-amber-600'", "text-rose-600' : 'text-amber-600'")
    content = content.replace("text-rose-800 dark:text-rose-300: 'text-amber-800'", "text-rose-800 dark:text-rose-300' : 'text-amber-800'")

    # RABAssistantModal.tsx:497
    content = content.replace("bg-blue-600 text-white shadow-xs: 'text-slate-600 dark:text-slate-300 hover:bg-slate-700/60 hover:text-white'", "bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-700/60 hover:text-white'")

    # AIEstimatorModal.tsx:66
    content = content.replace("console.warn('AI API error or fallback to local generator' : ', err);", "console.warn('AI API error or fallback to local generator:', err);")

    # Now I should just look for `[a-zA-Z0-9\-/]+: '` that should be `[a-zA-Z0-9\-/]+' : '` but safely.
    # To be extremely safe, I will just write a regex that matches `[a-z]+-[a-z0-9\-]+: '` which means tailwind class like `bg-something: '`
    content = re.sub(r"([a-z]+-[a-z0-9\-]+)(?:\s+(?:dark:)?[a-z]+-[a-z0-9\-/]+)*:\s*'", r"\1' : '", content)
    # wait that replaced `text-white shadow-xs: '` -> `text-white shadow-xs' : '`? No, the regex would only capture `text-white`
    
    content = re.sub(r"([a-zA-Z0-9\-/ ]+)(?:\s+(?:dark:)?[a-z]+-[a-z0-9\-/]+)*:\s*'", lambda m: m.group(0).replace(": '", "' : '") if "-" in m.group(0) else m.group(0), content)
    # Wait, in `${ ... ? 'bg-red text-white: 'bg-blue text-black' }`
    # m.group(0) is `bg-red text-white: '`
    # Let's just do a simple replacement for all `} }>`. Wait, `} }>` is broken. It should be `}`
    content = content.replace("} }>", "} >")
    content = content.replace("`' } >", "`}>")
    
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
