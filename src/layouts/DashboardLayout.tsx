import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Calendar, Users, MessageCircle, Wallet, User, LogOut, Menu, X, Settings, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: Home,          label: 'Dashboard'    },
  { to: '/appointments', icon: Calendar,       label: 'Appointments' },
  { to: '/schedule',     icon: Clock,          label: 'My Schedule'  },
  { to: '/clients',      icon: Users,          label: 'My Clients'   },
  { to: '/chats',        icon: MessageCircle,  label: 'Chat'         },
  { to: '/wallet',       icon: Wallet,         label: 'Wallet'       },
  { to: '/profile',      icon: User,           label: 'Profile'      },
  { to: '/settings',     icon: Settings,       label: 'Settings'     },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Keep scrolling inside the main content area, not the whole page.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    api.get('/providers/profile')
      .then((r) => api.parseResponse<{ data?: { provider?: { is_available?: boolean } } }>(r))
      .then((res) => {
        const val = res.data?.provider?.is_available;
        if (val !== undefined) setIsAvailable(!!val);
      })
      .catch(() => {});
  }, []);

  const toggleAvailability = async () => {
    const next = !isAvailable;
    setIsAvailable(next);
    try {
      await api.put('/providers/profile', { is_available: next ? 1 : 0 });
    } catch {
      setIsAvailable(!next);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };
  const profilePic = api.getProfilePicUrl(user?.profile_pic);

  return (
    <div className="h-screen bg-surface flex overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-primary-dark text-white flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-white/10">
          <img src="/web_logo.jpeg" alt="Canoe Health" className="h-7 w-auto" />
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Availability toggle */}
        {isAvailable !== null && (
          <div className="mx-3 mt-3 mb-1 bg-white/8 rounded-xl px-3 py-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Status</p>
                <p className={`text-xs font-bold mt-0.5 ${isAvailable ? 'text-green-400' : 'text-white/40'}`}>
                  {isAvailable ? '● Accepting bookings' : '○ Not accepting'}
                </p>
              </div>
              <button
                onClick={toggleAvailability}
                className={`w-9 h-5 rounded-full transition-colors relative ${isAvailable ? 'bg-green-400' : 'bg-white/20'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isAvailable ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-0.5 mt-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-white/15 text-white' : 'text-white/55 hover:bg-white/8 hover:text-white/80'}`
              }
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Provider profile quick-view */}
        <div className="mx-3 mb-2 mt-1">
          <NavLink to="/availability" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 bg-white/8 hover:bg-white/12 rounded-xl px-3 py-2.5 transition group">
            <Clock className="w-4 h-4 text-white/50 group-hover:text-white/80" />
            <span className="text-xs text-white/60 group-hover:text-white/80 font-medium">Set Availability</span>
            <ChevronRight className="w-3 h-3 ml-auto text-white/30" />
          </NavLink>
        </div>

        <div className="px-2 pb-4">
          <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-white/45 hover:bg-white/8 hover:text-white/70 w-full transition-colors">
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 lg:px-5 h-13 flex items-center justify-between sticky top-0 z-30">
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="hidden lg:block" />
          <NavLink to="/profile" className="flex items-center gap-2.5 hover:opacity-80">
            {profilePic ? (
              <img src={profilePic} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center text-sm font-bold">
                {user?.first_name?.[0] || 'P'}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.first_name || 'Provider'}</p>
              <p className="text-[10px] text-gray-400 leading-tight">Provider</p>
            </div>
          </NavLink>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 lg:p-6 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
