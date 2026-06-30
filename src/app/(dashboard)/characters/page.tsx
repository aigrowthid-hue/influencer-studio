'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  ChevronRight, 
  User, 
  Loader2, 
  Info,
  Clock,
  Upload,
  X,
  ChevronDown
} from 'lucide-react';
import buildCharacterSheetPrompt from '@/lib/prompt-builders/character-sheet-builder';
import { Character, CharacterProfile } from '@/types';

const INITIAL_PROFILE: CharacterProfile = {
  gender: 'Female',
  ageRange: '20-25 years old',
  visualOrigin: 'East Asian',
  faceShape: 'Oval',
  skinTone: 'Fair with warm undertones',
  bodyType: 'Slim and fit',
  height: 'Average height',
  personalityVibe: 'Friendly and trendy',
  niche: 'Beauty and Skincare Creator',
  eyeShape: 'Almond eyes, dark brown color',
  noseShape: 'Straight, refined nose shape',
  lips: 'Natural lips with pink gloss',
  eyebrows: 'Neat, soft arch eyebrows',
  cheekbones: 'Soft cheekbones',
  jawline: 'Soft, delicate jawline',
  skinDetail: 'Visible pores, clear skin, natural glow',
  hairLength: 'Long hair',
  hairColor: 'Black',
  hairStyle: 'Soft curls, parted down the middle',
  bangs: 'None',
  hairTexture: 'Silky hair texture',
  hairStrands: 'Natural hair strands with flyaways',
  topOutfit: '',
  bottomOutfit: '',
  shoes: '',
  accessories: '',
  colorPalette: '',
  styleVibe: '',
  glasses: '',
  earrings: 'Small silver hoop earrings',
  tattoo: '',
  mole: 'Small beauty mark under left eye',
  scar: '',
  bracelet: '',
  watch: '',
  signatureItem: '',
  referenceImageUrl: ''
};

import { useLanguage } from '@/components/LanguageContext';

