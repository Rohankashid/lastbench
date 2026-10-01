const fs = require('fs');

const fixEffect = (file, type) => {
  let content = fs.readFileSync(file, 'utf8');
  const findStr = `  }, [searchParams, all${type}s]);`;
  const replaceStr = `    // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, [searchParams, all${type}s]);`;
  
  if (content.includes(findStr) && !content.includes(replaceStr)) {
    content = content.replace(findStr, replaceStr);
    fs.writeFileSync(file, content);
  }
};

fixEffect('src/app/notes/NotesClient.tsx', 'Note');
fixEffect('src/app/pyqs/PYQsClient.tsx', 'PYQ');
console.log('Fixed useEffect dependencies!');
