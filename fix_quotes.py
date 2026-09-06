import os
import re

def fix_content(content):
    # This will fix any literal object destruction from the first script
    # where it did `method: 'POST'` -> `method' : 'POST',`
    # We want to reverse `(\w+)'\s*:\s*'` to `\1: '`
    content = re.sub(r"(\w+)'\s*:\s*'", r"\1: '", content)
    
    # Let's fix missing ending quotes in ternary
    # For example: `border-blue-200 }` -> `border-blue-200' }`
    # We only match tailwind classes
    content = re.sub(r"([a-z0-9\-]+)\s*}", lambda m: m.group(1) + "' }" if '-' in m.group(1) and m.group(1) != 'else' else m.group(0), content)
    
    # We broke `Upah: 'Alat'` in AHSPModal -> `Upah' : 'Alat'`
    # We also broke string literals that just ended unexpectedly.
    
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

print(f"Fixed {changed} files.")
