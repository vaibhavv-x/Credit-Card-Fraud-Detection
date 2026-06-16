import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Database, BarChart2, GitCommit, Cpu, 
  CheckCircle, PlayCircle, Eye, ShieldAlert, Info, Menu, X, LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Landing Page', path: '/', icon: Home },
    { name: 'Dataset Overview', path: '/dataset', icon: Database },
    { name: 'Exploratory EDA', path: '/eda', icon: BarChart2 },
    { name: 'Preprocessing Pipeline', path: '/preprocessing', icon: GitCommit },
    { name: 'ML Models', path: '/models', icon: Cpu },
    { name: 'Model Evaluation', path: '/evaluation', icon: CheckCircle },
    { name: 'Fraud Prediction', path: '/prediction', icon: PlayCircle },
    { name: 'Explainable AI', path: '/xai', icon: Eye },
    { name: 'Batch Analytics', path: '/batch', icon: ShieldAlert },
    { name: 'About Project', path: '/about', icon: Info },
  ];

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { name: 'Admin User', email: 'admin@aegisfraud.in' };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-xl bg-slate-900/80 border border-darkBorder backdrop-blur-glass text-white shadow-lg"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Panel */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 lg:w-80 h-screen
        bg-slate-950/80 border-r border-darkBorder backdrop-blur-glass
        flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:relative lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo / Header */}
          <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-darkBorder/40">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brandBlue to-brandPurple flex items-center justify-center shadow-glowPurple">
              <ShieldAlert className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">AegisFraud</h1>
              <p className="text-[10px] text-brandPurple font-semibold tracking-widest uppercase">ML Analytics Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200 group relative overflow-hidden
                    ${isActive 
                      ? 'bg-gradient-to-r from-brandBlue/20 to-brandPurple/20 border border-brandPurple/30 text-white shadow-glowPurple/20' 
                      : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/40 hover:border-darkBorder/40'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brandBlue to-brandPurple rounded-r" />
                      )}
                      <Icon size={18} className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-brandPurple' : 'text-slate-400 group-hover:text-brandBlue'}`} />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer with User details & Logout */}
        <div className="pt-4 border-t border-darkBorder/40 flex flex-col gap-3.5 px-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brandBlue to-brandPurple flex items-center justify-center font-black text-white text-sm shadow-glowPurple">
              {user.name ? user.name[0] : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neonGreen animate-pulse" />
              <span className="text-slate-400 font-semibold">Engine Active</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 text-slate-400 hover:text-neonRed transition-colors font-bold cursor-pointer"
            >
              <LogOut size={12} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
