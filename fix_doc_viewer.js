const fs = require('fs');
let content = fs.readFileSync('src/components/ui/DocumentViewer.tsx', 'utf8');

if (!content.includes('Share2')) {
    content = content.replace("import { X, ExternalLink, Download }", "import { X, ExternalLink, Download, Share2, Check }");
}

if (!content.includes('isCopied')) {
    content = content.replace("const [showSignInModal, setShowSignInModal] = useState(false);", "const [showSignInModal, setShowSignInModal] = useState(false);\n  const [isCopied, setIsCopied] = useState(false);");
}

const copyButtonCode = `
                  <button
                    onClick={() => {
                      const shareUrl = \`\${window.location.origin}\${window.location.pathname}?v=\${materialId}\`;
                      navigator.clipboard.writeText(shareUrl);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-medium transition-colors cursor-pointer"
                    title="Copy Share Link"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-zinc-500" />}
                    <span className="hidden sm:inline">{isCopied ? 'Copied!' : 'Share'}</span>
                  </button>
`;

content = content.replace("                  <a\n                    href={proxyUrl}", copyButtonCode + "\n                  <a\n                    href={proxyUrl}");

fs.writeFileSync('src/components/ui/DocumentViewer.tsx', content);
console.log("Updated DocumentViewer!");
