import { useState } from 'react';
import UploadForm from './components/UploadForm';
import TextEditor from './components/TextEditor';
import CheckPanel from './components/CheckPanel';
import ResultPanel from './components/ResultPanel';

function App() {
  const [editedText, setEditedText] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [filename, setFilename] = useState<string>('');

  const handleUploadSuccess = (data: any) => {
    const text = data.text || data.raw_text || '';
    setEditedText(text);
    setFilename(data.filename || 'uploaded-file');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">
          Проверка работ по русскому языку
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <UploadForm onSuccess={handleUploadSuccess} />

            {editedText && (
              <>
                <TextEditor
                  value={editedText}
                  onChange={setEditedText}
                  filename={filename}
                />

                <CheckPanel
                  text={editedText}
                  onCheckComplete={setResult}
                />
              </>
            )}
          </div>

          <div>
            {result && (
              <ResultPanel
                result={result}
                originalText={editedText}
                filename={filename}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;