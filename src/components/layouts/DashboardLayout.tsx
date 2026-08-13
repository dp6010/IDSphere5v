import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, LayoutDashboard, FileText, Users, Badge } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Footer } from '../Footer';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Forms', path: '/forms', icon: FileText },
    { name: 'Registrations', path: '/registrations', icon: Users },
    { name: 'Identities', path: '/identities', icon: Badge },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <img src="/logo-light.svg" alt="IDSphere" className="h-7 w-auto" />
            </div>
            
            <nav className="hidden md:flex gap-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                               (item.path !== '/' && location.pathname.startsWith(item.path));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-slate-800 text-white" 
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon size={16} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <User size={16} />
              <span>{user?.displayName || user?.email}</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-xs ml-2 border border-slate-700">
                {user?.role}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
