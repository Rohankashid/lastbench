const fs = require('fs');
const path = 'src/app/upload/page.tsx';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(
  /<SearchableSelect\s+name="branch"[\s\S]*?onChange=\{\(val\) => setBranch\(val\)\}[\s\S]*?\/>/,
  `<SearchableMultiSelect
    name="branch"
    value={branch}
    onChange={(val: string[]) => setBranch(val)}
    groups={BRANCH_SELECT_GROUPS}
    placeholder="Select Engineering Branches"
    searchPlaceholder="Search branch (CSE, IT, ENTC, etc.)..."
    buttonClassName="py-2.5 bg-white text-xs border-zinc-200"
  />`
);
fs.writeFileSync(path, c);
console.log("Fixed JSX");
