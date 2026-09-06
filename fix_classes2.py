import os
import re

def fix_class_string(class_str):
    classes = class_str.split()
    dark_bgs = [c for c in classes if c.startswith('dark:bg-') and not c.startswith('dark:bg-opacity-')]
    dark_texts = [c for c in classes if c.startswith('dark:text-') and not c.startswith('dark:text-opacity-')]
    
    dark_borders = [c for c in classes if c.startswith('dark:border-') 
                    and not any(c.startswith(prefix) for prefix in ['dark:border-opacity-', 'dark:border-t-', 'dark:border-b-', 'dark:border-l-', 'dark:border-r-'])]
    
    def get_best(class_list):
        if len(class_list) <= 1:
            return class_list
        # Preferred: contains opacity
        for c in class_list:
            if '/' in c:
                return [c]
        # Or specific shade for text
        for c in class_list:
            if '300' in c or '400' in c:
                return [c]
        return [class_list[0]]
        
    final_classes = []
    seen = set()
    
    best_bg = get_best(dark_bgs)
    best_text = get_best(dark_texts)
    best_border = get_best(dark_borders)
    
    for c in classes:
        if c in dark_bgs:
            if c in best_bg and c not in seen:
                final_classes.append(c)
                seen.add(c)
        elif c in dark_texts:
            if c in best_text and c not in seen:
                final_classes.append(c)
                seen.add(c)
        elif c in dark_borders:
            if c in best_border and c not in seen:
                final_classes.append(c)
                seen.add(c)
        else:
            final_classes.append(c)
            
    return " ".join(final_classes)

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    def replacer(match):
        return match.group(1) + fix_class_string(match.group(2)) + match.group(3)
        
    new_content = re.sub(r'([`\'"])([ a-zA-Z0-9\-_/:]*dark:[a-zA-Z0-9\-_/:]+[ a-zA-Z0-9\-_/:]*)([`\'"])', replacer, content)
    
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
