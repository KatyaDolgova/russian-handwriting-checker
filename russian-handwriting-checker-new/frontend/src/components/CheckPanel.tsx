import { useState } from 'react';
import axios from 'axios';

interface CheckPanelProps {
  text: string;
  onCheckComplete: (result: any) => void;
}

export default function CheckPanel({ text, onCheckComplete }: CheckPanelProps) {
  const [checkType, setCheckType] = useState('grammar');
  const [isLoading, setIsLoading] = useState(false);

  const checkTypes = [
    { value: 'grammar', label: 'Орфография и пунктуация' },
    { value: 'oge_essay', label: 'Сочинение ОГЭ' },
    { value: 'ege_essay', label: 'Сочинение ЕГЭ' },
    { value: 'final_essay', label: 'Итоговое сочинение' },
  ];

  const handleCheck = async () => {
    if (!text.trim()) return alert('Текст пустой');

    setIsLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/check', {
        text: text,
        check_type: checkType,
      });
      onCheckComplete(res.data);
    } catch (err) {
      alert('Ошибка при проверке');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6">
      <h2 className="text-lg font-semibold mb-4">Выберите тип проверки</h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {checkTypes.map((item) => (
          <button
            key={item.value}
            onClick={() => setCheckType(item.value)}
            className={`py-3 px-4 rounded-2xl text-sm font-medium transition-all ${
              checkType === item.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleCheck}
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-semibold text-lg transition-all disabled:bg-gray-400"
      >
        {isLoading ? 'Проверяем...' : 'Проверить текст'}
      </button>
    </div>
  );
}

