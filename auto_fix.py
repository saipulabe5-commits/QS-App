import os
import re
import subprocess

def fix_content(content):
    # Fix missing single quote at the end of ternary branch just before }`
    # e.g. : 'bg-blue-50 text-blue-700 border-blue-200 }`}
    content = re.sub(r"(: '[^']+?)\s*}\s*`}", r"\1' }`}", content)
    content = re.sub(r"(: '[^']+?)\s*}", r"\1' }", content)

    # Fix missing single quote at the end of first ternary branch
    # e.g. ? 'bg-emerald-100 text-emerald-800 : 'bg-amber-100
    content = re.sub(r"(\? '[^']+?)\s*:\s*'", r"\1' : '", content)

    # Fix concatenated : and '
    # e.g. 'bg-amber-50 :'hover:bg-
    content = re.sub(r"(\w+)\s*:'", r"\1' : '", content)
    content = re.sub(r"(\w+)\s*:\s*'", r"\1' : '", content)

    # specific fix for SCurvePlanView.tsx
    # it might have completely merged lines, let's check it manually later if this fails.
    
    return content

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            new_content = fix_content(content)
            if new_content != content:
                with open(path, 'w') as f:
                    f.write(new_content)

subprocess.run(["npm", "run", "lint"])
