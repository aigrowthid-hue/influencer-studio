'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Upload, 
  X, 
  Sliders, 
  Loader2, 
  Video as VideoIcon, 
  Download,
  Info,
  ChevronDown,
  Eye
} from 'lucide-react';
import buildScenePrompt from '@/lib/prompt-builders/scene-builder';
import { Character, Generation } from '@/types';

// Wrap the actual SceneComposer in a Suspense boundary for search params
export default function SceneComposerPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-violet-500 animate-spin"></div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">Initializing Scene Composer (rev)...</p>
      </div>
    }>
      <SceneComposerContent />
    </Suspense>
  );
}

import { useLanguage } from '@/components/LanguageContext';

function SceneComposerContent() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCharacterId = searchParams.get('characterId') || '';

  const [characters, setCharacters] = useState<Character[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [selectedCharId, setSelectedCharId] = useState(initialCharacterId);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

  // Form State
  const [sceneDescription, setSceneDescription] = useState('sitting inside a cozy vintage coffee shop in Paris, looking out the window, morning golden hour lighting, holding an espresso cup');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [outputCount, setOutputCount] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeGuide, setActiveGuide] = useState<{ title: string; imagePath: string } | null>(null);

  // Reference Uploads State (Stores base64 string previews)
  const [locationRef, setLocationRef] = useState<string | null>(null);
  const [outfitRef, setOutfitRef] = useState<string | null>(null);
  const [poseRef, setPoseRef] = useState<string | null>(null);
  const [productRef, setProductRef] = useState<string | null>(null);
  const [hasHumanAgreement, setHasHumanAgreement] = useState(false);

  // Advanced Scene Controls
  const [location, setLocation] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('Morning Golden Hour');
  const [weather, setWeather] = useState('Sunny/Clear');
  const [cameraAngle, setCameraAngle] = useState('Eye-level shot');
  const [shotType, setShotType] = useState('Medium close-up shot');
  const [lensStyle, setLensStyle] = useState('50mm portrait prime lens');
  const [lighting, setLighting] = useState('Soft cinematic warm side-lighting');
  const [pose, setPose] = useState('Seated posture, relaxed hands');
  const [expression, setExpression] = useState('Subtle soft smile');
  const [action, setAction] = useState('holding a warm coffee cup');
  const [outfitInstruction, setOutfitInstruction] = useState('Casual modern knit cardigan');
  const [props, setProps] = useState('Espresso coffee cup');
  const [productPlacement, setProductPlacement] = useState('');
  const [realismLevel, setRealismLevel] = useState('photorealistic, natural look');
  const [contentType, setContentType] = useState('instagram lifestyle photo');

  // Generation State
  const [generating, setGenerating] = useState(false);
  const [outputs, setOutputs] = useState<Generation[]>([]);

  // Load characters on mount
  useEffect(() => {
    async function fetchChars() {
      try {
        const res = await fetch('/api/characters');
        const data = await res.json();
        if (res.ok) {
          const list = data.characters || [];
          setCharacters(list);
          // Set default selected character if query parameter matches
          if (initialCharacterId) {
            setSelectedCharId(initialCharacterId);
          } else if (list.length > 0) {
            setSelectedCharId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching characters:', err);
      } finally {
        setLoadingCharacters(false);
      }
    }
    fetchChars();
  }, [initialCharacterId]);

  // Set full selected character model when character ID changes
  useEffect(() => {
    if (selectedCharId) {
      const found = characters.find(c => c.id === selectedCharId);
      setSelectedChar(found || null);
    } else {
      setSelectedChar(null);
    }
  }, [selectedCharId, characters]);

  // Handle local file preview base64 reading
  const handleUploadChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Compile prompt on-the-fly for preview
  const livePrompt = selectedChar 
    ? buildScenePrompt({
        characterProfile: selectedChar.profileJson,
        characterName: selectedChar.name,
        sceneDescription,
        location,
        timeOfDay,
        weather,
        cameraAngle,
        shotType,
        lensStyle,
        lighting,
        pose,
        expression,
        action,
        outfitInstruction,
        props,
        productPlacement,
        realismLevel,
        contentType,
        hasLocationRef: !!locationRef,
        hasOutfitRef: !!outfitRef,
        hasPoseRef: !!poseRef,
        hasProductRef: !!productRef,
        useAdvanced: false
      })
    : null;

  // Run Scene Composition request
  const handleComposeScene = async () => {
    if (!selectedCharId || !selectedChar) {
      alert('Please select an AI influencer first!');
      return;
    }

    if (!selectedChar.profileJson) {
      alert('Identity influencer belum terbaca. Silakan pilih ulang influencer atau cek data karakter.');
      return;
    }

    if (!livePrompt) {
      alert('Gagal merakit prompt scene. Cek data karakter.');
      return;
    }


    if (productRef && !hasHumanAgreement) {
      alert('You must check the agreement box when uploading external assets.');
      return;
    }

    setGenerating(true);
    
    try {
      // Build dynamic fallback identity lock
      const name = selectedChar.name;
      const faceShape = selectedChar.profileJson.faceShape ? `Face Shape: ${selectedChar.profileJson.faceShape}` : 'oval face shape';
      const eyeShape = selectedChar.profileJson.eyeShape ? `Eye Shape: ${selectedChar.profileJson.eyeShape}` : 'almond eyes';
      const nose = selectedChar.profileJson.noseShape ? `Nose: ${selectedChar.profileJson.noseShape}` : 'straight nose';
      const lips = selectedChar.profileJson.lips ? `Lips: ${selectedChar.profileJson.lips}` : 'natural lips';
      const skinTone = selectedChar.profileJson.skinTone ? `Skin Tone: ${selectedChar.profileJson.skinTone}` : 'neutral skin tone';
      const skinTexture = selectedChar.profileJson.skinDetail ? `Skin Texture: ${selectedChar.profileJson.skinDetail}` : 'visible pores, realistic texture';
      const makeupStyle = selectedChar.profileJson.makeupStyle ? `Makeup Style: ${selectedChar.profileJson.makeupStyle}` : 'minimal natural makeup';
      const finalExpression = expression || selectedChar.profileJson.personalityVibe || 'soft friendly expression';
      const hairColor = selectedChar.profileJson.hairColor ? `Hair Color: ${selectedChar.profileJson.hairColor}` : 'dark hair';
      const hairLength = selectedChar.profileJson.hairLength ? `Hair Length: ${selectedChar.profileJson.hairLength}` : 'medium hair';
      const hairstyle = selectedChar.profileJson.hairStyle ? `Hairstyle: ${selectedChar.profileJson.hairStyle}` : 'straight hair';
      const bangs = selectedChar.profileJson.bangs ? `Bangs: ${selectedChar.profileJson.bangs}` : 'no bangs';
      const hairTexture = selectedChar.profileJson.hairTexture ? `Hair Texture: ${selectedChar.profileJson.hairTexture}` : 'fine hair texture';
      const hairDetails = selectedChar.profileJson.hairStrands ? `Hair Details: ${selectedChar.profileJson.hairStrands}` : 'natural hair strands';
      const bodyType = selectedChar.profileJson.bodyType ? `Body Type: ${selectedChar.profileJson.bodyType}` : 'slim fit body';
      const height = selectedChar.profileJson.height ? `Height: ${selectedChar.profileJson.height}` : 'average height';
      const posture = selectedChar.profileJson.posture ? `Posture: ${selectedChar.profileJson.posture}` : 'standing straight';
      const proportion = selectedChar.profileJson.bodyProportion ? `Proportion: ${selectedChar.profileJson.bodyProportion}` : 'natural human proportions';
      const tattoo = selectedChar.profileJson.tattoo ? `Tattoo: ${selectedChar.profileJson.tattoo}` : 'none';
      const mole = selectedChar.profileJson.mole ? `Mole/Freckles: ${selectedChar.profileJson.mole}` : 'none';
      const scar = selectedChar.profileJson.scar ? `Scar: ${selectedChar.profileJson.scar}` : 'none';
      const nailStyle = selectedChar.profileJson.nailStyle ? `Nail Style: ${selectedChar.profileJson.nailStyle}` : 'none';
      const signatureItem = selectedChar.profileJson.signatureItem ? `Signature Detail: ${selectedChar.profileJson.signatureItem}` : 'none';
      const glasses = selectedChar.profileJson.glasses ? `Glasses: ${selectedChar.profileJson.glasses}` : 'none';
      const earrings = selectedChar.profileJson.earrings ? `Earrings: ${selectedChar.profileJson.earrings}` : 'none';
      const bracelet = selectedChar.profileJson.bracelet ? `Bracelet: ${selectedChar.profileJson.bracelet}` : 'none';
      const watch = selectedChar.profileJson.watch ? `Watch: ${selectedChar.profileJson.watch}` : 'none';
      const rings = selectedChar.profileJson.rings ? `Rings: ${selectedChar.profileJson.rings}` : 'none';
      const piercings = selectedChar.profileJson.piercings ? `Piercings: ${selectedChar.profileJson.piercings}` : 'none';
      const bag = selectedChar.profileJson.bag ? `Bag: ${selectedChar.profileJson.bag}` : 'none';
      const necklace = selectedChar.profileJson.necklace ? `Necklace: ${selectedChar.profileJson.necklace}` : 'none';

      const faceDetailsText = `Face Shape: ${faceShape}, Eye Shape: ${eyeShape}, Nose: ${nose}, Lips: ${lips}, Skin Tone: ${skinTone}, Skin Texture: ${skinTexture}, Makeup Style: ${makeupStyle}, Expression: ${finalExpression}`;
      const hairDetailsText = `Hair: ${hairColor}, Length: ${hairLength}, Style: ${hairstyle}, Bangs: ${bangs}, Texture: ${hairTexture}, Details: ${hairDetails}`;
      const bodyDetailsText = `Body Type: ${bodyType}, Height: ${height}, Posture: ${posture}, Proportion: ${proportion}`;
      const uniqueMarkersText = `Unique markers: Glasses: ${glasses}, Earrings: ${earrings}, Tattoo: ${tattoo}, Mole: ${mole}, Scar: ${scar}, Bracelet: ${bracelet}, Watch: ${watch}, Rings: ${rings}, Piercings: ${piercings}, Bag: ${bag}, Signature Detail: ${signatureItem}, Nail Style: ${nailStyle}, Necklace: ${necklace}`;

      const fallbackIdentityLock = `[INFLUENCER_NAME] identity lock: same person as the selected character sheet, consistent face structure, consistent hairstyle, consistent skin tone, consistent body proportions, consistent outfit identity, consistent expression style, and consistent signature marks. Maintain identity exactly across every generated scene.
Attributes:
- ${faceDetailsText}
- ${hairDetailsText}
- ${bodyDetailsText}
- ${uniqueMarkersText}`.replace(/\[INFLUENCER_NAME\]/g, name);

      const resolvedIdentityLock = (selectedChar.profileJson.identityLock?.trim() || fallbackIdentityLock).replace(/\[INFLUENCER_NAME\]/g, name);

      const res = await fetch('/api/generate/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: selectedCharId,
          selectedInfluencerId: selectedCharId,
          selectedInfluencerName: name,
          identityLock: resolvedIdentityLock,
          characterSheetReferenceImage: selectedChar.characterSheetUrl,
          userSceneDescription: sceneDescription,
          backgroundReferenceImage: locationRef || null,
          outfitReferenceImage: outfitRef || null,
          poseReferenceImage: poseRef || null,
          productReferenceImage: productRef || null,
          finalComposedPrompt: livePrompt.finalPrompt,
          negativePrompt: livePrompt.negativePrompt,

          aspectRatio,
          outputCount,
          locationRefUrl: locationRef,
          outfitRefUrl: outfitRef,
          poseRefUrl: poseRef,
          propRefUrl: productRef,
          location,
          timeOfDay,
          weather,
          cameraAngle,
          shotType,
          lensStyle,
          lighting,
          pose,
          expression,
          action,
          outfitInstruction,
          props,
          productPlacement,
          realismLevel,
          contentType,
          useAdvanced: false
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to compose scene');

      // Update outputs feed
      setOutputs(data.generations || []);
      
      // Trigger live credits update
      window.dispatchEvent(new Event('sync-credits'));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Scene composition failed');
    } finally {
      setGenerating(false);
    }
  };

  const cost = outputCount * 5;

  return (
    <div className="flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-violet-500" /> {t('sceneComposer')}
        </h2>
        <p className="text-xs text-gray-500 mt-1">Compose customized images of your consistent character anywhere.</p>
      </div>

      {loadingCharacters ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-violet-500 animate-spin"></div>
          <p className="text-sm text-gray-500 animate-pulse">Syncing influencer boards...</p>
        </div>
      ) : characters.length === 0 ? (
        <div className="glass-panel p-16 border-dashed border-white/5 text-center flex flex-col items-center justify-center gap-5">
          <ImageIcon className="w-14 h-14 text-gray-600 animate-pulse-slow" />
          <div className="max-w-md">
            <h3 className="font-extrabold text-white text-base">No AI Influencers found</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              You need to build and generate a Character Sheet before you can compose scenes!
            </p>
          </div>
          <Link 
            href="/characters"
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-lg transition-all btn-glow"
          >
            {t('createCharProfile')}
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left panel: Form */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Character Selection */}
            <div className="glass-panel p-6 border-white/5 flex flex-col sm:flex-row items-center gap-6 justify-between">
              <div className="flex-1 w-full flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('selectInfluencer')}</label>
                <select 
                  value={selectedCharId}
                  onChange={(e) => setSelectedCharId(e.target.value)}
                  className="glass-input text-sm font-semibold text-white w-full"
                  disabled={generating}
                >
                  <option value="" disabled>{language === 'en' ? 'Choose influencer...' : 'Pilih influencer...'}</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.niche})</option>
                  ))}
                </select>
              </div>

              {selectedChar && selectedChar.characterSheetUrl && (
                <div className="w-24 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-black/40">
                  <img src={selectedChar.characterSheetUrl} alt="Model Thumbnail" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Scene details prompt */}
            <div className="glass-panel p-6 border-white/5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('sceneDescriptionLabel')}</label>
                <textarea 
                  rows={3}
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. standing in front of Tokyo Tower at night, glowing neon lights, rain-slicked streets, wearing a black leather jacket...' : 'contoh: berdiri di depan Tokyo Tower di malam hari, lampu neon menyala, jalanan basah oleh hujan, mengenakan jaket kulit hitam...'}
                  className="glass-input text-sm"
                  disabled={generating}
                />
              </div>

              {/* Reference image grids */}
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2.5">{t('uploadGuidesLabel')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  
                  {/* Ref 1: Location */}
                  <div className="glass-panel p-3 border-dashed border-white/5 hover:border-white/20 relative flex flex-col items-center justify-center text-center aspect-square group">
                    {locationRef ? (
                      <>
                        <img src={locationRef} alt="Location Ref" className="w-full h-full object-cover rounded-lg" />
                        <button onClick={() => setLocationRef(null)} className="absolute top-1.5 right-1.5 p-1 bg-black/75 rounded-full text-gray-400 hover:text-white"><X className="w-3 h-3" /></button>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full gap-1">
                        <Upload className="w-4 h-4 text-gray-500 group-hover:text-violet-400 transition-colors" />
                        <span className="text-[9px] font-bold text-gray-500">{t('guideBackdrop')}</span>
                        <input type="file" accept="image/*" onChange={(e) => handleUploadChange(e, setLocationRef)} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Ref 2: Outfit */}
                  <div className="glass-panel p-3 border-dashed border-white/5 hover:border-white/20 relative flex flex-col items-center justify-center text-center aspect-square group">
                    {outfitRef ? (
                      <>
                        <img src={outfitRef} alt="Outfit Ref" className="w-full h-full object-cover rounded-lg" />
                        <button onClick={() => setOutfitRef(null)} className="absolute top-1.5 right-1.5 p-1 bg-black/75 rounded-full text-gray-400 hover:text-white"><X className="w-3 h-3" /></button>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full gap-1">
                        <Upload className="w-4 h-4 text-gray-500 group-hover:text-violet-400 transition-colors" />
                        <span className="text-[9px] font-bold text-gray-500">{t('guideOutfit')}</span>
                        <input type="file" accept="image/*" onChange={(e) => handleUploadChange(e, setOutfitRef)} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Ref 3: Pose */}
                  <div className="glass-panel p-3 border-dashed border-white/5 hover:border-white/20 relative flex flex-col items-center justify-center text-center aspect-square group">
                    {poseRef ? (
                      <>
                        <img src={poseRef} alt="Pose Ref" className="w-full h-full object-cover rounded-lg" />
                        <button onClick={() => setPoseRef(null)} className="absolute top-1.5 right-1.5 p-1 bg-black/75 rounded-full text-gray-400 hover:text-white"><X className="w-3 h-3" /></button>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full gap-1">
                        <Upload className="w-4 h-4 text-gray-500 group-hover:text-violet-400 transition-colors" />
                        <span className="text-[9px] font-bold text-gray-500">{t('guidePose')}</span>
                        <input type="file" accept="image/*" onChange={(e) => handleUploadChange(e, setPoseRef)} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Ref 4: Product */}
                  <div className="glass-panel p-3 border-dashed border-white/5 hover:border-white/20 relative flex flex-col items-center justify-center text-center aspect-square group">
                    {productRef ? (
                      <>
                        <img src={productRef} alt="Product Ref" className="w-full h-full object-cover rounded-lg" />
                        <button onClick={() => setProductRef(null)} className="absolute top-1.5 right-1.5 p-1 bg-black/75 rounded-full text-gray-400 hover:text-white"><X className="w-3 h-3" /></button>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full gap-1">
                        <Upload className="w-4 h-4 text-gray-500 group-hover:text-violet-400 transition-colors" />
                        <span className="text-[9px] font-bold text-gray-500">{t('guideProduct')}</span>
                        <input type="file" accept="image/*" onChange={(e) => handleUploadChange(e, setProductRef)} className="hidden" />
                      </label>
                    )}
                  </div>

                </div>
              </div>

              {/* Safety check for upload */}
              {productRef && (
                <label className="flex items-start gap-2.5 bg-red-950/10 border border-red-500/20 p-3 rounded-lg text-xs text-red-300">
                  <input 
                    type="checkbox" 
                    checked={hasHumanAgreement} 
                    onChange={(e) => setHasHumanAgreement(e.target.checked)}
                    className="mt-0.5" 
                  />
                  <span>
                    {language === 'en' 
                      ? 'I have the rights/permission to use this external reference image (Safety Policy).'
                      : 'Saya memiliki hak/izin untuk menggunakan gambar referensi eksternal ini (Safety Policy).'}
                  </span>
                </label>
              )}
            </div>

            {/* Advanced Controls accordion has been removed to prioritize manual prompts and reference images */}
          </div>

          {/* Right Panel: Prompt and trigger + Output Grid */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Composition config trigger */}
            <div className="glass-panel p-6 border-white/5 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-violet-400" /> {t('outputPreferences')}
              </h3>

              {/* Aspect Ratio */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">{t('aspectRatioLabel')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {['1:1', '4:5', '16:9'].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`
                        py-2 text-xs font-semibold rounded-lg border transition-colors
                        ${aspectRatio === ratio 
                          ? 'border-violet-500 bg-violet-600/10 text-violet-400' 
                          : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                        }
                      `}
                      disabled={generating}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                  <span>{t('batchQuantityLabel')}</span>
                  <span className="text-violet-400">{outputCount} {language === 'en' ? 'Image(s)' : 'Gambar'}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="4" 
                  value={outputCount} 
                  onChange={(e) => setOutputCount(parseInt(e.target.value))}
                  className="w-full accent-violet-500 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                  disabled={generating}
                />
              </div>

              {/* Trigger */}
              <div className="border-t border-white/5 pt-4 mt-2 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-bold bg-violet-600/10 border border-violet-500/20 px-3 py-2.5 rounded-lg">
                  <span className="text-violet-400">{t('generationCost')}</span>
                  <span className="text-violet-300">{cost} {t('credits')}</span>
                </div>

                <button
                  onClick={handleComposeScene}
                  disabled={generating || !selectedCharId}
                  className="w-full py-3 rounded-lg text-sm font-bold bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/20 text-white flex items-center justify-center gap-2 transition-all btn-glow"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'en' ? 'Composing Scenes...' : 'Membuat Scene...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{t('composeButtonText')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>



          </div>

        </div>
      )}

      {/* GENERATED SCENES GRID */}
      {outputs.length > 0 && (
        <section className="flex flex-col gap-4 border-t border-white/5 pt-8 animate-slide-up">
          <h3 className="font-bold text-base text-white">{t('generatedOutcomes')}</h3>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {outputs.map((gen) => (
              <div 
                key={gen.id} 
                className="glass-panel border-white/5 overflow-hidden group relative flex flex-col justify-between"
              >
                <div className="aspect-square w-full bg-black/40 relative overflow-hidden flex items-center justify-center">
                  <img src={gen.outputUrl || ''} alt="Compose outcome" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                    <a 
                      href={gen.outputUrl || '#'} 
                      download={`scene-${gen.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                      title="Download Scene"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <Link 
                      href={{
                        pathname: '/video-studio',
                        query: { imageId: gen.id }
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <VideoIcon className="w-3.5 h-3.5" /> {t('animateButtonText')}
                    </Link>
                  </div>
                </div>

                <div className="p-4 border-t border-white/5 text-[10px] text-gray-500 flex justify-between">
                  <span>{t('batchVariationText')}</span>
                  <span>ID: {gen.id.substring(0, 9)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GUIDE MODAL */}
      {activeGuide && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setActiveGuide(null)}>
          <div className="glass-panel border-white/10 max-w-xl w-full overflow-hidden p-6 flex flex-col gap-4 relative animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveGuide(null)} className="absolute top-4 right-4 p-1.5 bg-black/60 rounded-full text-gray-400 hover:text-white transition-colors border border-white/10">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-white">{activeGuide.title}</h3>
            <div className="aspect-square w-full rounded-lg overflow-hidden border border-white/5 bg-black/40">
              <img src={activeGuide.imagePath} alt={activeGuide.title} className="w-full h-full object-cover" />
            </div>
            <p className="text-xs text-gray-400 text-center">Click outside or press X to close this visual helper.</p>
          </div>
        </div>
      )}

    </div>
  );
}
