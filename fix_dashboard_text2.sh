#!/bin/bash
sed -i 's/text-slate-600 dark:text-slate-300 hover:text-white/text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white/g' src/components/dashboard/DashboardView.tsx
sed -i 's/text-\[var(--text-secondary)\] hover:text-white/text-[var(--text-secondary)] hover:text-slate-900 dark:hover:text-white/g' src/components/dashboard/DashboardView.tsx
sed -i 's/<h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">/<h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)] dark:text-white">/g' src/components/dashboard/DashboardView.tsx
