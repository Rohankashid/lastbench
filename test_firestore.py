import re

def fix(filename):
    with open(filename, "r") as f:
        content = f.read()

    # We will conditionally add orderBy ONLY if no other filters are active.
    # Otherwise, we rely on default sorting.
    
    old_code = """    const constraints: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */ = [
      where('category', '==', 'pyq'),
      orderBy('uploadedAt', 'desc')
    ];"""
    new_code = """    const constraints: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */ = [
      where('category', '==', 'pyq')
    ];
    
    const hasFilters = Boolean(filters.semester || filters.university || filters.branch);
    if (!hasFilters) {
      constraints.push(orderBy('uploadedAt', 'desc'));
    }"""
    
    content = content.replace(old_code, new_code)
    
    old_code_notes = """    const constraints: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */ = [
      where('category', '==', 'note'),
      orderBy('uploadedAt', 'desc')
    ];"""
    new_code_notes = """    const constraints: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */ = [
      where('category', '==', 'note')
    ];
    
    const hasFilters = Boolean(filters.semester || filters.university || filters.branch);
    if (!hasFilters) {
      constraints.push(orderBy('uploadedAt', 'desc'));
    }"""
    
    content = content.replace(old_code_notes, new_code_notes)

    with open(filename, "w") as f:
        f.write(content)

fix("src/app/pyqs/PYQsClient.tsx")
fix("src/app/notes/NotesClient.tsx")
