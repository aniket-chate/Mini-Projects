import re

with open('frontend/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html_ids = set(re.findall(r'id=["\']([a-zA-Z0-9_\-]+)["\']', html))

js_files = [
    'frontend/js/app.js',
    'frontend/js/dashboard.js',
    'frontend/js/room_visualizer.js',
    'frontend/js/ai_concierge.js'
]
js_ids = set()

for jf in js_files:
    with open(jf, 'r', encoding='utf-8') as f:
        content = f.read()
    for m in re.findall(r'getElementById\(["\']([a-zA-Z0-9_\-]+)["\']\)', content):
        js_ids.add(m)

missing = [i for i in sorted(js_ids) if i not in html_ids]
print(f"Total JS getElementById references: {len(js_ids)}")
print(f"Total HTML IDs defined: {len(html_ids)}")
if missing:
    print(f"WARNING - Missing IDs in HTML: {missing}")
else:
    print("SUCCESS: 100% of JavaScript getElementById references exist in index.html!")
