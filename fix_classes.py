import os
import re

def process_classes(class_string):
    classes = class_string.split()
    
    # Categorize classes
    dark_bgs = []
    dark_texts = []
    dark_borders = []
    others = []
    
    for c in classes:
        if c.startswith('dark:bg-') and not c.startswith('dark:bg-opacity-'):
            dark_bgs.append(c)
        elif c.startswith('dark:text-') and not c.startswith('dark:text-opacity-'):
            dark_texts.append(c)
        elif c.startswith('dark:border-') and not c.startswith('dark:border-opacity-') and not c.startswith('dark:border-t-') and not c.startswith('dark:border-b-') and not c.startswith('dark:border-l-') and not c.startswith('dark:border-r-'):
            dark_borders.append(c)
        else:
            others.append(c)
            
    def resolve_duplicates(dark_list, preferred_suffix_patterns, default_priority_suffix):
        if len(dark_list) <= 1:
            return dark_list
            
        # Try to find preferred
        for p in preferred_suffix_patterns:
            matches = [c for c in dark_list if p in c]
            if matches:
                return [matches[0]]
                
        # Fallback priority
        for p in default_priority_suffix:
            matches = [c for c in dark_list if p in c]
            if matches:
                return [matches[0]]
                
        return [dark_list[0]]
        
    resolved_bgs = resolve_duplicates(dark_bgs, ['-500/15', '-500/10', '-500/20'], ['-900', '-950', '-800', '-700'])
    resolved_texts = resolve_duplicates(dark_texts, ['-300', '-400'], ['-200', '-100', 'white'])
    resolved_borders = resolve_duplicates(dark_borders, ['-500/30', '-500/20'], ['-700', '-800', '-900'])
    
    final_classes = []
    for c in classes:
        if c in dark_bgs:
            if c in resolved_bgs:
                final_classes.append(c)
                resolved_bgs.remove(c) # in case of exact duplicates
        elif c in dark_texts:
            if c in resolved_texts:
                final_classes.append(c)
                resolved_texts.remove(c)
        elif c in dark_borders:
            if c in resolved_borders:
                final_classes.append(c)
                resolved_borders.remove(c)
        else:
            final_classes.append(c)
            
    return " ".join(final_classes)

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    # Find all class strings, they might be in className="...", className={`...`}, className={'...'}
    # Also considering template literals with variables, this could be tricky, but we can match string literals inside className
    # Let's match all quotes inside className
    
    # Simpler approach: find any string literal containing 'dark:bg-' or 'dark:text-' or 'dark:border-'
    # and process it.
    
    def replacer(match):
        full_string = match.group(0)
        quote = match.group(1)
        inner = match.group(2)
        new_inner = process_classes(inner)
        return f'{quote}{new_inner}{quote}'

    # Match "...", '...', or `...`
    # Warning: this might match non-class strings if they contain dark:, but it's safe since it's just CSS class processing.
    new_content = re.sub(r'(["\'`])((?:(?!\1)[^\\]|\\.)*?)\1', lambda m: replacer(m) if 'dark:' in m.group(2) else m.group(0), content)
    
    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        return True
    return False

changed_files = 0
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
            if process_file(os.path.join(root, file)):
                changed_files += 1

print(f"Fixed {changed_files} files.")
