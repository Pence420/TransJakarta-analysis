import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <TopNav />
      <main className="pt-20 px-6 pb-8">
        <Outlet />
      </main>
    </div>
  );
}
