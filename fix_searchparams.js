const fs = require('fs');

const fixParams = (file) => {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /type Props = \{\n  searchParams: \{ \[key: string\]: string \| string\[\] \| undefined \};\n\};/g,
    \`type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};\`/g
  );

  content = content.replace(
    /const v = searchParams\.v;/g,
    \`const resolvedSearchParams = await searchParams;
  const v = resolvedSearchParams.v;\`
  );

  fs.writeFileSync(file, content);
};

fixParams('src/app/notes/page.tsx');
fixParams('src/app/pyqs/page.tsx');
console.log('Fixed searchParams for Next 15!');
