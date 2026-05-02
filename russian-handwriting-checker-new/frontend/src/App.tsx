import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import CheckPage from './pages/CheckPage';
import HistoryPage from './pages/HistoryPage';
import StudentsPage from './pages/StudentsPage';
import FunctionsPage from './pages/FunctionsPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<CheckPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/functions" element={<FunctionsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
