'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FolderHeart, 
  TrendingUp, 
  ArrowRight,
  Download,
  Flame
} from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

interface Stats {
  charactersCount: number;
  imagesCount: number;
  videosCount: number;
  credits: number;
}

interface RecentGen {
  id: string;
  type: string;
  outputUrl: string;
  prompt: string;
  createdAt: string;
  status: string;
}

export default function Dashboard() {
  const { language, t } = useLanguage();
  const [stats, setStats] = useState<Stats>({ charactersCount: 0, imagesCount: 0, videosCount: 0, credits: 0 });
  const [recentGens, setRecentGens] = useState<RecentGen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch session for credits
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        const user = sessionData.user;

        // Fetch characters
        const charRes = await fetch('/api/characters');
        const charData = await charRes.json();

        // Load all generations from admin endpoint or user specific libraries
        const creditsRes = await fetch('/api/credits');
        const creditsData = await creditsRes.json();

        // Resolve all generations for current user
        const adminRes = await fetch('/api/admin');
        const adminData = await adminRes.json();

        const userGens = (adminData.generations || []).filter((g: any) => g.userId === user.id);
        
        const charsCount = charData.characters?.length || 0;
        const imagesCount = userGens.filter((g: any) => g.type === 'scene_image' && g.status === 'completed').length;
        const videosCount = userGens.filter((g: any) => g.type === 'video' && g.status === 'completed').length;

        setStats({
          charactersCount: charsCount,
          imagesCount,
          videosCount,
          credits: user?.creditBalance || 0
        });

        // Get 6 most recent completed assets
        const sortedGens = userGens
          .filter((g: any) => g.status === 'completed' && g.outputUrl)
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6);

        setRecentGens(sortedGens);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-violet-500 animate-spin"></div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* HERO BANNER CARD */}
      <section className="glass-panel p-8 md:p-10 border-violet-500/10 bg-gradient-to-r from-violet-950/15 via-[#12121a]/90 to-blue-950/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {t('activeInfluencers')}
            </h2>
            <p className="text-gray-400 mt-2 text-sm leading-relaxed">
              {t('createCharDesc')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Link 
              href="/characters"
              className="px-5 py-3 rounded-lg text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 transition-all btn-glow"
            >
              <Sparkles className="w-3.5 h-3.5" /> {t('createCharProfile')}
            </Link>
            <Link 
              href="/scene-composer"
              className="px-5 py-3 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-200 border border-white/5 flex items-center gap-1.5 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" /> {t('composeSceneCost')}
            </Link>
          </div>
        </div>
      </section>

      {/* STATS COUNT GRID */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat item 1 */}
        <div className="glass-panel p-6 flex items-center justify-between border-white/5 hover:border-violet-500/10 transition-colors">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">{t('characterStudio')}</span>
            <span className="text-3xl font-extrabold text-white mt-1">{stats.charactersCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
        </div>

        {/* Stat item 2 */}
        <div className="glass-panel p-6 flex items-center justify-between border-white/5 hover:border-blue-500/10 transition-colors">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">{t('sceneComposer')}</span>
            <span className="text-3xl font-extrabold text-white mt-1">{stats.imagesCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        {/* Stat item 3 */}
        <div className="glass-panel p-6 flex items-center justify-between border-white/5 hover:border-pink-500/10 transition-colors">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">{t('videoStudio')}</span>
            <span className="text-3xl font-extrabold text-white mt-1">{stats.videosCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <VideoIcon className="w-5 h-5 text-pink-400" />
          </div>
        </div>

        {/* Stat item 4 */}
        <div className="glass-panel p-6 flex items-center justify-between border-white/5 hover:border-amber-500/10 transition-colors">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">{t('creditsBalance')}</span>
            <span className="text-3xl font-extrabold text-white mt-1">{stats.credits}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
        </div>

      </section>

      {/* RECENT GENERATIONS FEED */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-white">{t('recentGenerations')}</h3>
          <Link href="/library" className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1">
            {t('assetLibrary')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentGens.length === 0 ? (
          <div className="glass-panel p-12 text-center border-dashed border-white/5 flex flex-col items-center gap-4 justify-center">
            <FolderHeart className="w-10 h-10 text-gray-600" />
            <div className="max-w-xs">
              <h4 className="font-bold text-white text-sm">{t('noGenerationsYet')}</h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {language === 'en' 
                  ? "You haven't generated any influencer photos or video animations yet."
                  : "Anda belum membuat foto influencer atau animasi video apa pun."}
              </p>
            </div>
            <Link 
              href="/characters"
              className="px-4 py-2 bg-violet-600/20 text-violet-300 hover:bg-violet-600 hover:text-white rounded-lg text-xs font-semibold transition-all border border-violet-500/30"
            >
              {language === 'en' ? 'Get Started' : 'Mulai Sekarang'}
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentGens.map((gen) => {
              const isVideo = gen.type === 'video';
              return (
                <div 
                  key={gen.id} 
                  className="glass-panel border-white/5 overflow-hidden group relative flex flex-col justify-between"
                >
                  {/* Media wrapper */}
                  <div className="aspect-[4/3] w-full overflow-hidden bg-black/40 relative flex items-center justify-center">
                    {isVideo ? (
                      <video 
                        src={gen.outputUrl}
                        controls={false}
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <img 
                        src={gen.outputUrl} 
                        alt="Generation output" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    
                    {/* Hover controls overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 z-10">
                      <a 
                        href={gen.outputUrl} 
                        download={`generation-${gen.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        title="Download Asset"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      
                      {!isVideo && (
                        <Link 
                          href={{
                            pathname: '/video-studio',
                            query: { imageId: gen.id }
                          }}
                          className="px-3.5 py-2 rounded-full bg-violet-600 text-white hover:bg-violet-500 transition-all font-semibold text-xs flex items-center gap-1"
                        >
                          <VideoIcon className="w-3 h-3" /> {t('animateButtonText')}
                        </Link>
                      )}
                    </div>

                    {/* Badge */}
                    <span className={`
                      absolute top-3 left-3 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10
                      ${isVideo ? 'bg-pink-600/30 text-pink-300' : 'bg-blue-600/30 text-blue-300'}
                    `}>
                      {isVideo ? t('videos') : t('sceneComposer')}
                    </span>
                  </div>

                  {/* Caption info */}
                  <div className="p-4 border-t border-white/5 flex flex-col gap-1.5">
                    <p className="text-xs text-gray-400 line-clamp-2 italic leading-relaxed">
                      "{gen.prompt}"
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 mt-1">
                      <span>{new Date(gen.createdAt).toLocaleDateString()}</span>
                      <span>ID: {gen.id.substring(0, 9)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
