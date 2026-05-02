import FunctionManager from '../components/FunctionManager';

export default function FunctionsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Функции проверки</h2>
        <p className="text-sm text-slate-400 mt-1">Управляйте промптами, которые ИИ использует для проверки работ</p>
      </div>
      <FunctionManager />
    </div>
  );
}
