import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiBarChart2, FiBookOpen, FiBox, FiCpu, FiDollarSign, FiFileText, FiGrid, FiLogOut, FiSettings, FiShoppingCart, FiUsers, FiZap } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/copilot', label: 'AI Copilot', icon: FiCpu },
  { to: '/knowledge', label: 'Knowledge Base', icon: FiBookOpen },
  { to: '/ai-reports', label: 'AI Reports', icon: FiFileText },
  { to: '/customers', label: 'Customers', icon: FiUsers },
  { to: '/inventory', label: 'Inventory', icon: FiBox },
  { to: '/orders', label: 'Orders', icon: FiShoppingCart },
  { to: '/finance', label: 'Finance', icon: FiDollarSign },
  { to: '/analytics', label: 'Analytics', icon: FiBarChart2 },
  { to: '/automation', label: 'Automation', icon: FiZap },
  { to: '/settings', label: 'Settings', icon: FiSettings }
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:w-64">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <div>
            <p className="text-lg font-bold text-brand-700">AI-BOS</p>
            <p className="text-xs text-slate-500">Business operating system</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-3 lg:block lg:space-y-1 lg:overflow-visible">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-slate-950">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
          <button className="btn-secondary" onClick={handleLogout}><FiLogOut /> Logout</button>
        </header>
        <main><Outlet /></main>
      </div>
    </div>
  );
}
