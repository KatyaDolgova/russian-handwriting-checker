import { useState } from 'react';
import { LogIn, LogOut, User, History, FileCheck, BookOpen } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import UploadForm from './components/UploadForm';
import TextEditor from './components/TextEditor';
import CheckPanel from './components/CheckPanel';
import ResultPanel from './components/ResultPanel';
import HistoryPanel from './components/HistoryPanel';

type Tab = 'check' | 'history';

function AppContent() {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [tab, setTab] = useState<Tab>('check');

  const [editedText, setEditedText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [filename, setFilename] = useState('');
  const [functionId, setFunctionId] = useState('');

  const handleUploadSuccess = (data: any) => {
    setEditedText(data.text || '');
    setFilename(data.filename || 'uploaded-file');
    setResult(null);
  };

  const handleCheckComplete = (res: any, fnId: string) => {
    setResult(res);
    setFunctionId(fnId);
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

          <nav className="flex items-center gap-2">
            <TabButton active={tab === 'check'} onClick={() => setTab('check')} icon={<FileCheck className="h-4 w-4" />}>
              Проверка
            </TabButton>
            {user && (
              <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={<History className="h-4 w-4" />}>
                История
              </TabButton>
            )}
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
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
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
        {tab === 'check' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="flex flex-col gap-5">
              <UploadForm onSuccess={handleUploadSuccess} />

              {editedText && (
                <>
                  <TextEditor value={editedText} onChange={setEditedText} filename={filename} />
                  <CheckPanel text={editedText} onCheckComplete={handleCheckComplete} />
                </>
              )}
            </div>

            {/* Right column */}
            <div>
              {result ? (
                <ResultPanel
                  result={result}
                  originalText={editedText}
                  filename={filename}
                  functionId={functionId}
                />
              ) : (
                <EmptyResult />
              )}
            </div>
          </div>
        )}

        {tab === 'history' && user && (
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-800 mb-5">История проверок</h2>
            <HistoryPanel />
          </div>
        )}
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
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
      <p className="text-slate-400 text-sm mt-1">Загрузите работу и нажмите «Проверить»</p>
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
