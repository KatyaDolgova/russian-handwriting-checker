import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export const CopyBtn = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    if (!text?.trim()) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className="cursor-pointer flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Скопировано' : 'Копировать'}
    </button>
  );
};
