'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });

      const data = await res.json();
      if (res.ok) {
        window.dispatchEvent(new Event('sync-credits'));
        router.push('/dashboard');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err: any) {
      setError('Connection failed. Please try again.');
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
            <Sparkles className="w-6 h-6 text-violet-500 animate-pulse-slow" />
          </div>
          <h2 className="font-extrabold text-2xl text-white mt-2">Create Account</h2>
          <p className="text-sm text-gray-400">Get 100 free credits immediately</p>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* SIGNUP FORM */}
        <form onSubmit={handleSignupSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
              className="glass-input text-sm"
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@creator.com"
              required
              className="glass-input text-sm"
              disabled={loading}
            />
          </div>

          <button 
            type="submit"
            disabled={loading || !name || !email}
            className="w-full mt-2 py-3 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/40 text-white flex items-center justify-center gap-2 transition-all btn-glow"
          >
            {loading ? 'Creating account...' : 'Start Creating'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:underline font-bold">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
