import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

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
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 border border-gray-200 rounded-2xl bg-white',
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Редактирование текста</h2>
        <span className="text-sm text-gray-500">{filename}</span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}