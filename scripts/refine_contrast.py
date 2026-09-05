import os
import re

# We will write a precise script to inspect and clean each component.
# Let's inspect the exact prompt requirements:
# 1. ATURAN KARTU TERANG (Static Light Background):
# If an element has a static light background (example: bg-blue-50, bg-emerald-100, bg-white, bg-amber-50, bg-rose-50, bg-sky-50, etc.) WITHOUT dark:bg-...:
# - Remove all text classes with dark prefix (such as dark:text-white, dark:text-slate-200, dark:text-slate-300, dark:text-slate-400, etc.).
# - Remove dynamic text variables (such as text-[var(--text-primary)], text-[var(--text-secondary)], text-[var(--text-tertiary)]).
# - Lock text color to permanent dark: Use text-slate-900 for title/primary text and text-slate-700 for description/secondary text.
#
# 2. ATURAN KARTU GELAP (Static Dark Background):
# If an element has a static dark background (example: bg-slate-900, bg-indigo-950, bg-gradient-to-r from-slate-900, bg-blue-950, bg-black, bg-slate-950) WITHOUT light variant:
# - Remove all light text classes without dark: balancer (such as text-slate-600, text-slate-700, text-slate-800, text-slate-900).
# - Lock text color to permanent light: Use text-white or text-slate-100 for titles and text-slate-300 or text-slate-400 for descriptions.

print("Inspector ready.")
