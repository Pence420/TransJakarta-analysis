import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import RoutesPage from './pages/RoutesPage';
import HeadwayPage from './pages/HeadwayPage';
import CoveragePage from './pages/CoveragePage';
import ChangesPage from './pages/ChangesPage';
import AboutPage from './pages/AboutPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<RoutesPage />} />
            <Route path="/headway" element={<HeadwayPage />} />
            <Route path="/coverage" element={<CoveragePage />} />
            <Route path="/changes" element={<ChangesPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
