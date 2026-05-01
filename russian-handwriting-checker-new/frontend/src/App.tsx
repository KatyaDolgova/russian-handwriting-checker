import { useState } from 'react';
import { LogIn, LogOut, User, History, FileCheck, BookOpen, Settings } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import UploadForm from './components/UploadForm';
import TextEditor from './components/TextEditor';
import CheckPanel from './components/CheckPanel';
import ResultPanel from './components/ResultPanel';
import StreamingPreview from './components/StreamingPreview';
import HistoryPanel from './components/HistoryPanel';
import FunctionManager from './components/FunctionManager';

type Tab = 'check' | 'history' | 'functions';
type RightState = 'empty' | 'streaming' | 'result';

function AppContent() {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [tab, setTab] = useState<Tab>('check');

  const [editedText, setEditedText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [filename, setFilename] = useState('');
  const [functionId, setFunctionId] = useState('');
  const [streamText, setStreamText] = useState('');
  const [rightState, setRightState] = useState<RightState>('empty');

  const handleUploadSuccess = (data: any) => {
    setEditedText(data.text || '');
    setFilename(data.filename || 'uploaded-file');
    setResult(null);
    setRightState('empty');
  };

  const handleStreamStart = () => {
    setStreamText('');
    setResult(null);
    setRightState('streaming');
  };

  const handleStreamCancel = () => {
    setStreamText('');
    setRightState('empty');
  };

  const handleStreamChunk = (chunk: string) => {
    setStreamText((prev) => prev + chunk);
  };

  const handleCheckComplete = (res: any, fnId: string) => {
    setResult(res);
    setFunctionId(fnId);
    setRightState('result');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-lg tracking-tight">РусЯзык AI</span>
          </div>

          <nav className="flex items-center gap-1">
            <TabBtn active={tab === 'check'} onClick={() => setTab('check')} icon={<FileCheck className="h-4 w-4" />}>
              Проверка
            </TabBtn>
            {user && (
              <TabBtn active={tab === 'history'} onClick={() => setTab('history')} icon={<History className="h-4 w-4" />}>
                История
              </TabBtn>
            )}
            <TabBtn active={tab === 'functions'} onClick={() => setTab('functions')} icon={<Settings className="h-4 w-4" />}>
              Функции
            </TabBtn>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                  <User className="h-3.5 w-3.5" />
                  <span className="max-w-[160px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="cursor-pointer flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Выйти</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Check tab */}
        {tab === 'check' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="flex flex-col gap-5">
              <UploadForm onSuccess={handleUploadSuccess} />
              <TextEditor value={editedText} onChange={setEditedText} filename={filename} />
              <CheckPanel
                text={editedText}
                onCheckComplete={handleCheckComplete}
                onStreamChunk={handleStreamChunk}
                onStreamStart={handleStreamStart}
                onStreamCancel={handleStreamCancel}
              />
            </div>

            <div>
              {rightState === 'streaming' && <StreamingPreview text={streamText} />}
              {rightState === 'result' && result && (
                <ResultPanel
                  result={result}
                  originalText={editedText}
                  filename={filename}
                  functionId={functionId}
                />
              )}
              {rightState === 'empty' && <EmptyResult />}
            </div>
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <div className="max-w-3xl">
            {user ? (
              <>
                <h2 className="text-xl font-semibold text-slate-800 mb-5">История проверок</h2>
                <HistoryPanel />
              </>
            ) : (
              <EmptyAuth onLogin={() => setShowAuth(true)} />
            )}
          </div>
        )}

        {/* Functions tab */}
        {tab === 'functions' && (
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Функции проверки</h2>
                <p className="text-sm text-slate-400 mt-1">Управляйте промптами, которые ИИ использует для проверки работ</p>
              </div>
            </div>
            <FunctionManager />
          </div>
        )}
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
      }`}
    >
      {icon}{children}
    </button>
  );
}

function EmptyResult() {
  return (
    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-10 bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <FileCheck className="h-7 w-7 text-slate-400" />
      </div>
      <p className="text-slate-500 font-medium">Результат появится здесь</p>
      <p className="text-slate-400 text-sm mt-1">Введите текст и нажмите «Проверить»</p>
    </div>
  );
}

function EmptyAuth({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <User className="h-7 w-7 text-slate-400" />
      </div>
      <p className="text-slate-600 font-medium mb-1">Войдите, чтобы видеть историю</p>
      <p className="text-slate-400 text-sm mb-5">История сохраняется только для авторизованных пользователей</p>
      <button
        onClick={onLogin}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
      >
        <LogIn className="h-4 w-4" />Войти
      </button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
