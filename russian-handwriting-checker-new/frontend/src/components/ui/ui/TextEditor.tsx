import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { FileText } from 'lucide-react';
import { CopyBtn, WordCounter } from '@/components/ui';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  filename: string;
}

export const TextEditor = ({ value, onChange, filename }: TextEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getText()),
    editorProps: {
      attributes: {
        class: 'ProseMirror',
        'data-placeholder': 'Введите или вставьте текст для проверки...',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getText();
    if (current !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Текст работы
        </h2>
        <div className="flex items-center gap-2">
          <CopyBtn text={value} />
          {filename && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              <FileText className="h-3 w-3" />
              {filename}
            </span>
          )}
        </div>
      </div>
      <div className="border border-transparent focus-within:border-indigo-300 rounded-xl m-3 transition-colors">
        <EditorContent editor={editor} />
      </div>
      <div className="px-5 pb-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {filename
            ? 'Можно отредактировать распознанный текст перед проверкой'
            : 'Введите текст вручную или загрузите файл выше'}
        </p>
        <WordCounter text={value} />
      </div>
    </div>
  );
};
