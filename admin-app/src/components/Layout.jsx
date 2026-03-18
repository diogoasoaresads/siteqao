import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Trello, Settings, Code, LogOut, BellRing } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    fetch('/api/logout', { method: 'POST' }).then(() => navigate('/login'));
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/leads', icon: Users, label: 'Leads' },
    { path: '/pipeline', icon: Trello, label: 'Pipeline' },
    { path: '/settings/whatsapp', icon: Settings, label: 'WhatsApp' },
    { path: '/settings/scripts', icon: Code, label: 'Scripts e Tags' },
    { path: '/settings/notifications', icon: BellRing, label: 'Notificações' }
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar Vercel Style */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="font-bold tracking-tight text-xl">QAO Admin</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Simple Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm justify-between">
          <h1 className="text-lg font-semibold text-gray-800">
             {navItems.find(i => location.pathname === i.path || (i.path !== '/' && location.pathname.startsWith(i.path)))?.label || 'Painel'}
          </h1>
          <div className="flex items-center gap-4">
             <span className="text-sm text-gray-500">Administrador</span>
             <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center font-bold text-gray-600">A</div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
