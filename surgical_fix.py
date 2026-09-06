import os
import re

def fix_content(content):
    # Fix comments swallowed }
    content = content.replace("// Non-blocking' }", "// Non-blocking\n  }")
    content = content.replace("// If unrecognized, return as-is' }", "// If unrecognized, return as-is\n}")
    
    # Fix startsWith('data' : '))
    content = content.replace("'data' : '))", "'data:'))")
    
    # Fix template string ending with single quote instead of backtick
    content = content.replace("`Pratinjau ${tpl.items.length} Item' }", "`Pratinjau ${tpl.items.length} Item`}")
    
    # Fix negative numbers like y: -10' }
    content = re.sub(r"([a-zA-Z0-9_]+:\s*-\d+)'\s*}", r"\1 }", content)
    content = re.sub(r"tabIndex=\{-1'\s*}>", r"tabIndex={-1}>", content)
    
    # Fix pattern 1: 'string' : ', -> 'string:',
    content = re.sub(r"'([^'\n]+)'\s*:\s*',", r"'\1:',", content)
    
    # Fix pattern 2: ' ' : ' -> ' : '
    content = re.sub(r"'\s+'\s*:\s*'", "' : '", content)
    
    # Fix pattern 3: ternary missing quote before colon: ? '#XXXXXX: '
    content = re.sub(r"(\?\s*'#[0-9a-fA-F]{3,8}):\s*'", r"\1' : '", content)
    
    # Fix ternary string missing quote before colon: ? 'Text: 'Text2'
    content = re.sub(r"(\?\s*'[^':\n]+):\s*'", r"\1' : '", content)
    
    # Fix className with missing backtick before }
    lines = content.split("\n")
    fixed_lines = []
    for line in lines:
        if "className={`" in line and not "`}" in line and (line.rstrip().endswith("}>") or line.rstrip().endswith("} >")):
            idx = line.rfind("}")
            if idx != -1:
                line = line[:idx] + "`" + line[idx:]
        fixed_lines.append(line)
    content = "\n".join(fixed_lines)

    return content

modified = []
for root, _, files in os.walk("src"):
    for f in files:
        if f.endswith((".ts", ".tsx")):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8") as fp:
                orig = fp.read()
            fixed = fix_content(orig)
            if fixed != orig:
                with open(path, "w", encoding="utf-8") as fp:
                    fp.write(fixed)
                modified.append(path)

print(f"Modified {len(modified)} files:")
for m in modified[:20]:
    print(" -", m)
