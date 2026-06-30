'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, UserCheck, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        // Force sync events and navigate
        window.dispatchEvent(new Event('sync-credits'));
        router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err: any) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail })
      });

      const data = await res.json();
      if (res.ok) {
        window.dispatchEvent(new Event('sync-credits'));
        router.push('/dashboard');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] flex items-center justify-center p-6 relative">
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-violet-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* Back button */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-200 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back Home
      </Link>

      <div className="w-full max-w-md bg-[#12121a]/70 border border-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl animate-scale-up">
        {/* LOGO */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-violet-500" />
          </div>
          <h2 className="font-extrabold text-2xl text-white mt-2">Welcome Back</h2>
          <p className="text-sm text-gray-400">Sign in to manage your AI influencers</p>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. creative@agency.com"
              required
              className="glass-input text-sm"
              disabled={loading}
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !email}
            className="w-full mt-2 py-3 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/40 text-white flex items-center justify-center gap-2 transition-all btn-glow"
          >
            {loading ? 'Entering Studio...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-violet-400 hover:underline font-bold">
            Sign Up Free
          </Link>
        </div>

        {/* DEMO QUICK BUTTONS */}
        <div className="mt-8 border-t border-white/5 pt-6">
          <p className="text-center text-[10px] text-gray-500 uppercase tracking-widest font-extrabold mb-4">
            Quick Demo Login (Recommended)
          </p>
          <div className="flex flex-col gap-2.5">
            <button 
              onClick={() => handleQuickDemoLogin('user@example.com')}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-violet-950/20 hover:bg-violet-950/40 border border-violet-500/20 text-xs font-semibold text-violet-300 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-violet-400" />
                <span>Creative Marketer (User Profile)</span>
              </div>
              <span className="text-[10px] text-violet-400/80 bg-violet-500/10 px-2 py-0.5 rounded-full font-bold">250 Creds</span>
            </button>
            
            <button 
              onClick={() => handleQuickDemoLogin('admin@ai-influencer.studio')}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-red-950/10 hover:bg-red-950/20 border border-red-500/10 text-xs font-semibold text-red-300 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>System Administrator</span>
              </div>
              <span className="text-[10px] text-red-400/80 bg-red-500/10 px-2 py-0.5 rounded-full font-bold">10k Creds</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
