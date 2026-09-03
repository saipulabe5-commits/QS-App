#!/bin/bash
sed -i 's/bg-blue-950 border border-blue-800 text-blue-300 text-xs font-bold mb-3/bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300 text-xs font-bold mb-3/g' src/components/dashboard/DashboardView.tsx
sed -i 's/text-white">Dashboard Estimasi/text-[var(--text-primary)]">Dashboard Estimasi/g' src/components/dashboard/DashboardView.tsx
