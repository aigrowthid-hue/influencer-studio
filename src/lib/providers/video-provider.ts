export interface VideoGenerationInput {
  sourceImageUrl: string;
  prompt: string;
  duration?: number;
  aspectRatio?: string;
  movement?: string;
  dialogue?: string;
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  provider: string;
  model: string;
  jobId?: string;
}

export interface IVideoProvider {
  generateVideo(input: VideoGenerationInput): Promise<VideoGenerationResult>;
  getVideoStatus(jobId: string): Promise<{ status: 'queued' | 'processing' | 'completed' | 'failed'; videoUrl?: string; thumbnailUrl?: string; errorMessage?: string }>;
}
