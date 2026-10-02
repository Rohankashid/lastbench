const fs = require('fs');

const file1 = 'src/components/ui/SearchableMultiSelect.tsx';
let c1 = fs.readFileSync(file1, 'utf8');
c1 = c1.replace(/SearchableSelectProps/g, 'SearchableMultiSelectProps');
c1 = c1.replace(/opt\.value === value/g, 'value.includes(opt.value)');
c1 = c1.replace(/onChange\(val\)/g, 'onChange([val])'); // Fallback if there is an onChange(val) somewhere
c1 = c1.replace(/title={displayLabel}/g, 'title={typeof displayLabel === "string" ? displayLabel : displayLabel.join(", ")}');
fs.writeFileSync(file1, c1);

const file2 = 'src/app/upload/page.tsx';
let c2 = fs.readFileSync(file2, 'utf8');
// Fix the onChange={(val) => setBranch(val)} for multi select
c2 = c2.replace(/<SearchableMultiSelect([\s\S]*?)onChange={\(val\) => setBranch\(val\)}/g, '<SearchableMultiSelect$1onChange={(val: string[]) => setBranch(val)}');
fs.writeFileSync(file2, c2);
console.log("Fixed TS");
