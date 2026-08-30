with open("src/LeftPanel.tsx", "r") as f:
    code = f.read()

target_str = """<div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1" style={{ background: isHoveredOrActive ? (c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : c.surface, borderRadius: 4 }}>"""
replacement_str = """<div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity" style={{ background: 'transparent', borderRadius: 4 }}>"""

if target_str in code:
    code = code.replace(target_str, replacement_str)
    with open("src/LeftPanel.tsx", "w") as f:
        f.write(code)
    print("Success")
else:
    print("Not found string match")
