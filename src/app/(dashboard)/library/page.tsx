'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Library as LibraryIcon, 
  Sparkles, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Download, 
  Search,
  ExternalLink,
  ChevronRight,
  FolderHeart
} from 'lucide-react';
import { Character, Generation } from '@/types';

export default function AssetLibrary() {
  const [activeTab, setActiveTab] = useState<'all' | 'characters' | 'images' | 'videos'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLibrary = async () => {
    try {
      // Fetch characters
      const charRes = await fetch('/api/characters');
      const charData = await charRes.json();
      setCharacters(charData.characters || []);

      // Fetch generations
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      const user = sessionData.user;

      const adminRes = await fetch('/api/admin');
      const adminData = await adminRes.json();
      const userGens = (adminData.generations || []).filter(
        (g: any) => g.userId === user.id && g.status === 'completed'
      );
      
      setGenerations(userGens);
    } catch (err) {
      console.error('Error fetching library data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-violet-500 animate-spin"></div>
        <p className="text-sm text-gray-500 animate-pulse font-medium">Syncing library files...</p>
      </div>
    );
  }

  // Filter lists based on tab and search
  const filteredChars = characters.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.niche.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredImages = generations.filter(g => 
    g.type === 'scene_image' && 
    g.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = generations.filter(g => 
    g.type === 'video' && 
    g.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LibraryIcon className="w-5 h-5 text-violet-500" /> Asset Library
          </h2>
          <p className="text-xs text-gray-500 mt-1">Review all character visual models, composed images, and animations.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search assets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-9 text-xs w-full py-2"
          />
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex border-b border-white/5 overflow-x-auto pb-px gap-1">
        {['all', 'characters', 'images', 'videos'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`
              px-5 py-3 border-b-2 text-xs font-semibold uppercase tracking-wider transition-colors
              ${activeTab === tab 
                ? 'border-violet-500 text-violet-400 font-bold' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* RENDER LISTS */}
      <div className="flex flex-col gap-6">
        
        {/* SECTION 1: CHARACTERS (visible if all or characters active) */}
        {(activeTab === 'all' || activeTab === 'characters') && filteredChars.length > 0 && (
          <div className="flex flex-col gap-4">
            {activeTab === 'all' && (
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" /> AI Influencer Profiles ({filteredChars.length})
              </h3>
            )}
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredChars.map((char) => (
                <div key={char.id} className="glass-panel border-white/5 overflow-hidden flex flex-col justify-between group">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-black/40 relative">
                    <img src={char.characterSheetUrl} alt={char.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                    <span className="absolute top-3 left-3 text-[9px] uppercase font-bold tracking-widest bg-violet-600/30 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full">
                      {char.niche}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-white leading-tight">{char.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wide">ID: {char.id.substring(0, 9)}</p>
                    </div>
                    <Link 
                      href={{
                        pathname: '/scene-composer',
                        query: { characterId: char.id }
                      }}
                      className="w-full py-2 bg-violet-600/10 hover:bg-violet-600 border border-violet-500/20 hover:text-white rounded-lg text-[10px] font-bold text-center text-violet-400 flex items-center justify-center gap-1 transition-all duration-150"
                    >
                      Compose Scene <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: IMAGES (visible if all or images active) */}
        {(activeTab === 'all' || activeTab === 'images') && filteredImages.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-white/5 pt-6 mt-4 first:border-0 first:pt-0 first:mt-0">
            {activeTab === 'all' && (
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> Composed Scene Images ({filteredImages.length})
              </h3>
            )}
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredImages.map((img) => (
                <div key={img.id} className="glass-panel border-white/5 overflow-hidden flex flex-col justify-between group relative">
                  <div className="aspect-square w-full bg-black/40 relative overflow-hidden flex items-center justify-center">
                    <img src={img.outputUrl || ''} alt="Composition output" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                    
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                      <a 
                        href={img.outputUrl || ''} 
                        download={`scene-${img.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <Link 
                        href={{
                          pathname: '/video-studio',
                          query: { imageId: img.id }
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-violet-600 text-white hover:bg-violet-500 font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <VideoIcon className="w-3.5 h-3.5" /> Animate
                      </Link>
                    </div>
                  </div>
                  <div className="p-4 border-t border-white/5 flex flex-col gap-1.5">
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed italic">
                      "{img.prompt}"
                    </p>
                    <div className="flex justify-between text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-wide">
                      <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                      <span>ID: {img.id.substring(0, 9)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: VIDEOS (visible if all or videos active) */}
        {(activeTab === 'all' || activeTab === 'videos') && filteredVideos.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-white/5 pt-6 mt-4 first:border-0 first:pt-0 first:mt-0">
            {activeTab === 'all' && (
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <VideoIcon className="w-3.5 h-3.5 text-pink-400" /> Video Animations ({filteredVideos.length})
              </h3>
            )}
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredVideos.map((vid) => (
                <div key={vid.id} className="glass-panel border-white/5 overflow-hidden flex flex-col justify-between group relative">
                  <div className="aspect-[9/16] w-full bg-black/40 overflow-hidden relative flex items-center justify-center">
                    <video 
                      src={vid.outputUrl || ''} 
                      controls={false}
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    
                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 z-10">
                      <a 
                        href={vid.outputUrl || ''} 
                        download={`video-${vid.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <a 
                        href={vid.outputUrl || ''} 
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-violet-600 rounded-full text-white hover:bg-violet-500 transition-colors"
                        title="View Full Screen"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  <div className="p-4 border-t border-white/5 flex flex-col gap-1.5">
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed italic">
                      "{vid.prompt}"
                    </p>
                    <div className="flex justify-between text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-wide">
                      <span>{new Date(vid.createdAt).toLocaleDateString()}</span>
                      <span>ID: {vid.id.substring(0, 9)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for search/filters */}
        {((activeTab === 'characters' && filteredChars.length === 0) ||
          (activeTab === 'images' && filteredImages.length === 0) ||
          (activeTab === 'videos' && filteredVideos.length === 0) ||
          (activeTab === 'all' && filteredChars.length === 0 && filteredImages.length === 0 && filteredVideos.length === 0)) && (
          <div className="glass-panel p-16 border-dashed border-white/5 text-center flex flex-col items-center justify-center gap-4">
            <FolderHeart className="w-12 h-12 text-gray-600" />
            <h4 className="font-extrabold text-white text-base">No assets found</h4>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
              We couldn't find any assets matching the criteria. Try clearing search or generate new materials.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
