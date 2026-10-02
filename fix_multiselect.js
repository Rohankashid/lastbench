const fs = require('fs');
const path = 'src/components/ui/SearchableMultiSelect.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Rename interface
content = content.replace('export interface SearchableSelectProps', 'export interface SearchableMultiSelectProps');
content = content.replace('value: string;', 'value: string[];');
content = content.replace('onChange: (value: string) => void;', 'onChange: (value: string[]) => void;');

// 2. Rename component
content = content.replace('export const SearchableSelect = (', 'export const SearchableMultiSelect = (');
content = content.replace('SearchableSelectProps', 'SearchableMultiSelectProps');

// 3. Update handleSelect
const oldHandleSelect = `
  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
    setSearchQuery('');
  };
`;
const newHandleSelect = `
  const handleSelect = (selectedValue: string) => {
    if (selectedValue === '') {
      onChange([]);
      setIsOpen(false);
      setSearchQuery('');
      return;
    }
    
    const newValue = value.includes(selectedValue)
      ? value.filter(v => v !== selectedValue)
      : [...value, selectedValue];
      
    onChange(newValue);
  };
`;
content = content.replace(oldHandleSelect, newHandleSelect);

// 4. Update display label
const oldDisplayLabel = `
  const displayLabel = React.useMemo(() => {
    if (!value) return placeholder;
    if (groups) {
      for (const g of groups) {
        const found = g.options.find(o => o.value === value);
        if (found) return found.label;
      }
    }
    if (options) {
      const found = options.find(o => o.value === value);
      if (found) return found.label;
    }
    return value;
  }, [value, groups, options, placeholder]);
`;
const newDisplayLabel = `
  const displayLabel = React.useMemo(() => {
    if (!value || value.length === 0) return placeholder;
    if (value.length === 1) {
      const singleValue = value[0];
      if (groups) {
        for (const g of groups) {
          const found = g.options.find(o => o.value === singleValue);
          if (found) return found.label;
        }
      }
      if (options) {
        const found = options.find(o => o.value === singleValue);
        if (found) return found.label;
      }
      return singleValue;
    }
    return value.length + " selected";
  }, [value, groups, options, placeholder]);
`;
content = content.replace(oldDisplayLabel, newDisplayLabel);

content = content.replace(/const isSelected = value === opt\.value;/g, 'const isSelected = value.includes(opt.value);');
content = content.replace(/value={value}/g, 'value={value.join(",")}');
content = content.replace(/const handleClear =.*?};/s, `const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setSearchQuery('');
  };`);

fs.writeFileSync(path, content);
console.log("Updated");
