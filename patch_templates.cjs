const fs = require('fs');

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const target1 = `const mergedTemplates = [
          ...(loadedTemplatesRaw || []),
          ...INITIAL_TEMPLATES.filter((t) => !existingTplIds.has(t.id)),
        ];`;
        
const replacement1 = `// Only merge built-in templates if the user hasn't initialized the app
        const hasTplInit = safeLocalStorageGet(STORAGE_KEYS.TEMPLATES) !== null;
        const mergedTemplates = hasTplInit ? (loadedTemplatesRaw || []) : [
          ...(loadedTemplatesRaw || []),
          ...INITIAL_TEMPLATES.filter((t) => !existingTplIds.has(t.id)),
        ];`;
        
const target2 = `const mergedRabTemplates = [
          ...INITIAL_RAB_TEMPLATES.filter((t) => t.isBuiltIn),
          ...(loadedRabTemplatesRaw || []).filter((t: any) => !t.isBuiltIn || !INITIAL_RAB_TEMPLATES.some((it) => it.id === t.id)),
        ];`;
        
const replacement2 = `const hasRabTplInit = safeLocalStorageGet(STORAGE_KEYS.RAB_TEMPLATES) !== null;
        const mergedRabTemplates = hasRabTplInit ? (loadedRabTemplatesRaw || []) : [
          ...INITIAL_RAB_TEMPLATES.filter((t) => t.isBuiltIn),
          ...(loadedRabTemplatesRaw || []).filter((t: any) => !t.isBuiltIn || !INITIAL_RAB_TEMPLATES.some((it) => it.id === t.id)),
        ];`;
        
if (content.includes(target1) && content.includes(target2)) {
    content = content.replace(target1, replacement1);
    content = content.replace(target2, replacement2);
    fs.writeFileSync('src/context/AppContext.tsx', content);
    console.log("Templates patched");
} else {
    console.log("Targets not found. Trying regex...");
}
