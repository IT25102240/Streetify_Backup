import re, glob

for file in glob.glob('src/screens/*.tsx'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We are looking for wrappers like:
    # <div className="min-h-screen bg-slate-950 flex items-start justify-center py-10 px-4">
    # And replacing them with relative wrappers holding absolute backgrounds.
    
    def repl(m):
        cls = m.group(1).replace('bg-slate-950', 'relative')
        rest = m.group(2)
        return (f'<div className="{cls}" {rest}>\n'
                f'      <div className="fixed inset-0 bg-[url(\'/hero-bg.jpg\')] bg-cover bg-center opacity-30" />\n'
                f'      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-3xl" />\n'
                f'      <div className="relative z-10 w-full h-full flex flex-col items-center">')

    pattern = r'<div\s+className=\"(min-h-screen\s+bg-slate-950[^\"]*)\"(.*?)>'
    
    new_content = re.sub(pattern, repl, content)
    
    # We also need to add a closing </div> before the final closing tag of the component if we added an opening div.
    # Actually, wrapping the whole thing inside might break things if we aren't careful.
    
    if new_content != content:
        print(f'Modifying {file}...')
        # Instead of wrapping blindly, let's just use the existing wrapper and add the backgrounds as the FIRST children.
        def repl2(m):
            cls = m.group(1).replace('bg-slate-950', 'relative')
            rest = m.group(2)
            return (f'<div className="{cls}" {rest}>\n'
                    f'      {'{/* Background Layer */}'}\n'
                    f'      <div className="fixed inset-0 z-0">\n'
                    f'        <div className="absolute inset-0 bg-[url(\'/hero-bg.jpg\')] bg-cover bg-center opacity-30" />\n'
                    f'        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[40px]" />\n'
                    f'      </div>\n'
                    f'      {'{/* Content */}'}\n'
                    f'      <div className="relative z-10 w-full flex justify-center">')
                    
        new_content2 = re.sub(pattern, repl2, content)
        
        # We STILL need a closing div. 
        # Actually, if we just do:
        def repl3(m):
            cls = m.group(1).replace('bg-slate-950', 'relative z-0')
            rest = m.group(2)
            return (f'<div className="{cls}" {rest}>\n'
                    f'      <div className="absolute inset-0 -z-10 bg-[url(\'/hero-bg.jpg\')] bg-cover bg-center opacity-30" />\n'
                    f'      <div className="absolute inset-0 -z-10 bg-slate-950/70 backdrop-blur-[40px]" />')
                    
        final_content = re.sub(pattern, repl3, content)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(final_content)

print('Done!')
