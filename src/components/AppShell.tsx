'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Sparkles, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Library, 
  CreditCard, 
  ShieldAlert, 
  Menu, 
  X, 
  LogOut, 
  User, 
  ChevronDown,
  RefreshCw
} from 'lucide-react';

import { useLanguage } from './LanguageContext';

interface AppShellProps {
  children: React.ReactNode;
}

interface UserSession {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  plan: string;
  creditBalance: number;
}

export default function AppShell({ children }: AppShellProps) {
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshingCredits, setRefreshingCredits] = useState(false);

  // Fetch session on load
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        // Redirect to login if not public landing pages
        if (pathname !== '/' && pathname !== '/login' && pathname !== '/signup') {
          router.push('/login');
        }
      }
    } catch (err) {
      console.error('Error fetching session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  // Expose a global event listener so child components can request credit sync
  useEffect(() => {
    const handleSync = () => {
      setRefreshingCredits(true);
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          if (data.user) setCurrentUser(data.user);
          setRefreshingCredits(false);
        })
        .catch(() => setRefreshingCredits(false));
    };

    window.addEventListener('sync-credits', handleSync);
    return () => window.removeEventListener('sync-credits', handleSync);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const handleSwitchUser = async (email: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setIsUserDropdownOpen(false);
        window.dispatchEvent(new Event('sync-credits'));
        router.refresh();
      }
    } catch (err) {
      console.error('Error switching user:', err);
    }
  };

  // Nav items list
  const navItems = [
    { name: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { name: t('characterStudio'), path: '/characters', icon: Sparkles },
    { name: t('sceneComposer'), path: '/scene-composer', icon: ImageIcon },
    { name: t('videoStudio'), path: '/video-studio', icon: VideoIcon },
    { name: t('assetLibrary'), path: '/library', icon: Library },
    { name: t('billingCredits'), path: '/billing', icon: CreditCard },
  ];

  // If public pages, render content directly
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup';

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-violet-500 animate-spin"></div>
          <p className="text-gray-400 font-medium animate-pulse">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-gray-100 flex flex-col md:flex-row">
      
      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#12121a]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-500 animate-pulse-slow" />
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
            AI Influencer Studio
          </span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-1 rounded-md text-gray-400 hover:text-white"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* SIDEBAR NAVIGATION */}
      <aside className={`
        fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex-shrink-0 z-40
        w-64 bg-[#12121a]/80 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
      `}>
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="hidden md:flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-violet-500 animate-pulse-slow" />
            <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400">
              Influencer AI
            </span>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive 
                      ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-100 border border-transparent'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}

            {/* Admin link (Always shown in local mode for review) */}
            <Link
              href="/admin"
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 mt-4
                ${pathname === '/admin'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                  : 'text-gray-500 hover:bg-red-950/10 hover:text-red-300 border border-transparent'
                }
              `}
            >
              <ShieldAlert className="w-4 h-4" />
              {t('adminSettings')}
            </Link>
          </nav>
        </div>

        {/* User profile section */}
        {currentUser && (
          <div className="relative mt-8 border-t border-white/5 pt-4">
            <button 
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  className="w-9 h-9 rounded-full border border-violet-500/20"
                />
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate leading-tight">{currentUser.name}</p>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">{currentUser.plan} account</span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1" />
            </button>

            {/* Switch User / Logout Dropdown */}
            {isUserDropdownOpen && (
              <div className="absolute bottom-14 left-0 w-full bg-[#181824] border border-white/10 rounded-lg shadow-xl py-2 z-50 animate-slide-up">
                <div className="px-3 py-1.5 border-b border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold">{t('switchAccount')}</p>
                </div>
                <button 
                  onClick={() => handleSwitchUser('user@example.com')}
                  className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center justify-between"
                >
                  <span>Creator User</span>
                  {currentUser.email === 'user@example.com' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                </button>
                <button 
                  onClick={() => handleSwitchUser('admin@ai-influencer.studio')}
                  className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white flex items-center justify-between"
                >
                  <span>Admin User</span>
                  {currentUser.email === 'admin@ai-influencer.studio' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                </button>
                <div className="border-t border-white/5 my-1" />
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOPBAR */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[#12121a]/30 border-b border-white/5 backdrop-blur-md sticky top-0 z-30">
          <div>
            <h1 className="font-bold text-lg capitalize">
              {pathname === '/dashboard' ? t('dashboard') :
               pathname === '/characters' ? t('characterStudio') :
               pathname === '/scene-composer' ? t('sceneComposer') :
               pathname === '/video-studio' ? t('videoStudio') :
               pathname === '/library' ? t('assetLibrary') :
               pathname === '/billing' ? t('billingCredits') :
               pathname === '/admin' ? t('adminSettings') : t('studio')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5 shadow-inner">
              <button 
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all duration-150 ${language === 'en' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                🇬🇧 EN
              </button>
              <button 
                type="button"
                onClick={() => setLanguage('id')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all duration-150 ${language === 'id' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                🇮🇩 ID
              </button>
            </div>

            {/* Live credits tracker */}
            {currentUser && (
              <div className="flex items-center gap-2.5 bg-violet-950/20 border border-violet-500/20 px-4.5 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-violet-300">
                  {currentUser.creditBalance} {t('credits')}
                </span>
                <button 
                  onClick={() => window.dispatchEvent(new Event('sync-credits'))}
                  disabled={refreshingCredits}
                  className="p-0.5 text-gray-500 hover:text-violet-400 transition-colors disabled:animate-spin"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <Link 
                  href="/billing"
                  className="text-[10px] bg-violet-600/30 text-violet-200 px-2 py-0.5 rounded-full hover:bg-violet-600 transition-colors font-bold uppercase"
                >
                  {t('buy')}
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* RENDER PAGES */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
