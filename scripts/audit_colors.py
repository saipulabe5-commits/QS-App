import glob
import re
import os

components_dir = 'src/components'
files = glob.glob(f'{components_dir}/**/*.tsx', recursive=True)

print(f"Total files in {components_dir}: {len(files)}")

# Audit script to inspect static backgrounds and child text
for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Check for text-[var(--text
    var_matches = re.findall(r'text-\[var\(--text-[^\]]+\)\]', text)
    if var_matches:
        print(f"{path} has text-[var(--text-...)]: {len(var_matches)} times")
