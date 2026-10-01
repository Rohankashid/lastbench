const fs = require('fs');

let content = fs.readFileSync('src/components/ui/EmptyState.tsx', 'utf8');

content = content.replace(
`  action?: {
    label: string;
    onClick: () => void;
  };`,
`  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };`
);

content = content.replace(
`      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}`,
`      <div className="flex items-center gap-3">
        {action && (
          <button
            onClick={action.onClick}
            className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="px-5 py-2.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>`
);

fs.writeFileSync('src/components/ui/EmptyState.tsx', content);
console.log("Updated EmptyState!");
