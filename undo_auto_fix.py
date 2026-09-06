import os
import re

def undo_fix(content):
    # reverse r"(\w+)\s*:\s*'" -> r"\1' : '"
    # basically, any \w+' : ' should become \w+: '
    content = re.sub(r"(\w+)'\s*:\s*'", r"\1: '", content)
    
    # reverse r"(\? '[^']+?)\s*:\s*'" -> r"\1' : '"
    # ? 'bg-something' : 'bg-something2'
    # Wait, my auto_fix did:
    # content = re.sub(r"(\? '[^']+?)\s*:\s*'", r"\1' : '", content)
    # The original intent was to ADD a missing quote. If it added a quote properly, it's correct.
    # What if it double added? No, the regex was `(\? '[^']+?)` without a quote at the end.
    
    # Let's just fix the object literal syntax we broke.
    return content

changed = 0
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            new_content = undo_fix(content)
            if new_content != content:
                with open(path, 'w') as f:
                    f.write(new_content)
                changed += 1

print(f"Undid object literal destruction in {changed} files.")
