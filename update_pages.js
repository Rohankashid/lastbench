const fs = require('fs');

const addSecondaryAction = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /action=\{\{\n\s*label: 'Clear all filters',\n\s*onClick: handleResetFilters\n\s*\}\}/,
    `action={{
                label: 'Clear all filters',
                onClick: handleResetFilters
              }}
              secondaryAction={{
                label: 'Request Material',
                onClick: () => {
                  toast.success('Request sent to admins! We will try to upload it soon.');
                }
              }}`
  );
  fs.writeFileSync(file, content);
};

addSecondaryAction('src/app/notes/page.tsx');
addSecondaryAction('src/app/pyqs/page.tsx');

console.log("Updated pages!");
