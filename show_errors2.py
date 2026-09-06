import re
import subprocess

out = subprocess.run(["npm", "run", "lint"], capture_output=True, text=True)
errors = out.stdout.split('\n')

file_errors = {}
for line in errors:
    m = re.match(r'(src/[^:]+)\((\d+),(\d+)\):\s+(.*)', line)
    if m:
        file = m.group(1)
        lineno = int(m.group(2))
        msg = m.group(4)
        if file not in file_errors:
            file_errors[file] = []
        file_errors[file].append((lineno, msg))

for file, errs in file_errors.items():
    print(f"=== {file} ===")
    with open(file, 'r') as f:
        lines = f.readlines()
    
    unique_lines = set(lineno for lineno, msg in errs)
    for lineno in sorted(unique_lines):
        idx = lineno - 1
        if 0 <= idx < len(lines):
            print(f"Line {lineno}: {lines[idx].strip()}")
        print(f"Errors: {[msg for l, msg in errs if l == lineno]}")
    print()
