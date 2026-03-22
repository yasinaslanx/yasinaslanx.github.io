#!/usr/bin/env python3
# Icon oluşturucu - PNG ikonlar için

icon16 = '''<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <rect width="16" height="16" rx="4" fill="url(#g)"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00ff88"/>
      <stop offset="100%" stop-color="#00aaff"/>
    </linearGradient>
  </defs>
  <text x="3" y="12" font-size="10" fill="white">📡</text>
</svg>'''

icon48 = '''<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="12" fill="url(#g)"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00ff88"/>
      <stop offset="100%" stop-color="#00aaff"/>
    </linearGradient>
  </defs>
  <text x="8" y="34" font-size="28" fill="white">📡</text>
</svg>'''

icon128 = '''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="url(#g)"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00ff88"/>
      <stop offset="100%" stop-color="#00aaff"/>
    </linearGradient>
  </defs>
  <text x="18" y="92" font-size="80" fill="white">📡</text>
</svg>'''

with open('icons/icon16.svg', 'w') as f: f.write(icon16)
with open('icons/icon48.svg', 'w') as f: f.write(icon48)
with open('icons/icon128.svg', 'w') as f: f.write(icon128)

print("SVG ikonlar oluşturuldu")