export default function CharacterStudio() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  
  // Creation Form State
  const [isCreating, setIsCreating] = useState(false);
  const [charName, setCharName] = useState('');
  const [charNiche, setCharNiche] = useState('Beauty');
  const [activeTab, setActiveTab] = useState<'basic' | 'facial' | 'hair' | 'unique'>('basic');
  const [profile, setProfile] = useState<CharacterProfile>(INITIAL_PROFILE);
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [creationMethod, setCreationMethod] = useState<'generate' | 'upload_sheet'>('generate');
  const [uploadedSheetUrl, setUploadedSheetUrl] = useState<string | null>(null);
  
  // Generation State
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');
  const [activeGenId, setActiveGenId] = useState<string | null>(null);

  // Load saved characters
  const loadCharacters = async () => {
    try {
      const res = await fetch('/api/characters');
      const data = await res.json();
      if (res.ok) {
        setCharacters(data.characters || []);
      }
    } catch (err) {
      console.error('Error loading characters:', err);
    } finally {
      setLoadingCharacters(false);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, []);

  // Update profile attributes helper
  const updateProfileField = (key: keyof CharacterProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Generate dynamic live prompt preview
  const livePrompts = buildCharacterSheetPrompt(profile, selectedStyle);

  // Step wizard tab lists
  const tabNames = [
    { key: 'basic', label: t('stepBasic') },
    { key: 'facial', label: t('stepFacial') },
    { key: 'hair', label: t('stepHair') },
    { key: 'unique', label: t('stepUnique') }
  ];

  // Start generation pipeline
  const handleGenerateSheet = async () => {
    if (!charName.trim()) {
      alert(language === 'en' ? 'Please provide a name for your character!' : 'Harap masukkan nama untuk karakter Anda!');
      return;
    }

    setGenerating(true);
    setGenStatus('Deducting credits...');
    
    try {
      // 1. Create character draft in DB
      const draftRes = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: charName,
          niche: charNiche,
          profileJson: profile
        })
      });

      const draftData = await draftRes.json();
      if (!draftRes.ok) throw new Error(draftData.error || 'Failed to create character draft');

      const characterId = draftData.character.id;
      setGenStatus('Queueing generation job (10 credits)...');

      // 2. Call generation endpoint
      const genRes = await fetch('/api/generate/character-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          style: selectedStyle
        })
      });

      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || 'Failed to generate character sheet');

      // Sync credits
      window.dispatchEvent(new Event('sync-credits'));
      setGenStatus('Rendering multi-angle sheets...');
      
      // Simulate polling/completion rendering
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGenerating(false);
      setIsCreating(false);
      setCharName('');
      loadCharacters(); // Reload list
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Generation failed');
      setGenerating(false);
    }
  };

  // Save manual pre-made character sheet upload
  const handleSaveUploadedSheet = async () => {
    if (!charName.trim()) {
      alert(language === 'en' ? 'Please provide a name for your character!' : 'Harap masukkan nama untuk karakter Anda!');
      return;
    }
    if (!uploadedSheetUrl) {
      alert(language === 'en' ? 'Please upload your character sheet!' : 'Harap unggah gambar character sheet Anda!');
      return;
    }

    setGenerating(true);
    setGenStatus(language === 'en' ? 'Saving character profile...' : 'Menyimpan profil karakter...');

    try {
      const draftRes = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: charName,
          niche: charNiche,
          profileJson: profile,
          characterSheetUrl: uploadedSheetUrl,
          status: 'completed'
        })
      });

      const draftData = await draftRes.json();
      if (!draftRes.ok) throw new Error(draftData.error || 'Failed to save character profile');

      setGenerating(false);
      setIsCreating(false);
      setCharName('');
      setUploadedSheetUrl(null);
      loadCharacters(); // Reload list
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Saving failed');
      setGenerating(false);
    }
  };

  const handleDeleteCharacter = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const confirmMessage = language === 'en' 
      ? 'Are you sure you want to delete this character? All generated scene images and assets associated will be lost.'
      : 'Apakah Anda yakin ingin menghapus karakter ini? Semua gambar scene dan aset terkait akan hilang.';
    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/characters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadCharacters();
      }
    } catch (err) {
      console.error('Failed to delete character:', err);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" /> {t('characterStudio')}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'en' 
              ? 'Design and manage consistent AI influencer profiles.' 
              : 'Desain dan kelola profil influencer AI yang konsisten.'}
          </p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => {
              setCharName('');
              setCharNiche('Beauty');
              setProfile({ ...INITIAL_PROFILE });
              setSelectedStyle('realistic');
              setShowPromptPreview(false);
              setCreationMethod('generate');
              setUploadedSheetUrl(null);
              setIsCreating(true);
            }}
            className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 transition-all btn-glow"
          >
            <Plus className="w-4 h-4" /> {t('newInfluencer')}
          </button>
        )}
      </div>

      {/* CHARACTER WIZARD FORM (CREATION MODE) */}
      {isCreating && (
        <div className="grid lg:grid-cols-12 gap-8 animate-slide-up">
          
          {/* Left panel: multi-step form */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Form Header (Name and Niche) */}
            <div className="glass-panel p-6 border-white/5 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('charNameLabel')}</label>
                <input 
                  type="text" 
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  placeholder="e.g. Luna Ross, Yolanda"
                  className="glass-input text-sm font-semibold text-white"
                  disabled={generating}
                />
              </div>
              <div className="w-full sm:w-64 flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('nicheLabel')}</label>
                <select 
                  value={charNiche}
                  onChange={(e) => setCharNiche(e.target.value)}
                  className="glass-input text-sm font-semibold text-white"
                  disabled={generating}
                >
                  <option value="Beauty">{language === 'en' ? 'Beauty & Cosmetics' : 'Kecantikan & Kosmetik'}</option>
                  <option value="Fitness">{language === 'en' ? 'Fitness & Wellness' : 'Kebugaran & Kesehatan'}</option>
                  <option value="Modest Fashion">{language === 'en' ? 'Modest Fashion / Hijab' : 'Busana Santun / Hijab'}</option>
                  <option value="Tech Reviewer">{language === 'en' ? 'Tech & Gadgets' : 'Teknologi & Gadget'}</option>
                  <option value="Travel Vlog">{language === 'en' ? 'Travel & Adventure' : 'Perjalanan & Petualangan'}</option>
                </select>
              </div>
            </div>

            {/* Tab Navigator */}
            <div className="flex border-b border-white/5 overflow-x-auto pb-px">
              {tabNames.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`
                    px-5 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors
                    ${activeTab === tab.key 
                      ? 'border-violet-500 text-violet-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                    }
                  `}
                  disabled={generating}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content panel */}
            <div className="glass-panel p-6 border-white/5 min-h-[300px]">
              
              {/* TAB 1: BASIC IDENTITY */}
              {activeTab === 'basic' && (
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('genderLabel')}</label>
                    <input type="text" value={profile.gender} onChange={(e) => updateProfileField('gender', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('ageLabel')}</label>
                    <input type="text" value={profile.ageRange} onChange={(e) => updateProfileField('ageRange', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('originLabel')}</label>
                    <input type="text" value={profile.visualOrigin} onChange={(e) => updateProfileField('visualOrigin', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('faceShapeLabel')}</label>
                    <input type="text" value={profile.faceShape} onChange={(e) => updateProfileField('faceShape', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('skinToneLabel')}</label>
                    <input type="text" value={profile.skinTone} onChange={(e) => updateProfileField('skinTone', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('bodyTypeLabel')}</label>
                    <input type="text" value={profile.bodyType} onChange={(e) => updateProfileField('bodyType', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2 border-t border-white/5 pt-4 mt-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-violet-400" /> {t('uploadRefPhoto')}
                    </label>
                    <p className="text-[10px] text-gray-500">{t('uploadRefPhotoDesc')}</p>
                    
                    {profile.referenceImageUrl ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/10 mt-2 bg-black/40">
                        <img src={profile.referenceImageUrl} alt="Character Reference" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => updateProfileField('referenceImageUrl', '')} 
                          className="absolute top-1.5 right-1.5 p-1 bg-black/75 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer border border-dashed border-white/10 hover:border-violet-500/50 p-6 rounded-lg text-center flex flex-col items-center justify-center gap-2 bg-black/20 hover:bg-violet-950/5 transition-all mt-2 group">
                        <Upload className="w-6 h-6 text-gray-500 group-hover:text-violet-400 transition-colors" />
                        <span className="text-xs font-bold text-gray-400">{t('uploadButtonText')}</span>
                        <span className="text-[10px] text-gray-500">{t('uploadFileTypes')}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              updateProfileField('referenceImageUrl', reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }} 
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: FACIAL DETAILS */}
              {activeTab === 'facial' && (
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('eyeShapeLabel')}</label>
                    <input type="text" value={profile.eyeShape} onChange={(e) => updateProfileField('eyeShape', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('noseShapeLabel')}</label>
                    <input type="text" value={profile.noseShape} onChange={(e) => updateProfileField('noseShape', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('lipsLabel')}</label>
                    <input type="text" value={profile.lips} onChange={(e) => updateProfileField('lips', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('jawlineLabel')}</label>
                    <input type="text" value={profile.jawline} onChange={(e) => updateProfileField('jawline', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('skinDetailLabel')}</label>
                    <input type="text" value={profile.skinDetail} onChange={(e) => updateProfileField('skinDetail', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                </div>
              )}

              {/* TAB 3: HAIR DETAILS */}
              {activeTab === 'hair' && (
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('hairLengthLabel')}</label>
                    <input type="text" value={profile.hairLength} onChange={(e) => updateProfileField('hairLength', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('hairColorLabel')}</label>
                    <input type="text" value={profile.hairColor} onChange={(e) => updateProfileField('hairColor', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('hairStyleLabel')}</label>
                    <input type="text" value={profile.hairStyle} onChange={(e) => updateProfileField('hairStyle', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('hairTextureLabel')}</label>
                    <input type="text" value={profile.hairTexture} onChange={(e) => updateProfileField('hairTexture', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                </div>
              )}

              {/* Tab 4: Outfit Default removed */}

              {/* TAB 5: UNIQUE MARKERS */}
              {activeTab === 'unique' && (
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('glassesLabel')}</label>
                    <input type="text" value={profile.glasses} onChange={(e) => updateProfileField('glasses', e.target.value)} placeholder="e.g. Round tortoise frames" className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('earringsLabel')}</label>
                    <input type="text" value={profile.earrings} onChange={(e) => updateProfileField('earrings', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('tattooLabel')}</label>
                    <input type="text" value={profile.tattoo} onChange={(e) => updateProfileField('tattoo', e.target.value)} placeholder="e.g. Small minimalist rose on wrist" className="glass-input text-sm" disabled={generating} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">{t('moleLabel')}</label>
                    <input type="text" value={profile.mole} onChange={(e) => updateProfileField('mole', e.target.value)} className="glass-input text-sm" disabled={generating} />
                  </div>
                </div>
              )}

            </div>

            {/* Back action */}
            <div className="flex gap-3">
              <button 
                onClick={() => setIsCreating(false)}
                className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"
                disabled={generating}
              >
                {t('cancel')}
              </button>
            </div>
          </div>

          {/* Right panel: Live prompt building and trigger */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Live Prompt Settings */}
            <div className="glass-panel p-6 border-white/5 flex flex-col gap-4">

              {/* Method Selector */}
              <div className="flex bg-black/40 border border-white/5 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCreationMethod('generate')}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                    creationMethod === 'generate'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  disabled={generating}
                >
                  {language === 'en' ? 'Generate AI Sheet' : 'Generate Sheet AI'}
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMethod('upload_sheet')}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                    creationMethod === 'upload_sheet'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  disabled={generating}
                >
                  {language === 'en' ? 'Upload Own Sheet' : 'Unggah Sheet Sendiri'}
                </button>
              </div>

              {/* Mode 1: AI Prompt Preview */}
              {creationMethod === 'generate' && (
                <>
                  <div className="flex flex-col gap-1.5 mt-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">{t('aestheticStyleLabel')}</label>
                    <select 
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="glass-input text-xs"
                      disabled={generating}
                    >
                      <option value="realistic">{t('smartphonePhoto')}</option>
                      <option value="editorial">{t('studioEditorial')}</option>
                      <option value="candid">{t('socialMediaPost')}</option>
                    </select>
                  </div>

                  {/* Advanced Prompt Preview Accordion */}
                  <div className="border-t border-white/5 pt-4 mt-1 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPromptPreview(!showPromptPreview)}
                      className="flex items-center justify-between text-[11px] font-bold text-gray-400 hover:text-white transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        <span>Advanced Prompt Preview</span>
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showPromptPreview ? 'rotate-180' : ''}`} />
                    </button>

                    {showPromptPreview && (
                      <div className="flex flex-col gap-3 mt-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] uppercase font-bold text-violet-400 tracking-wider">System Instructions</span>
                          <pre className="text-[9px] bg-black/40 p-2.5 rounded border border-white/5 font-mono text-gray-400 leading-relaxed whitespace-pre-wrap">
                            {livePrompts.finalPrompt.split('[REFERENCE_INSTRUCTION]')[0].trim()}
                          </pre>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] uppercase font-bold text-violet-400 tracking-wider">Formulated Prompt Details</span>
                          <pre className="text-[9px] bg-black/40 p-2.5 rounded border border-white/5 font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {livePrompts.finalPrompt.includes('[REFERENCE_INSTRUCTION]') 
                              ? livePrompts.finalPrompt.substring(livePrompts.finalPrompt.indexOf('[REFERENCE_INSTRUCTION]')).trim()
                              : livePrompts.finalPrompt.trim()}
                          </pre>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] uppercase font-bold text-red-400 tracking-wider">Negative Constraints</span>
                          <pre className="text-[9px] bg-black/40 p-2.5 rounded border border-white/5 font-mono text-red-300/80 leading-relaxed whitespace-pre-wrap">
                            {livePrompts.negativePrompt}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Mode 2: Upload Character Sheet Zone */}
              {creationMethod === 'upload_sheet' && (
                <div className="flex flex-col gap-3 border-t border-white/5 pt-4 mt-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">
                    {language === 'en' ? 'Upload 3x3 Character Sheet Image' : 'Unggah Foto Character Sheet 3x3'}
                  </label>
                  {uploadedSheetUrl ? (
                    <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-white/10 bg-black/40">
                      <img src={uploadedSheetUrl} alt="Uploaded Character Sheet" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setUploadedSheetUrl(null)} 
                        className="absolute top-2 right-2 p-1.5 bg-black/75 rounded-full text-gray-400 hover:text-white transition-colors"
                        disabled={generating}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer border border-dashed border-white/10 hover:border-violet-500/50 p-8 rounded-lg text-center flex flex-col items-center justify-center gap-3 bg-black/20 hover:bg-violet-950/5 transition-all group">
                      <Upload className="w-8 h-8 text-gray-500 group-hover:text-violet-400 transition-colors" />
                      <span className="text-xs font-bold text-gray-400">
                        {language === 'en' ? 'Select 3x3 Grid Image' : 'Pilih Gambar Grid 3x3'}
                      </span>
                      <span className="text-[10px] text-gray-500">PNG, JPG up to 10MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setUploadedSheetUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Cost card & Action */}
              <div className="border-t border-white/5 pt-4 mt-1 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-bold bg-violet-600/10 border border-violet-500/20 px-3 py-2.5 rounded-lg">
                  <span className="text-violet-400">{t('generationCost')}</span>
                  <span className="text-violet-300">
                    {creationMethod === 'generate' ? `10 ${t('credits')}` : `0 ${t('credits')} (${language === 'en' ? 'Free upload' : 'Unggah gratis'})`}
                  </span>
                </div>
                
                <button
                  onClick={creationMethod === 'generate' ? handleGenerateSheet : handleSaveUploadedSheet}
                  disabled={generating || !charName || (creationMethod === 'upload_sheet' && !uploadedSheetUrl)}
                  className="w-full py-3 rounded-lg text-sm font-bold bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/20 text-white flex items-center justify-center gap-2 transition-all btn-glow"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{genStatus}</span>
                    </>
                  ) : (
                    <>
                      {creationMethod === 'generate' ? (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>{t('lockIdentityButton')}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>{language === 'en' ? 'Save & Complete Profile' : 'Simpan & Lengkapi Profil'}</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* CHARACTER LIST DISPLAY */}
      {!isCreating && (
        <>
          {loadingCharacters ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-violet-500 animate-spin"></div>
              <p className="text-sm text-gray-500 animate-pulse">{t('loadingBoard')}</p>
            </div>
          ) : characters.length === 0 ? (
            <div className="glass-panel p-16 border-dashed border-white/5 text-center flex flex-col items-center justify-center gap-5">
              <div className="w-14 h-14 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <User className="w-7 h-7 text-violet-400 animate-pulse-slow" />
              </div>
              <div className="max-w-md">
                <h3 className="font-extrabold text-white text-base">{t('createFirstChar')}</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {t('createFirstCharDesc')}
                </p>
              </div>
              <button 
                onClick={() => {
                  setCharName('');
                  setCharNiche('Beauty');
                  setProfile({ ...INITIAL_PROFILE });
                  setSelectedStyle('realistic');
                  setShowPromptPreview(false);
                  setCreationMethod('generate');
                  setUploadedSheetUrl(null);
                  setIsCreating(true);
                }}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-lg transition-all btn-glow"
              >
                {t('createCharProfile')}
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {characters.map((char) => (
                <div 
                  key={char.id} 
                  className="glass-panel border-white/5 overflow-hidden group flex flex-col justify-between"
                >
                  {/* Visual Reference Header */}
                  <div className="aspect-[4/3] w-full bg-black/40 relative overflow-hidden flex items-center justify-center border-b border-white/5">
                    {char.status === 'processing' ? (
                      <div className="absolute inset-0 bg-violet-950/20 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                        <span className="text-[10px] text-violet-400 uppercase font-bold tracking-wider animate-pulse">
                          {t('generatingIdentity')}
                        </span>
                      </div>
                    ) : char.characterSheetUrl ? (
                      <img 
                        src={char.characterSheetUrl} 
                        alt={`${char.name} Character Sheet`} 
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center text-xs text-gray-500 px-4 py-8">
                        {t('noCharactersYet')}
                        <button 
                          onClick={async () => {
                            setGenerating(true);
                            setCharName(char.name);
                            setProfile(char.profileJson);
                            setIsCreating(true);
                          }}
                          className="block mt-2 mx-auto text-violet-400 font-bold hover:underline"
                        >
                          {t('generateSheetCost')}
                        </button>
                      </div>
                    )}

                    {/* Delete button */}
                    <button 
                      onClick={(e) => handleDeleteCharacter(char.id, e)}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 text-gray-400 hover:text-red-400 transition-colors z-20 backdrop-blur-md opacity-0 group-hover:opacity-100 border border-white/10"
                      title={t('delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Character details footer */}
                  <div className="p-5 flex flex-col gap-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-base text-white leading-tight">{char.name}</h3>
                        <span className="text-[9px] uppercase font-extrabold tracking-widest text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/10">
                          {char.niche}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                        {char.profileJson.gender}, {char.profileJson.ageRange}. Styling Vibe: {char.profileJson.styleVibe}. Hair: {char.profileJson.hairLength} {char.profileJson.hairColor}.
                      </p>
                    </div>

                    <div className="flex gap-2.5 border-t border-white/5 pt-4">
                      {char.status === 'completed' && (
                        <Link 
                          href={{
                            pathname: '/scene-composer',
                            query: { characterId: char.id }
                          }}
                          className="flex-1 py-2 rounded-lg bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white border border-violet-500/20 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all duration-150"
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> {t('composeSceneCost')}
                        </Link>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}
