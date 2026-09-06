import os
import re

def fix_content(content):
    # This tries to fix broken ternaries like `text-white: 'bg-indigo-50'` -> `text-white' : 'bg-indigo-50'`
    # We look for a tailwind class or some word followed by `: '`
    
    def replacer(m):
        left = m.group(1)
        # Avoid things inside object literals. Object keys usually don't have dashes. 
        # But if they do, we assume it's a tailwind class. 
        # Or if it's 'white', 'black', 'transparent', 'shadow'
        if '-' in left or left in ['white', 'black', 'transparent', 'shadow', 'spin', 'none', 'xs', 'sm', 'md', 'lg', 'xl']:
            # But wait, what if the string is already `text-white: '...`? I want it to be `text-white' : '...`
            return f"{left}' : '"
        # special cases
        if left in ['Upah', 'Bahan', 'Alat', 'grouped', 'list', 'Simpan Analisa', 'Edit Analisa Harga Satuan', 'Tutup Rincian Koefisien', 'Formulasi AHSP Baru', 'password']:
            return f"{left}' : '"
        return m.group(0)

    # Note the regex `([a-zA-Z0-9\-/ ]+):\s*'` matches `text-white: '` and calls replacer.
    content = re.sub(r"([a-zA-Z0-9\-/ ]+):\s*'", replacer, content)
    
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
