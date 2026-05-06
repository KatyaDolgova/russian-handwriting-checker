import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout, ToastProvider } from '@/components/ui';
import { CheckPage, FunctionsPage, HistoryPage, ProfilePage, StudentsPage } from '@/pages';

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
