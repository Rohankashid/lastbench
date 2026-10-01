const fs = require('fs');

const fixAutoPreview = (file, typeName) => {
  let content = fs.readFileSync(file, 'utf8');

  // Add the initial auto-preview logic inside the component
  const hookLogic = `
  // Auto-open preview from URL parameter
  useEffect(() => {
    const v = searchParams.get('v');
    if (v && all${typeName}s.length > 0) {
      const target = all${typeName}s.find(item => item.id === v);
      if (target && !previewTarget) {
        setPreviewTarget(target);
      }
    }
  }, [searchParams, all${typeName}s]);
`;

  content = content.replace(
    /const \[filters, setFilters\] = useState\(\{[^\}]*\}\);/,
    match => hookLogic + "\n  " + match
  );

  // Update the onClose to clear the URL param
  content = content.replace(
    /onClose=\{\(\) => setPreviewTarget\(null\)\}/,
    `onClose={() => {
            setPreviewTarget(null);
            // Optionally clear the URL without refreshing
            if (searchParams.has('v')) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}`
  );

  fs.writeFileSync(file, content);
};

fixAutoPreview('src/app/notes/NotesClient.tsx', 'Note');
fixAutoPreview('src/app/pyqs/PYQsClient.tsx', 'PYQ');
console.log("Updated auto previews!");
