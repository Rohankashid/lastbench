import re

def fix(filename, is_pyq=True):
    with open(filename, "r") as f:
        content = f.read()

    # Remove the global handleDownload/shareOnWhatsApp
    match = re.search(r'  const handleDownload.*?\};\n', content, re.DOTALL)
    if match:
        content = content.replace(match.group(0), "")
        
    # And there are two of them (handleDownload and shareOnWhatsApp)
    match2 = re.search(r'  const shareOnWhatsApp.*?\};\n\n', content, re.DOTALL)
    if match2:
        content = content.replace(match2.group(0), "")

    # Define them inside the component
    func_name = "PYQsContent" if is_pyq else "NotesContent"
    component_start = f"function {func_name}() {{\n"
    
    missing_funcs = """  const handleDownload = (item: any) => {
    toast.success('Download starting...');
    if (item.fileUrl) window.open(item.fileUrl, '_blank');
  };

  const shareOnWhatsApp = (item: any) => {
    const text = `Check out this ${item.title || item.name} on LastBench!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + window.location.href)}`;
    window.open(url, '_blank');
  };
"""
    content = content.replace(component_start, component_start + missing_funcs)

    # Fix BookmarkButton
    # Notes
    content = re.sub(r'<BookmarkButton materialId=\{note\.id\} userId=\{user\?\.uid\} onAuthRequired=\{.*?\} />', '<BookmarkButton materialId={note.id} />', content)
    # PYQs
    content = re.sub(r'<BookmarkButton materialId=\{pyq\.id\} userId=\{user\?\.uid\} onAuthRequired=\{.*?\} />', '<BookmarkButton materialId={pyq.id} />', content)
    
    with open(filename, "w") as f:
        f.write(content)

fix("src/app/pyqs/PYQsClient.tsx", True)
fix("src/app/notes/NotesClient.tsx", False)
print("Fixed final tsc errors")
