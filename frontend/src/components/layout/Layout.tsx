import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import NotificationDrawer from '../NotificationDrawer';
import { useSocket } from '../../hooks/useSocket';

export default function Layout() {
  useSocket(); // Initialize Socket.IO connection

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-grid p-6">
          <Outlet />
        </main>
      </div>
      <NotificationDrawer />
    </div>
  );
}
