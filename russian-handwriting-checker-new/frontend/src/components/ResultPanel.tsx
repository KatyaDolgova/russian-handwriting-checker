import { useState } from 'react';
import { Save, Edit3 } from 'lucide-react';

interface ResultPanelProps {
  result: any;
  originalText: string;
  filename: string;
}

export default function ResultPanel({ result, originalText, filename }: ResultPanelProps) {
  const [editedCorrected, setEditedCorrected] = useState(result.corrected_text || '');
  const [editedScore, setEditedScore] = useState(result.score || 85);
  const [editedComment, setEditedComment] = useState(result.comment || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    const saveData = {
      filename,
      original_text: originalText,
      corrected_text: editedCorrected,
      errors: result.errors || [],
      score: editedScore,
      comment: editedComment,
      check_type: result.check_type || 'grammar',
    };

    console.log('Сохранён результат:', saveData);
    alert('Результат успешно сохранён! (пока в консоль)');
    // Позже здесь будет вызов /api/save-result
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Edit3 className="h-6 w-6" />
          Результат проверки
        </h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl"
        >
          {isEditing ? 'Просмотр' : 'Редактировать'}
        </button>
      </div>

      {/* Исправленный текст */}
      <div className="mb-6">
        <label className="block text-sm text-gray-500 mb-2">Исправленный текст</label>
        {isEditing ? (
          <textarea
            value={editedCorrected}
            onChange={(e) => setEditedCorrected(e.target.value)}
            className="w-full h-64 p-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 font-mono text-sm"
          />
        ) : (
          <div
            className="p-5 bg-gray-50 rounded-2xl prose max-h-80 overflow-auto"
            dangerouslySetInnerHTML={{ __html: result.html_highlighted || editedCorrected }}
          />
        )}
      </div>

      {/* Оценка */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm text-gray-500 mb-1">Оценка</label>
          {isEditing ? (
            <input
              type="number"
              value={editedScore}
              onChange={(e) => setEditedScore(parseFloat(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-2xl text-3xl font-bold"
              min="0"
              max="100"
            />
          ) : (
            <p className="text-5xl font-bold text-green-600">{editedScore}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Комментарий</label>
          {isEditing ? (
            <textarea
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-2xl h-24"
            />
          ) : (
            <p className="text-gray-700 leading-relaxed">{editedComment}</p>
          )}
        </div>
      </div>

      {/* Кнопка сохранения */}
      <button
        onClick={handleSave}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all"
      >
        <Save className="h-5 w-5" />
        Сохранить результат проверки
      </button>
    </div>
  );
}