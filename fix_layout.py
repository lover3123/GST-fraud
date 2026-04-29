import os
import glob
import re

app_dir = r"c:\Users\userc\OneDrive\Desktop\software development\GST-fraud\frontend\src\app"
pages = glob.glob(os.path.join(app_dir, "**", "page.tsx"), recursive=True)

for p in pages:
    with open(p, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add flex to min-h-screen if it's missing
    content = content.replace('<div className="min-h-screen', '<div className="flex min-h-screen')
    
    # Fix main padding
    def rep(m):
        cls = [c for c in m.group(1).split() if not c.startswith('p-') and not c.startswith('pt-') and c != 'flex-1']
        cls.extend(['flex-1', 'p-8', 'pt-20'])
        return f'<main className="{" ".join(cls)}">'
    
    content = re.sub(r'<main className="([^"]+)">', rep, content)
    
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed padding and flex on all pages.")
