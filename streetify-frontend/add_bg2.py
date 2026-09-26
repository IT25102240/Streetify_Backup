import re, glob

for file in glob.glob('src/screens/*.tsx'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We are looking for wrappers like:
    # <div className="min-h-screen bg-slate-800 flex items-start justify-center py-10 px-4">
    # And replacing them with relative wrappers holding absolute backgrounds.
    
    pattern = r'<div\s+className=\"([^\"]*min-h-screen\s+[^\"]*bg-slate-800[^\"]*)\"(.*?)>'
    
    def repl(m):
        # Remove bg-slate-800 and add relative z-0
        cls = m.group(1).replace('bg-slate-800', '').strip()
        if 'relative' not in cls:
            cls += ' relative'
        if 'z-0' not in cls:
            cls += ' z-0'
        
        rest = m.group(2)
        
        return (f'<div className="{cls}" {rest}>\n'
                f'      <div className="absolute inset-0 -z-10 bg-[url(\'/hero-bg.jpg\')] bg-cover bg-center opacity-30" />\n'
                f'      <div className="absolute inset-0 -z-10 bg-slate-950/70 backdrop-blur-[40px]" />')
                
    new_content = re.sub(pattern, repl, content)
    
    if new_content != content:
        print(f'Modifying {file}...')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)

print('Done!')
