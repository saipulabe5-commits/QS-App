const fs = require('fs');

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const regex = /const loadStoreData = async <T,>.*?return initialData;\n  };/s;

const newLoadStoreData = `const loadStoreData = async <T,>(
    storeName: any,
    initialData: T[],
    lsKey: string,
    normalizer?: (it: any) => T
  ): Promise<T[]> => {
    // If key exists in local storage, user has used the app before
    const hasBeenInitialized = safeLocalStorageGet(lsKey) !== null;

    try {
      if (idbStorage.isSupported()) {
        const idbData = await idbStorage.getAll<T>(storeName);
        if (idbData && idbData.length > 0) {
          return normalizer ? idbData.map(normalizer) : idbData;
        }
      }
    } catch {
      // ignore
    }

    const lsStr = safeLocalStorageGet(lsKey);
    if (lsStr) {
      try {
        const parsed = JSON.parse(lsStr);
        if (Array.isArray(parsed)) {
          const norm = normalizer ? parsed.map(normalizer) : parsed;
          if (idbStorage.isSupported() && norm.length > 0) {
            idbStorage.putAll(storeName, norm).catch(() => {});
          }
          return norm;
        }
      } catch {
        // ignore
      }
    }

    // Only fallback to initialData if never initialized
    if (!hasBeenInitialized) {
      if (idbStorage.isSupported() && initialData.length > 0) {
        idbStorage.putAll(storeName, initialData).catch(() => {});
      }
      return initialData;
    }

    // User explicitly deleted all items
    return [];
  };`;

if(content.match(regex)) {
  content = content.replace(regex, newLoadStoreData);
  fs.writeFileSync('src/context/AppContext.tsx', content);
  console.log("Patched successfully");
} else {
  console.log("Regex not found");
}
