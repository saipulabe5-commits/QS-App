import glob
import re

files = glob.glob('src/components/**/*.tsx', recursive=True)

# Let's inspect where:
# 1. Elements have static light background (e.g. bg-blue-50, bg-emerald-50, bg-amber-50, bg-rose-50, bg-white, etc. without dark:bg)
# but have dark:text-* or text-[var(--text-primary)] or text-[var(--text-secondary)]
# OR inside such elements, child text has dark:text-white / dark:text-slate-200.

# 2. Elements have static dark background (e.g. bg-slate-900, bg-slate-950, bg-indigo-950, from-slate-900 etc. without light bg or without dark:bg)
# but have dark text like text-slate-700, text-slate-800, text-slate-900, text-slate-600.

print("Auditing specific patterns...")

patterns_to_check = [
    # Static light with dark text class:
    (r'(bg-(?:blue|emerald|amber|rose|indigo|sky|slate|gray|yellow|green|purple|teal|cyan|orange|red)-[51]00?)(?![^>]*dark:bg)[^>]*?(dark:text-[a-z0-9-]+)', 'LIGHT_BG_WITH_DARK_TEXT_CLASS'),
    (r'(bg-(?:blue|emerald|amber|rose|indigo|sky|slate|gray|yellow|green|purple|teal|cyan|orange|red)-[51]00?)(?![^>]*dark:bg)[^>]*?(text-\[var\(--text-[^\]]+\)\])', 'LIGHT_BG_WITH_VAR_TEXT'),
]

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for direct occurrences within a tag
    for tag_match in re.finditer(r'<[a-zA-Z0-9]+[^>]+className=(?:\"([^\"]+)\"|\{`([^`]+)`\})[^>]*>', content):
        tag_str = tag_match.group(0)
        cls = tag_match.group(1) or tag_match.group(2) or ""
        
        has_dark_bg = 'dark:bg-' in cls or 'dark:from-' in cls
        
        # Rule 1: Static Light Background in class (e.g., bg-blue-50, bg-emerald-50, bg-amber-50, bg-rose-50, bg-sky-50, bg-indigo-50, bg-emerald-100, bg-amber-100, bg-white) without dark:bg
        # If it has static light bg and has dark:text-* or text-[var(--text-
        static_light_match = re.search(r'\b(bg-(?:blue|emerald|amber|rose|indigo|sky|slate|gray|yellow|green|purple|teal|cyan|orange|red)-(?:50|100))\b', cls)
        if static_light_match and not has_dark_bg:
            if 'dark:text-' in cls or 'text-[var(--text-' in cls:
                print(f"[RULE 1] {fpath}: {static_light_match.group(1)} with dynamic/dark text: {cls}")

        # Rule 2: Static Dark Background in class (e.g. bg-slate-900, bg-slate-950, bg-indigo-950, bg-gray-900, from-slate-900) without dark:bg and without bg-white / bg-slate-50 / bg-gray-50
        static_dark_match = re.search(r'\b(bg-(?:slate|gray|indigo|blue)-(?:900|950)|from-(?:slate|indigo|blue)-(?:900|950))\b', cls)
        if static_dark_match and not has_dark_bg and not re.search(r'\b(bg-white|bg-slate-50|bg-slate-100|bg-gray-50|bg-gray-100)\b', cls):
            # Check if it has text-slate-600/700/800/900 without dark:
            dark_text_match = re.search(r'(?<!dark:)\b(text-(?:slate|gray)-(?:600|700|800|900))\b', cls)
            if dark_text_match and not re.search(r'\bdark:text-(?:white|slate-100|slate-200|slate-300)', cls):
                print(f"[RULE 2] {fpath}: {static_dark_match.group(1)} with dark text: {cls}")
