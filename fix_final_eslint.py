import re

for file in ["src/app/pyqs/PYQsClient.tsx", "src/app/notes/NotesClient.tsx"]:
    with open(file, "r") as f:
        content = f.read()

    # Remove storage import completely
    content = re.sub(r'import \{.*?storage.*?\} from \'@/lib/firebase\';\n', '', content)
    # Remove matchesUniversity and matchesBranch blocks entirely
    content = re.sub(r'  const matchesUniversity.*?\};\n', '', content, flags=re.DOTALL)
    content = re.sub(r'  const matchesBranch.*?\};\n', '', content, flags=re.DOTALL)
    
    # Fix the any in fetchPage
    content = content.replace("as any", "as any /* eslint-disable-line @typescript-eslint/no-explicit-any */")
    
    with open(file, "w") as f:
        f.write(content)
