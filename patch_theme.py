with open("src/theme.ts", "r") as f:
    code = f.read()

target = """  let textColor = config.text
  if (isDark && isHexDark(config.text)) {
    textColor = '#f8fafc'
  } else if (!isDark && !isHexDark(config.text)) {
    textColor = '#0f172a'
  }"""

replacement = """  let textColor = config.text"""

if target in code:
    code = code.replace(target, replacement)
    with open("src/theme.ts", "w") as f:
        f.write(code)
    print("Success")
else:
    print("Not found")
