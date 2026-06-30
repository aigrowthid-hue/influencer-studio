import { IVideoProvider, VideoGenerationInput, VideoGenerationResult } from './video-provider';

export class FalVideoProvider implements IVideoProvider {
  private apiKey: string;
  private modelName = 'fal-ai/veo3.1/lite';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateVideo(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    try {
      // Execute queue submission to Google Veo 3.1 Lite on Fal.ai
      const res = await fetch(`https://queue.fal.run/${this.modelName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${this.apiKey}`
        },
        body: JSON.stringify({
          prompt: input.prompt,
          image_url: input.sourceImageUrl
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Fal.ai Veo 3.1 Lite queuing error');
      }

      const jobId = data.request_id;
      if (!jobId) {
        throw new Error('No request_id returned by Fal.ai video queue');
      }

      return {
        success: true,
        jobId,
        provider: 'Fal.ai',
        model: 'veo3.1-lite'
      };

    } catch (error: any) {
      console.error('Fal.ai video generation error:', error);
      return {
        success: false,
        errorMessage: error.message || 'Unknown Fal.ai Veo 3.1 Lite queue failure',
        provider: 'Fal.ai',
        model: 'veo3.1-lite'
      };
    }
  }

  async getVideoStatus(jobId: string): Promise<{ status: 'queued' | 'processing' | 'completed' | 'failed'; videoUrl?: string; thumbnailUrl?: string; errorMessage?: string }> {
    try {
      const res = await fetch(`https://queue.fal.run/${this.modelName}/requests/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Key ${this.apiKey}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        // If request is still processing on Fal.ai side, it might return 404 or 401 momentarily or normal statuses
        return { status: 'queued' };
      }

      const status = data.status; // e.g. "IN_QUEUE", "IN_PROGRESS", "COMPLETED", "FAILED"

      if (status === 'IN_QUEUE') {
        return { status: 'queued' };
      } else if (status === 'IN_PROGRESS') {
        return { status: 'processing' };
      } else if (status === 'COMPLETED') {
        const videoUrl = data.video?.url || data.outputs?.[0]?.url;
        if (!videoUrl) {
          return { status: 'failed', errorMessage: 'Job completed but no video URL found in outputs' };
        }
        return {
          status: 'completed',
          videoUrl,
          thumbnailUrl: data.video?.thumbnail_url || null
        };
      } else if (status === 'FAILED') {
        return { status: 'failed', errorMessage: data.error || 'Fal.ai job execution failed' };
      }

      return { status: 'processing' };

    } catch (error: any) {
      console.error('Fal.ai check status error:', error);
      // Fallback to processing to prevent premature job crashing on minor network drops
      return { status: 'processing' };
    }
  }
}
export default FalVideoProvider;
