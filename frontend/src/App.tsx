import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import RoutesPage from './pages/RoutesPage';
import HeadwayPage from './pages/HeadwayPage';
import CoveragePage from './pages/CoveragePage';
import ChangesPage from './pages/ChangesPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<RoutesPage />} />
        <Route path="headway" element={<HeadwayPage />} />
        <Route path="coverage" element={<CoveragePage />} />
        <Route path="changes" element={<ChangesPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
