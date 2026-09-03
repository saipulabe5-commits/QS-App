#!/bin/bash

# Fix Sidebar.tsx
sed -i 's/text-white tracking-tight/text-[var(--text-primary)] tracking-tight/g' src/components/layout/Sidebar.tsx
sed -i 's/bg-blue-950 text-blue-300 border border-blue-800/bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800/g' src/components/layout/Sidebar.tsx
sed -i 's/bg-blue-900 text-blue-300/bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300/g' src/components/layout/Sidebar.tsx
sed -i 's/bg-emerald-950 text-emerald-300 border border-emerald-800\/40/bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800\/40/g' src/components/layout/Sidebar.tsx
sed -i 's/bg-blue-950 text-blue-300 border border-blue-800\/40/bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800\/40/g' src/components/layout/Sidebar.tsx

# Fix DashboardView.tsx
sed -i 's/text-white mt-2 truncate/text-[var(--text-primary)] mt-2 truncate/g' src/components/dashboard/DashboardView.tsx
sed -i 's/text-blue-400/text-blue-700 dark:text-blue-400/g' src/components/dashboard/DashboardView.tsx
sed -i 's/text-blue-300 hover:text-white/text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-white/g' src/components/dashboard/DashboardView.tsx
sed -i 's/bg-emerald-950 text-emerald-300 border border-emerald-800\/60/bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800\/60/g' src/components/dashboard/DashboardView.tsx
sed -i 's/bg-blue-950 text-blue-300 border border-blue-800\/60/bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800\/60/g' src/components/dashboard/DashboardView.tsx

