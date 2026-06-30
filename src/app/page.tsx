import React from 'react';
import Link from 'next/link';
import { Sparkles, Image as ImageIcon, Video as VideoIcon, ArrowRight, CheckCircle2, UserCheck, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07070a] text-gray-100 selection:bg-violet-600/30">
      
      {/* GLOWING AMBIENT BACKGROUND */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-violet-600/10 to-transparent blur-3xl pointer-events-none" />

      {/* NAVIGATION BAR */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between sticky top-0 bg-[#07070a]/80 backdrop-blur-md z-50 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-violet-500 animate-pulse-slow" />
          <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400">
            AI Influencer Studio
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-lg transition-all btn-glow">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center flex flex-col items-center gap-6 relative z-10">
        <div className="inline-flex items-center gap-2 bg-violet-950/30 border border-violet-500/20 px-4 py-1.5 rounded-full text-xs font-semibold text-violet-300 animate-pulse">
          <Sparkles className="w-3 h-3" /> MVP Live - Experience Instant Mock Generations
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-100 to-gray-400">
          Build Consistent AI Influencers from Scratch
        </h1>
        <p className="text-gray-400 md:text-xl max-w-2xl leading-relaxed">
          Unlock identity locks with Character Sheets, swap them into beautiful custom scenes, and animate photos into high-converting videos. Perfect for brands, UMKM, and agencies.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <Link href="/signup" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-2 transition-all duration-150 btn-glow">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 flex items-center justify-center transition-colors">
            Try Demo Account
          </Link>
        </div>
      </header>

      {/* KEY WORKFLOW STEPS */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Professional Production Pipeline
          </h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            Design a consistent personality, place them in dynamic content scenes, and render social videos in minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <div className="glass-panel p-8 relative flex flex-col gap-5 hover:border-violet-500/20 group">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold text-violet-400 tracking-wider">Step 1</span>
              <h3 className="text-xl font-bold mt-1 text-white">Character Identity Sheet</h3>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                Unlock exact physical features. Generates multi-angle portraits (front, back, 3/4 profiles, details) that serve as a physical lock key.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-panel p-8 relative flex flex-col gap-5 hover:border-blue-500/20 group">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ImageIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold text-blue-400 tracking-wider">Step 2</span>
              <h3 className="text-xl font-bold mt-1 text-white">Scene Composer</h3>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                Take your locked character sheet, inject customized environment description, and swap clothing/poses with upload reference guides.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-panel p-8 relative flex flex-col gap-5 hover:border-pink-500/20 group">
            <div className="w-12 h-12 rounded-xl bg-pink-600/10 border border-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <VideoIcon className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold text-pink-400 tracking-wider">Step 3</span>
              <h3 className="text-xl font-bold mt-1 text-white">Image-to-Video Studio</h3>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                Import generated photos directly. Select motion actions (nodding, speaking, camera zooms) and render dynamic social Reels or Ads.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* PRICING AND CREDITS RULES */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white">Simple, Transparent Pricing</h2>
          <p className="text-gray-400 mt-3">Start with free credits, top up or subscribe when ready.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Free Plan */}
          <div className="glass-panel p-8 flex flex-col justify-between border-white/5">
            <div>
              <h3 className="text-lg font-bold text-white">Free Trial</h3>
              <p className="text-sm text-gray-500 mt-1">Perfect for trying the pipeline</p>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-gray-400 text-sm"> / forever</span>
              </div>
              <ul className="flex flex-col gap-3 text-sm text-gray-300 border-t border-white/5 pt-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> 100 free starting credits</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Mock AI Mode enabled</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Image compositions</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Async video rendering</li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8 block text-center py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold text-sm transition-colors border border-white/10">
              Start Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="glass-panel p-8 flex flex-col justify-between border-violet-500/20 relative shadow-[0_0_30px_rgba(139,92,246,0.1)]">
            <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-violet-600 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
              Popular
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Creator Pro</h3>
              <p className="text-sm text-gray-400 mt-1">For digital marketers & builders</p>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-white">$29</span>
                <span className="text-gray-400 text-sm"> / month</span>
              </div>
              <ul className="flex flex-col gap-3 text-sm text-gray-300 border-t border-white/5 pt-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> 500 monthly credits</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Connect real API Keys</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> High-res OpenAI DALL-E</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Google Veo animation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Watermark removal</li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8 block text-center py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-semibold text-sm transition-all btn-glow">
              Go Pro
            </Link>
          </div>

          {/* Agency Plan */}
          <div className="glass-panel p-8 flex flex-col justify-between border-white/5">
            <div>
              <h3 className="text-lg font-bold text-white">Studio Agency</h3>
              <p className="text-sm text-gray-500 mt-1">For professional marketing scale</p>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-white">$99</span>
                <span className="text-gray-400 text-sm"> / month</span>
              </div>
              <ul className="flex flex-col gap-3 text-sm text-gray-300 border-t border-white/5 pt-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> 2,000 monthly credits</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Advanced batch compose</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Custom provider routes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Team workspace sharing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-violet-400" /> Dedicated API endpoints</li>
              </ul>
            </div>
            <Link href="/signup" className="mt-8 block text-center py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold text-sm transition-colors border border-white/10">
              Select Agency
            </Link>
          </div>

        </div>

        {/* CREDIT COSTS EXPLANATION */}
        <div className="mt-12 p-6 glass-panel border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-violet-400 flex-shrink-0" />
            <p className="text-gray-400 leading-relaxed">
              <strong>MVP Credit Logic:</strong> Deducted upon starting task. Automatically refunds balance instantly if generator fails. <br className="hidden sm:inline" />
              Costs: Character Sheet = <strong>10 credits</strong> | Scene image = <strong>5 credits</strong> | Video = <strong>50 credits</strong>.
            </p>
          </div>
          <Link href="/login" className="text-violet-400 font-bold hover:underline whitespace-nowrap flex items-center gap-1.5">
            Test Drive Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 text-center text-xs text-gray-500">
        <p>© 2026 AI Influencer Studio. All rights reserved. Built as Next.js Fullstack SaaS.</p>
        <div className="flex justify-center gap-6 mt-4">
          <a href="#" className="hover:text-gray-300">Privacy Policy</a>
          <a href="#" className="hover:text-gray-300">Terms of Service</a>
          <a href="#" className="hover:text-gray-300">API Reference</a>
        </div>
      </footer>
    </div>
  );
}
