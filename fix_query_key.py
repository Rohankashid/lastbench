import re

for file in ["src/app/pyqs/PYQsClient.tsx", "src/app/notes/NotesClient.tsx"]:
    with open(file, "r") as f:
        content = f.read()

    old_key_pyqs = "queryKey: ['pyqs', filters.semester, filters.university, filters.branch],"
    new_key_pyqs = "queryKey: ['pyqs', filters.semester, filters.university, filters.branch, filters.search],"
    content = content.replace(old_key_pyqs, new_key_pyqs)

    old_key_notes = "queryKey: ['notes', filters.semester, filters.university, filters.branch],"
    new_key_notes = "queryKey: ['notes', filters.semester, filters.university, filters.branch, filters.search],"
    content = content.replace(old_key_notes, new_key_notes)
    
    with open(file, "w") as f:
        f.write(content)

