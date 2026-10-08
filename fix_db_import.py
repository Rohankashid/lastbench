import re

for file in ["src/app/pyqs/PYQsClient.tsx", "src/app/notes/NotesClient.tsx"]:
    with open(file, "r") as f:
        content = f.read()

    if "import { db } from '@/lib/firebase';" not in content:
        content = content.replace("import { useAuth } from '@/hooks/useAuth';", "import { useAuth } from '@/hooks/useAuth';\nimport { db } from '@/lib/firebase';")
        
    with open(file, "w") as f:
        f.write(content)
