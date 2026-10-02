const fs = require('fs');
const path = 'src/app/upload/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Import
content = content.replace(
  "import { SearchableSelect } from '@/components/ui/SearchableSelect';",
  "import { SearchableSelect } from '@/components/ui/SearchableSelect';\nimport { SearchableMultiSelect } from '@/components/ui/SearchableMultiSelect';"
);

// State
content = content.replace(
  "const [branch, setBranch] = useState('');",
  "const [branch, setBranch] = useState<string[]>([]);"
);

// Form append / JSON API request (in newUploadBlock)
content = content.replace(
  "branch,\n            year:",
  "branch: branch.join(', '),\n            year:"
);

// Initial setBranch from user profile
content = content.replace(
  "if (data.branch) setBranch(data.branch);",
  "if (data.branch) setBranch(data.branch.split(',').map((b: string) => b.trim()));"
);

// Replace SearchableSelect with SearchableMultiSelect in JSX
const oldSelect = `
                      <SearchableSelect
                        name="branch"
                        value={branch}
                        onChange={(val) => setBranch(val)}
                        groups={BRANCH_SELECT_GROUPS}
                        placeholder="Select Engineering Branch"
                        searchPlaceholder="Search branch (CSE, IT, ENTC, etc.)..."
                        buttonClassName="py-2.5 bg-white text-xs border-zinc-200"
                      />
`;
const newSelect = `
                      <SearchableMultiSelect
                        name="branch"
                        value={branch}
                        onChange={(val) => setBranch(val)}
                        groups={BRANCH_SELECT_GROUPS}
                        placeholder="Select Engineering Branches"
                        searchPlaceholder="Search branch (CSE, IT, ENTC, etc.)..."
                        buttonClassName="py-2.5 bg-white text-xs border-zinc-200"
                      />
`;
content = content.replace(oldSelect, newSelect);

// Validation check
content = content.replace(
  "if (!branch) {",
  "if (!branch || branch.length === 0) {"
);

// Validation reset
content = content.replace(
  "setBranch('');",
  "setBranch([]);"
);

// Render badges
content = content.replace(
  "{branch || 'Select Branch'}",
  "{branch.length > 0 ? branch.join(', ') : 'Select Branch'}"
);
content = content.replace(
  "branch !== 'First Year Engineering (Common)'",
  "!branch.includes('First Year Engineering (Common)')"
);

fs.writeFileSync(path, content);
console.log("Updated page.tsx to use MultiSelect");
