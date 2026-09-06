import os
import re
import subprocess

def fix_content(content):
    # Fix broken ternaries like `text-white: 'bg-` -> `text-white' : 'bg-`
    # We look for `?` followed by some string `'...something: '...`
    # Actually, we can just look for `: '` where the left side is clearly a tailwind class (has a dash) or is 'white'/'black'/'transparent'/'shadow'
    # and the right side is also a tailwind class.
    
    # Better: find `([a-zA-Z0-9\-/]+):\s*'` where the word before : is a tailwind class
    # To avoid object literals like `method: 'POST'`, we check if it's inside `${ ... }` or if the left side contains a dash.
    
    def replacer(m):
        left = m.group(1)
        # if it's a standard JS key (camelCase, no dashes), it's probably an object literal.
        if '-' in left or left in ['white', 'black', 'transparent', 'shadow', 'spin', 'none', 'xs', 'sm', 'md', 'lg', 'xl']:
            return f"{left}' : '"
        # if it's 'Upah' or 'Bahan' or 'Alat' (from AHSPModal)
        if left in ['Upah', 'Bahan', 'Alat', 'grouped', 'list', 'Simpan Analisa', 'Edit Analisa Harga Satuan', 'Tutup Rincian Koefisien']:
            return f"{left}' : '"
        return m.group(0)

    content = re.sub(r"([a-zA-Z0-9\-/ ]+):\s*'", replacer, content)
    
    # Ah wait! AHSPModal has: 'Upah: 'Alat' -> `Upah` doesn't have a dash!
    # So I added it to the explicit list.
    
    # Let's also fix missing quotes at the end of the ternary, before `}` or `]}`
    # `border-blue-200 }` -> `border-blue-200' }`
    content = re.sub(r"([a-zA-Z0-9\-/]+)\s*}", lambda m: m.group(1) + "' }" if '-' in m.group(1) else m.group(0), content)
    
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
