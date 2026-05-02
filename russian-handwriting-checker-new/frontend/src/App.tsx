import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import CheckPage from './pages/CheckPage';
import HistoryPage from './pages/HistoryPage';
import StudentsPage from './pages/StudentsPage';
import FunctionsPage from './pages/FunctionsPage';
import ProfilePage from './pages/ProfilePage';

export interface CheckState {
  editedText: string;
  result: Record<string, unknown> | null;
  filename: string;
  functionId: string;
  rightState: 'empty' | 'streaming' | 'result';
}

const INIT_CHECK: CheckState = {
  editedText: '',
  result: null,
  filename: '',
  functionId: '',
  rightState: 'empty',
};

export default function App() {
  const [checkState, setCheckState] = useState<CheckState>(INIT_CHECK);

  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<CheckPage state={checkState} setState={setCheckState} />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/functions" element={<FunctionsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
