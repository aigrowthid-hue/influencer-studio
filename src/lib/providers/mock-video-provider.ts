import { IVideoProvider, VideoGenerationInput, VideoGenerationResult } from './video-provider';

interface ActiveJob {
  id: string;
  createdAt: number;
  videoUrl: string;
  thumbnailUrl: string;
  prompt: string;
}

// Vimeo/Pexels vertical videos matching various influencer vibes
const STOCK_VIDEOS = {
  beauty: {
    video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c022f733f38cf662120ecb073c8e54e8&profile_id=165&oauth2_token_id=57447761',
    thumbnail: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=400&q=80'
  },
  fitness: {
    video: 'https://player.vimeo.com/external/434045526.sd.mp4?s=c27c2d19738b556f8f53703d1685954608c02821&profile_id=165&oauth2_token_id=57447761',
    thumbnail: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=400&q=80'
  },
  travel: {
    video: 'https://player.vimeo.com/external/459389137.sd.mp4?s=87ae39afdc4c08466e3fb0ef4575c3db08cd916c&profile_id=165&oauth2_token_id=57447761',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80'
  },
  tech: {
    video: 'https://player.vimeo.com/external/409204099.sd.mp4?s=d7e5d8ec081bc1379fb04f4ecf5569c73e04d41e&profile_id=165&oauth2_token_id=57447761',
    thumbnail: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80'
  },
  default: {
    video: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c022f733f38cf662120ecb073c8e54e8&profile_id=165&oauth2_token_id=57447761',
    thumbnail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80'
  }
};

export class MockVideoProvider implements IVideoProvider {
  // In-memory job state store
  private static jobs: Map<string, ActiveJob> = new Map();

  async generateVideo(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    const jobId = `vidjob_${Math.random().toString(36).substring(2, 11)}`;
    const promptText = input.prompt.toLowerCase();
    
    // Choose appropriate vertical video based on prompt
    let selectedAsset = STOCK_VIDEOS.default;
    
    if (promptText.includes('fitness') || promptText.includes('workout') || promptText.includes('gym') || promptText.includes('running')) {
      selectedAsset = STOCK_VIDEOS.fitness;
    } else if (promptText.includes('travel') || promptText.includes('pantai') || promptText.includes('beach') || promptText.includes('vlog')) {
      selectedAsset = STOCK_VIDEOS.travel;
    } else if (promptText.includes('tech') || promptText.includes('monologue') || promptText.includes('speak') || promptText.includes('review')) {
      selectedAsset = STOCK_VIDEOS.tech;
    } else if (promptText.includes('beauty') || promptText.includes('skincare') || promptText.includes('makeup')) {
      selectedAsset = STOCK_VIDEOS.beauty;
    }

    // Register job
    MockVideoProvider.jobs.set(jobId, {
      id: jobId,
      createdAt: Date.now(),
      videoUrl: selectedAsset.video,
      thumbnailUrl: selectedAsset.thumbnail,
      prompt: input.prompt
    });

    return {
      success: true,
      jobId,
      provider: 'MockVideoProvider',
      model: 'mock-veo'
    };
  }

  async getVideoStatus(jobId: string): Promise<{ status: 'queued' | 'processing' | 'completed' | 'failed'; videoUrl?: string; thumbnailUrl?: string; errorMessage?: string }> {
    const job = MockVideoProvider.jobs.get(jobId);
    if (!job) {
      return { status: 'failed', errorMessage: 'Job not found' };
    }

    const elapsedMs = Date.now() - job.createdAt;
    
    // Status Transitions:
    // 0 - 4s: queued
    // 4 - 10s: processing
    // > 10s: completed
    if (elapsedMs < 4000) {
      return { status: 'queued' };
    } else if (elapsedMs < 10000) {
      return { status: 'processing' };
    } else {
      return {
        status: 'completed',
        videoUrl: job.videoUrl,
        thumbnailUrl: job.thumbnailUrl
      };
    }
  }
}
export default MockVideoProvider;
