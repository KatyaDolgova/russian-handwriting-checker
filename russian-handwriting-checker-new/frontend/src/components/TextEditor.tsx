import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { FileText } from 'lucide-react';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  filename: string;
}

export default function TextEditor({ value, onChange, filename }: TextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getText()),
    editorProps: {
      attributes: { class: 'ProseMirror' },
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Текст работы</h2>
        <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
          <FileText className="h-3 w-3" />
          {filename}
        </span>
      </div>
      <div className="border border-transparent focus-within:border-indigo-300 rounded-xl m-3 transition-colors">
        <EditorContent editor={editor} />
      </div>
      <div className="px-5 pb-3">
        <p className="text-xs text-slate-400">Можно отредактировать распознанный текст перед проверкой</p>
      </div>
    </div>
  );
}
