if grep -q "hmr: false" vite.config.ts; then
  echo "PASS: hmr is false"
else
  echo "FAIL: hmr is not false"
  exit 1
fi
