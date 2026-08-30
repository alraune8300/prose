import re

with open("src/Toolbar.tsx", "r") as f:
    code = f.read()

# Revert the wrong replacement in FontSizeSelector
code = code.replace("  return (\n    <>\n      <div className=\"relative flex items-center gap-0.5 shrink-0 select-none\">", "  return (\n    <div className=\"relative flex items-center gap-0.5 shrink-0 select-none\">")

# Now find the Toolbar return
toolbar_return_idx = code.find("  return (\n    <div\n      ref={toolbarRef}")
if toolbar_return_idx != -1:
    code = code[:toolbar_return_idx] + "  return (\n    <>\n    <div\n      ref={toolbarRef}" + code[toolbar_return_idx + len("  return (\n    <div\n      ref={toolbarRef}"):]
else:
    print("Toolbar return not found!")

with open("src/Toolbar.tsx", "w") as f:
    f.write(code)

print("Done")
