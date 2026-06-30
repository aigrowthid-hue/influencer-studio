'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Video as VideoIcon, 
  Sparkles, 
  Play, 
  Pause, 
  Download, 
  Loader2, 
  Image as ImageIcon,
  MessageSquare,
  RefreshCw,
  Film,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import buildVideoPrompt from '@/lib/prompt-builders/video-builder';
import { Generation, Video } from '@/types';

export default function VideoStudioPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-violet-500 animate-spin"></div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">Initializing Video Studio...</p>
      </div>
    }>
      <VideoStudioContent />
    </Suspense>
  );
}

function VideoStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedImageId = searchParams.get('imageId') || '';

  const [sceneImages, setSceneImages] = useState<Generation[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [selectedImgId, setSelectedImgId] = useState(preSelectedImageId);
  const [selectedImg, setSelectedImg] = useState<Generation | null>(null);

  // Video Settings Form
  const [videoType, setVideoType] = useState('ugc');
  const [duration, setDuration] = useState(5);
  const [cameraMovement, setCameraMovement] = useState('slow forward zoom-in');
  const [characterMovement, setCharacterMovement] = useState('natural head turn, subtle shoulders movement');
  const [facialExpression, setFacialExpression] = useState('warm friendly smile');
  const [gesture, setGesture] = useState('none');
  const [dialogue, setDialogue] = useState('Kenapa AI Influencer studio lu sering keliatan gak konsisten? Itu karena lu belum pakai identity lock. Sini, gw ajarin caranya!');
  const [style, setStyle] = useState('realistic UGC smartphone video');

  // Generation Queue State
  const [generating, setGenerating] = useState(false);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'queued' | 'processing' | 'completed' | 'failed' | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [completedVideo, setCompletedVideo] = useState<Video | null>(null);

  // Video Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Load all user's generated scenes
  useEffect(() => {
    async function loadSceneImages() {
      try {
        const res = await fetch('/api/admin'); // retrieve user history logs
        const data = await res.json();
        if (res.ok) {
          const sessionRes = await fetch('/api/auth/session');
          const sessionData = await sessionRes.json();
          const user = sessionData.user;

          const images = (data.generations || []).filter(
            (g: any) => g.userId === user.id && g.type === 'scene_image' && g.status === 'completed'
          );
          setSceneImages(images);

          if (preSelectedImageId) {
            setSelectedImgId(preSelectedImageId);
          } else if (images.length > 0) {
            setSelectedImgId(images[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching scene images:', err);
      } finally {
        setLoadingImages(false);
      }
    }
    loadSceneImages();
  }, [preSelectedImageId]);

  // Sync selected image model
  useEffect(() => {
    if (selectedImgId) {
      const found = sceneImages.find(img => img.id === selectedImgId);
      setSelectedImg(found || null);
    } else {
      setSelectedImg(null);
    }
  }, [selectedImgId, sceneImages]);

  // Handle video playback toggles
  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Start video generation job
  const handleAnimateVideo = async () => {
    if (!selectedImgId) {
      alert('Please select a source image to animate!');
      return;
    }

    setGenerating(true);
    setJobStatus('queued');
    setProgressPercent(10);
    setStatusMessage('Queueing animation job on Google Veo adapter (50 credits)...');
    setCompletedVideo(null);

    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceImageGenerationId: selectedImgId,
          videoType,
          duration,
          cameraMovement,
          characterMovement,
          facialExpression,
          gesture,
          dialogue,
          style
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start video rendering');

      const genId = data.generation.id;
      setGenerationId(genId);
      
      // Sync credits
      window.dispatchEvent(new Event('sync-credits'));

      // Start Polling the generation status endpoint
      pollJobStatus(genId);

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Animation start failed');
      setGenerating(false);
      setJobStatus(null);
    }
  };

  // Poll status endpoint recursively
  const pollJobStatus = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/generations/${id}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error('Polling check failed');

        const status = data.generation.status;
        setJobStatus(status);

        if (status === 'queued') {
          setProgressPercent(20);
          setStatusMessage('Assigning compute nodes on Veo clusters...');
        } else if (status === 'processing') {
          // Increment progress step-by-step
          setProgressPercent(prev => Math.min(85, prev + 12));
          
          const stages = [
            'Mapping keypoints from source face...',
            'Synthesizing verbal audio tracks...',
            'Deforming grid textures for lip synchronization...',
            'Rendering frame interpolations (24fps)...',
            'Applying smartphone camera jitter...'
          ];
          const randomStage = stages[Math.floor(Math.random() * stages.length)];
          setStatusMessage(randomStage);
        } else if (status === 'completed') {
          setProgressPercent(100);
          setStatusMessage('Video composition finished!');
          
          // Load final video record
          const finalRes = await fetch('/api/admin');
          const finalData = await finalRes.json();
          const userVideos = finalData.ledgers || []; // search logs
          
          setCompletedVideo({
            id: `vid_out`,
            userId: 'usr_default',
            characterId: null,
            sourceImageGenerationId: selectedImgId,
            provider: data.generation.provider,
            model: data.generation.model,
            prompt: data.generation.prompt,
            duration,
            aspectRatio: '9:16',
            status: 'completed',
            videoUrl: data.generation.outputUrl,
            thumbnailUrl: data.generation.outputThumbnailUrl,
            creditsUsed: 50,
            createdAt: new Date().toISOString()
          });

          setGenerating(false);
          clearInterval(interval);
        } else if (status === 'failed') {
          setGenerating(false);
          setProgressPercent(0);
          setStatusMessage(`Rendering failed: ${data.generation.errorMessage || 'Unknown Error'}`);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling status:', err);
        clearInterval(interval);
        setGenerating(false);
      }
    }, 2000); // Poll every 2 seconds
  };

  const liveVideoPrompt = selectedImg
    ? buildVideoPrompt({
        videoType,
        duration,
        cameraMovement,
        characterMovement,
        facialExpression,
        gesture,
        dialogue,
        style
      })
    : null;

  return (
    <div className="flex flex-col gap-8">
      
      {/* HEADER */}
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Film className="w-5 h-5 text-violet-500" /> Video Studio
        </h2>
        <p className="text-xs text-gray-500 mt-1">Animate your generated influencer scenes into short vertical video clips.</p>
      </div>

      {loadingImages ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-violet-500 animate-spin"></div>
          <p className="text-sm text-gray-500 animate-pulse font-medium">Loading generation libraries...</p>
        </div>
      ) : sceneImages.length === 0 ? (
        <div className="glass-panel p-16 border-dashed border-white/5 text-center flex flex-col items-center justify-center gap-5">
          <ImageIcon className="w-14 h-14 text-gray-600 animate-pulse-slow" />
          <div className="max-w-md">
            <h3 className="font-extrabold text-white text-base">No source images available</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Before animating, you must first create a character and generate at least one Scene composition photo!
            </p>
          </div>
          <Link 
            href="/scene-composer"
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-lg transition-all btn-glow"
          >
            Compose a Scene
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left panel: form */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Image selection */}
            <div className="glass-panel p-6 border-white/5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Select Source Photo</label>
                <select 
                  value={selectedImgId}
                  onChange={(e) => setSelectedImgId(e.target.value)}
                  className="glass-input text-sm font-semibold text-white w-full"
                  disabled={generating}
                >
                  {sceneImages.map((img) => (
                    <option key={img.id} value={img.id}>
                      {img.id.substring(0, 9)} - "{img.prompt.substring(0, 50)}..."
                    </option>
                  ))}
                </select>
              </div>

              {selectedImg && selectedImg.outputUrl && (
                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-white/5 bg-black/40 relative flex items-center justify-center">
                  <img src={selectedImg.outputUrl} alt="Selected source" className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 rounded-full text-[10px] text-gray-300 font-medium backdrop-blur-sm border border-white/5">
                    Source Photo Preview
                  </div>
                </div>
              )}
            </div>

            {/* Animation Settings */}
            <div className="glass-panel p-6 border-white/5 flex flex-col gap-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><Film className="w-4 h-4 text-violet-400" /> Animation Presets</h3>
              
              <div className="grid sm:grid-cols-2 gap-5 border-t border-white/5 pt-5">
                
                {/* Camera Movement */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Camera Action</label>
                  <select 
                    value={cameraMovement} 
                    onChange={(e) => setCameraMovement(e.target.value)}
                    className="glass-input text-xs font-medium"
                    disabled={generating}
                  >
                    <option value="slow forward zoom-in">Subtle Dolly Zoom In</option>
                    <option value="slow backward pull-out">Dolly Zoom Out</option>
                    <option value="horizontal pan from left to right">Pan Left-to-Right</option>
                    <option value="handheld smartphone vlog style camera shake">Handheld Vlog Jitter</option>
                    <option value="cinematic circular slow orbit">Cinematic Orbit Rotation</option>
                  </select>
                </div>

                {/* Character Action */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Character Action</label>
                  <select 
                    value={characterMovement} 
                    onChange={(e) => setCharacterMovement(e.target.value)}
                    className="glass-input text-xs font-medium"
                    disabled={generating}
                  >
                    <option value="natural head turn, looking directly at the camera, blinking naturally">Head Turn & Blinking</option>
                    <option value="subtle nodding while speaking and laughing">Talking & Nodding</option>
                    <option value="adjusting clothes, checking watch, smiling">Interactive Dressing Gestures</option>
                    <option value="walking slowly towards the camera, hair blowing in the wind">Walking Forward</option>
                  </select>
                </div>

                {/* Expression */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Facial Expression</label>
                  <select 
                    value={facialExpression} 
                    onChange={(e) => setFacialExpression(e.target.value)}
                    className="glass-input text-xs font-medium"
                    disabled={generating}
                  >
                    <option value="warm friendly smile">Warm Smiling Vibe</option>
                    <option value="neutral confident posture, slight nod">Professional Calm</option>
                    <option value="playful laughing, crinkling eyes">Playful Laughing</option>
                    <option value="high fashion cold gaze, closed mouth">Editorial Gaze</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase font-semibold">Video Duration</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[5, 10].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`
                          py-2 rounded-lg text-xs font-bold border transition-colors
                          ${duration === d 
                            ? 'border-violet-500 bg-violet-600/10 text-violet-400' 
                            : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                          }
                        `}
                        disabled={generating}
                      >
                        {d} Seconds
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Dialogue text lip sync */}
              <div className="flex flex-col gap-1.5 border-t border-white/5 pt-5">
                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-violet-400" /> Speech & Dialogue Monologue (Indonesia/English)
                </label>
                <textarea 
                  rows={2}
                  value={dialogue}
                  onChange={(e) => setDialogue(e.target.value)}
                  placeholder="e.g. Halo semuanya! Selamat datang di vlog gw hari ini..."
                  className="glass-input text-xs"
                  disabled={generating}
                />
              </div>

            </div>

          </div>

          {/* Right panel: Player and Status Ticker */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Player Frame / Progress Bar */}
            <div className="glass-panel p-6 border-white/5 flex flex-col gap-6 items-center">
              
              {/* Vertical Player Panel */}
              <div className="w-64 aspect-[9/16] rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl relative group flex items-center justify-center">
                
                {/* 1. STATE: IDLE (Wait for animation request) */}
                {!generating && !completedVideo && selectedImg && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/40 z-10">
                    <div className="w-14 h-14 rounded-full bg-violet-600/20 border border-violet-500/20 flex items-center justify-center mb-4">
                      <VideoIcon className="w-6 h-6 text-violet-400 animate-pulse-slow" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Animate Image</h4>
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                      Render this photo into a {duration}s Reels-friendly vertical video.
                    </p>
                  </div>
                )}

                {/* 2. STATE: RUNNING (ASYNC QUEUE STATUS PULSER) */}
                {generating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#07070a] z-10">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-6" />
                    
                    {/* Status percent indicator */}
                    <div className="w-full flex justify-between text-[10px] uppercase font-bold text-gray-500 mb-1.5">
                      <span>Rendering status</span>
                      <span className="text-violet-400">{progressPercent}%</span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-4 border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <p className="text-[10px] text-violet-300 text-center font-medium leading-relaxed italic animate-pulse">
                      "{statusMessage}"
                    </p>
                  </div>
                )}

                {/* 3. STATE: COMPLETED (Play Vertical Video Clip) */}
                {completedVideo && completedVideo.videoUrl && (
                  <>
                    <video 
                      ref={videoRef}
                      src={completedVideo.videoUrl}
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Player controls overlays */}
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 z-20">
                      <span className="self-start text-[9px] uppercase font-bold tracking-widest bg-green-600/30 text-green-300 border border-green-500/20 px-2 py-0.5 rounded-full">
                        rendered
                      </span>
                      
                      <button 
                        onClick={handlePlayToggle}
                        className="self-center p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10"
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white" />}
                      </button>

                      <a 
                        href={completedVideo.videoUrl} 
                        download="ai-influencer-short.mp4"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-lg text-center flex items-center justify-center gap-1 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Download MP4
                      </a>
                    </div>
                  </>
                )}

                {/* Background poster when not playing */}
                {!generating && !isPlaying && selectedImg && (
                  <img src={selectedImg.outputUrl || ''} alt="Video Poster" className="absolute inset-0 w-full h-full object-cover -z-10" />
                )}
              </div>

              {/* Cost card & Action */}
              {!generating && !completedVideo && (
                <div className="w-full flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-bold bg-violet-600/10 border border-violet-500/20 px-3 py-2.5 rounded-lg w-full">
                    <span className="text-violet-400">Rendering Cost:</span>
                    <span className="text-violet-300">50 Credits</span>
                  </div>
                  
                  <button
                    onClick={handleAnimateVideo}
                    disabled={!selectedImgId}
                    className="w-full py-3 rounded-lg text-sm font-bold bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/20 text-white flex items-center justify-center gap-1.5 transition-all btn-glow"
                  >
                    <Sparkles className="w-4 h-4" /> Animate Video Clip
                  </button>
                </div>
              )}

              {/* Status details when finished */}
              {completedVideo && (
                <div className="w-full flex flex-col gap-3.5 border-t border-white/5 pt-5 mt-2 animate-slide-up">
                  <div className="flex items-center gap-2 text-xs text-green-400 font-bold">
                    <CheckCircle className="w-4 h-4" /> Loop ready for Reels, TikTok, Shorts
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[10px] text-gray-400">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-gray-500 block uppercase font-semibold">PROVIDER</span>
                      <span className="font-medium text-white">{completedVideo.provider}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-gray-500 block uppercase font-semibold">MODEL USED</span>
                      <span className="font-medium text-white">{completedVideo.model}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setCompletedVideo(null);
                      setJobStatus(null);
                    }}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-semibold border border-white/10 transition-colors"
                  >
                    Animate Another Version
                  </button>
                </div>
              )}

            </div>

            {/* Live video prompt text debug */}
            {liveVideoPrompt && !generating && !completedVideo && (
              <div className="glass-panel p-6 border-white/5 flex flex-col gap-2">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Animation Prompt Details</h4>
                <div className="max-h-24 overflow-y-auto text-[10px] font-mono text-gray-500 leading-relaxed bg-black/30 border border-white/5 p-3 rounded-lg select-none">
                  {liveVideoPrompt.finalPrompt}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
